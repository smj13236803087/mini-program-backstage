'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { Button, Form, Input, InputNumber, Modal, Select, Space, Table, Typography } from 'antd'

type ProductRow = {
  id: string
  materialCode: string | null
  title: string
  price: any
  diameter: string | null
  weight: string | null
  imageUrl: string | null
  majorCategory: string | null
  productGender: string | null
  colorSeries: string | null
  coreEnergyTag: string | null
  mineVeinTrace: string | null
  materialTrace: string | null
  visualFeatures: string | null
  classicSixDimensions: string | null
  zodiac: string | null
  fiveElements: string | null
  constellation: string | null
  chakra: string | null
  createdAt: string
  updatedAt: string
}

type AtlasOption = {
  id: string
  title: string
  majorCategory: string | null
}

type ProductFormValues = {
  atlasId?: string
  materialCode?: string | null
  price: number
  diameter?: string
  weight?: string
}

export default function DashboardProductsPage() {
  const [newSearchType, setNewSearchType] = useState('all')
  const [oldSearchType, setOldSearchType] = useState('all')
  const [newSearchValue, setNewSearchValue] = useState('')
  const [oldSearchValue, setOldSearchValue] = useState('')
  const [hasSearch, setHasSearch] = useState(false)

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [products, setProducts] = useState<ProductRow[]>([])

  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ProductRow | null>(null)
  const [form] = Form.useForm<ProductFormValues>()
  const [atlasOptions, setAtlasOptions] = useState<{ label: string; value: string }[]>([])
  const [atlasLoading, setAtlasLoading] = useState(false)

  const emptyFormValues: ProductFormValues = {
    atlasId: undefined,
    materialCode: '',
    price: 0,
    diameter: '',
    weight: '',
  }

  const formInitialValues: ProductFormValues = editing
    ? {
        materialCode: editing.materialCode || '',
        price: Number(editing.price || 0),
        diameter: editing.diameter || '',
        weight: editing.weight || '',
      }
    : emptyFormValues

  // AntD Form 的 `initialValues` 只在首次挂载时生效；
  // 这里在每次打开 Modal/切换编辑对象时强制同步表单字段，避免生产环境出现“沿用上一次编辑内容”的问题。
  useEffect(() => {
    if (!modalOpen) return
    form.setFieldsValue(formInitialValues)
  }, [modalOpen, editing])

  useEffect(() => {
    if (!modalOpen || editing) return
    let cancelled = false
    ;(async () => {
      setAtlasLoading(true)
      try {
        const res = await fetch('/api/admin/product-atlas?page=1&pageSize=2000')
        const json = await res.json().catch(() => ({}))
        if (!res.ok || cancelled) return
        const rows = (json?.atlases || []) as AtlasOption[]
        setAtlasOptions(
          rows.map((a) => ({
            value: a.id,
            label: `${a.title}${a.majorCategory ? ` · ${a.majorCategory}` : ''}`,
          }))
        )
      } catch {
        if (!cancelled) setAtlasOptions([])
      } finally {
        if (!cancelled) setAtlasLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [modalOpen, editing])

  const queryKey = useMemo(() => {
    const sp = new URLSearchParams()
    const q = (hasSearch ? newSearchValue : oldSearchValue).trim()
    const field = (hasSearch ? newSearchType : oldSearchType).trim()
    if (q) sp.set('q', q)
    if (field && field !== 'all') sp.set('field', field)
    sp.set('page', String(pagination.current))
    sp.set('pageSize', String(pagination.pageSize))
    return sp.toString()
  }, [
    hasSearch,
    newSearchValue,
    oldSearchValue,
    newSearchType,
    oldSearchType,
    pagination.current,
    pagination.pageSize,
  ])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/products?${queryKey}`)
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(json?.error || `加载失败（${res.status}）`)
        setProducts([])
        return
      }
      setProducts(json?.products || [])
      const total = json?.total || 0
      setPagination((p) => ({ ...p, total }))
    } catch (e) {
      setError(`加载失败：${String(e)}`)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey])

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const openEdit = (p: ProductRow) => {
    setEditing(p)
    setModalOpen(true)
  }

  const submit = async (values: ProductFormValues) => {
    const payload: any = {
      price: Number(values.price),
      diameter: (values.diameter || '').trim(),
      weight: (values.weight || '').trim() || null,
      materialCode: (values.materialCode || '').trim(),
    }
    if (!editing) {
      const aid = (values.atlasId || '').trim()
      if (!aid) {
        setError('请选择图鉴')
        return
      }
      payload.atlasId = aid
    }

    setSaving(true)
    setError(null)
    try {
      const isEdit = Boolean(editing?.id)
      const url = isEdit ? `/api/admin/products/${editing!.id}` : '/api/admin/products'
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(json?.error || `保存失败（${res.status}）`)
        return
      }
      setModalOpen(false)
      await load()
    } catch (e) {
      setError(`保存失败：${String(e)}`)
    } finally {
      setSaving(false)
    }
  }

  async function remove(p: ProductRow) {
    const ok = confirm(`确认删除商品？\n\n商品ID：${p.id}\n标题：${p.title}\n\n删除后不可恢复。`)
    if (!ok) return

    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/products/${p.id}`, { method: 'DELETE' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(json?.error || `删除失败（${res.status}）`)
        return
      }
      await load()
    } catch (e) {
      setError(`删除失败：${String(e)}`)
    } finally {
      setLoading(false)
    }
  }

  const triggerSearch = () => {
    setOldSearchValue(newSearchValue)
    setOldSearchType(newSearchType)
    if (hasSearch) {
      void load()
    } else {
      setHasSearch(true)
    }
    setPagination((p) => ({ ...p, current: 1 }))
  }

  const searchOptions = [
    { label: '全部', value: 'all' },
    { label: '商品ID', value: 'id' },
    { label: '商品标题', value: 'title' },
    { label: '物料编号', value: 'materialCode' },
    { label: '大分类', value: 'majorCategory' },
    { label: '直径规格', value: 'diameter' },
    { label: '创建时间（输入日期）', value: 'createdAt' },
    { label: '更新时间（输入日期）', value: 'updatedAt' },
  ]

  const columns = [
    { title: '物料名称', dataIndex: 'title', key: 'title', width: 160, render: (v: string) => v || '-' },
    { title: '物料编号', dataIndex: 'materialCode', key: 'materialCode', width: 160 },
    {
      title: '大分类',
      dataIndex: 'majorCategory',
      key: 'majorCategory',
      width: 140,
      render: (v: string | null) => v || '-',
    },
    { title: '单价（元）', dataIndex: 'price', key: 'price', width: 130, render: (v: any) => String(v) },
    { title: '尺寸', dataIndex: 'diameter', key: 'diameter', width: 130, render: (v: string | null) => v || '-' },
    { title: '重量', dataIndex: 'weight', key: 'weight', width: 130, render: (v: string | null) => v || '-' },
    {
      title: '操作',
      key: 'actions',
      fixed: 'right' as const,
      width: 180,
      render: (_: any, p: ProductRow) => (
        <Space>
          <Button size="small" onClick={() => openEdit(p)} icon={<EditOutlined />}>
            编辑
          </Button>
          <Button size="small" danger onClick={() => remove(p)} icon={<DeleteOutlined />}>
            删除
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          商品列表
        </Typography.Title>
        <Space wrap>
          <Button type="primary" onClick={openCreate} icon={<PlusOutlined />}>
            新增商品
          </Button>
        </Space>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <Space.Compact style={{ width: 480 }}>
          <Select value={newSearchType} onChange={setNewSearchType} style={{ width: 170 }} options={searchOptions} />
          <Input
            placeholder="请输入关键词"
            value={newSearchValue}
            onChange={(e) => {
              setNewSearchValue(e.target.value)
              setHasSearch(false)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') triggerSearch()
            }}
          />
          <Button type="primary" onClick={triggerSearch} icon={<SearchOutlined />}>
            搜索
          </Button>
        </Space.Compact>

        <div style={{ color: '#64748b', marginLeft: 'auto' }}>
          共 <span style={{ fontWeight: 600, color: '#0f172a' }}>{pagination.total}</span> 条
        </div>
      </div>

      {error ? (
        <div style={{ border: '1px solid #fecaca', background: '#fff1f2', padding: 12, borderRadius: 8, color: '#be123c' }}>
          {error}
        </div>
      ) : null}

      <Table
        columns={columns as any}
        dataSource={products}
        rowKey="id"
        loading={{ spinning: loading, tip: '加载中...' }}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showTotal: (t) => `总计 ${t} 条`,
        }}
        onChange={(p: any) => {
          setPagination((prev) => ({
            ...prev,
            current: p.current || 1,
            pageSize: p.pageSize || prev.pageSize,
          }))
        }}
        scroll={{ x: 'max-content' }}
      />

      <Modal
        title={editing ? '编辑商品' : '新增商品'}
        open={modalOpen}
        okText="保存"
        cancelText="取消"
        confirmLoading={saving}
        onOk={() => form.submit()}
        onCancel={() => {
          if (saving) return
          setModalOpen(false)
        }}
        destroyOnClose
      >
        <Form
          key={editing?.id || 'create'}
          form={form}
          layout="vertical"
          onFinish={submit}
          preserve={false}
          initialValues={formInitialValues}
        >
          <Form.Item
            name="materialCode"
            label="物料编号"
            rules={[{ required: true, message: '请输入物料编号' }]}
          >
            <Input placeholder="必填，需唯一" />
          </Form.Item>
          {!editing ? (
            <Form.Item
              name="atlasId"
              label="关联图鉴"
              rules={[{ required: true, message: '请选择图鉴' }]}
            >
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="搜索并选择图鉴"
                loading={atlasLoading}
                options={atlasOptions}
                allowClear={false}
              />
            </Form.Item>
          ) : null}
          <Form.Item
            name="price"
            label="价格（元）"
            rules={[{ required: true, message: '请输入价格' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Space style={{ width: '100%', marginTop: 12 }} size={12}>
            <Form.Item
              name="diameter"
              label="直径"
              style={{ flex: 1, marginBottom: 0 }}
              rules={[{ required: true, message: '请输入直径' }]}
            >
              <Input placeholder="例如：6mm" />
            </Form.Item>
            <Form.Item name="weight" label="重量" style={{ flex: 1, marginBottom: 0 }}>
              <Input placeholder="例如：1.2g" />
            </Form.Item>
          </Space>

        </Form>
      </Modal>
    </div>
  )
}

