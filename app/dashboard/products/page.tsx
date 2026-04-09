'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import { Button, Form, Image, Input, InputNumber, Modal, Select, Space, Table, Typography } from 'antd'

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

type ProductFormValues = {
  materialCode?: string
  title: string
  price: number
  diameter?: string
  weight?: string
  imageUrl?: string
  majorCategory?: string
  productGender?: string
  colorSeries?: string
  coreEnergyTag?: string
  mineVeinTrace?: string
  materialTrace?: string
  visualFeatures?: string
  classicSixDimensions?: string
  zodiac?: string
  fiveElements?: string
  constellation?: string
  chakra?: string
}

export default function DashboardProductsPage() {
  const [newSearchType, setNewSearchType] = useState('all')
  const [oldSearchType, setOldSearchType] = useState('all')
  const [newSearchValue, setNewSearchValue] = useState('')
  const [oldSearchValue, setOldSearchValue] = useState('')
  const [hasSearch, setHasSearch] = useState(false)

  const [isSort, setIsSort] = useState(false)
  const [sortConfig, setSortConfig] = useState<{
    key: string
    order: 'asc' | 'desc' | null
  }>({ key: '', order: null })

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [products, setProducts] = useState<ProductRow[]>([])

  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ProductRow | null>(null)
  const [form] = Form.useForm<ProductFormValues>()
  const imageUrlValue = Form.useWatch('imageUrl', form)

  const emptyFormValues: ProductFormValues = {
    materialCode: '',
    title: '',
    price: 0,
    diameter: '',
    weight: '',
    imageUrl: '',
    majorCategory: '',
    productGender: '',
    colorSeries: '',
    coreEnergyTag: '',
    mineVeinTrace: '',
    materialTrace: '',
    visualFeatures: '',
    classicSixDimensions: '',
    zodiac: '',
    fiveElements: '',
    constellation: '',
    chakra: '',
  }

  const formInitialValues: ProductFormValues = editing
    ? {
        materialCode: editing.materialCode || '',
        title: editing.title || '',
        price: Number(editing.price || 0),
        diameter: editing.diameter || '',
        weight: editing.weight || '',
        imageUrl: editing.imageUrl || '',
        majorCategory: editing.majorCategory || '',
        productGender: editing.productGender || '',
        colorSeries: editing.colorSeries || '',
        coreEnergyTag: editing.coreEnergyTag || '',
        mineVeinTrace: editing.mineVeinTrace || '',
        materialTrace: editing.materialTrace || '',
        visualFeatures: editing.visualFeatures || '',
        classicSixDimensions: editing.classicSixDimensions || '',
        zodiac: editing.zodiac || '',
        fiveElements: editing.fiveElements || '',
        constellation: editing.constellation || '',
        chakra: editing.chakra || '',
      }
    : emptyFormValues

  // AntD Form 的 `initialValues` 只在首次挂载时生效；
  // 这里在每次打开 Modal/切换编辑对象时强制同步表单字段，避免生产环境出现“沿用上一次编辑内容”的问题。
  useEffect(() => {
    if (!modalOpen) return
    form.setFieldsValue(formInitialValues)
  }, [modalOpen, editing])

  const queryKey = useMemo(() => {
    const sp = new URLSearchParams()
    const q = (hasSearch ? newSearchValue : oldSearchValue).trim()
    const field = (hasSearch ? newSearchType : oldSearchType).trim()
    if (q) sp.set('q', q)
    if (field && field !== 'all') sp.set('field', field)
    if (sortConfig.key && sortConfig.order) sp.set('sort', `${sortConfig.key}:${sortConfig.order}`)
    sp.set('page', String(pagination.current))
    sp.set('pageSize', String(pagination.pageSize))
    return sp.toString()
  }, [
    hasSearch,
    newSearchValue,
    oldSearchValue,
    newSearchType,
    oldSearchType,
    sortConfig.key,
    sortConfig.order,
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
      title: values.title.trim(),
      price: Number(values.price),
      diameter: (values.diameter || '').trim() || null,
      weight: (values.weight || '').trim() || null,
      imageUrl: (values.imageUrl || '').trim() || null,
      majorCategory: (values.majorCategory || '').trim() || null,
      productGender: (values.productGender || '').trim() || null,
      colorSeries: (values.colorSeries || '').trim() || null,
      coreEnergyTag: (values.coreEnergyTag || '').trim() || null,
      mineVeinTrace: (values.mineVeinTrace || '').trim() || null,
      materialTrace: (values.materialTrace || '').trim() || null,
      visualFeatures: (values.visualFeatures || '').trim() || null,
      classicSixDimensions: (values.classicSixDimensions || '').trim() || null,
      zodiac: (values.zodiac || '').trim() || null,
      fiveElements: (values.fiveElements || '').trim() || null,
      constellation: (values.constellation || '').trim() || null,
      chakra: (values.chakra || '').trim() || null,
    }
    if (!editing) {
      payload.materialCode = (values.materialCode || '').trim() || null
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

  async function uploadImage(file: File) {
    setUploading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload/product-image', {
        method: 'POST',
        body: fd,
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(json?.error || `上传失败（${res.status}）`)
        return
      }
      const url = json?.url || ''
      if (!url) {
        setError('上传成功但未返回 url')
        return
      }
      form.setFieldValue('imageUrl', url)
    } catch (e) {
      setError(`上传失败：${String(e)}`)
    } finally {
      setUploading(false)
    }
  }

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, order: prev.order === 'desc' ? 'asc' : 'desc' }
      }
      return { key, order: 'desc' }
    })
    setIsSort(true)
  }

  useEffect(() => {
    if (!isSort) return
    void load()
    setIsSort(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSort])

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
    {
      title: '图片',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 90,
      render: (url: string | null, p: ProductRow) =>
        url ? (
          <Image
            src={url}
            alt={p.title}
            width={48}
            height={48}
            style={{ objectFit: 'cover', borderRadius: 8 }}
            preview={{ mask: '查看' }}
          />
        ) : (
          <div style={{ width: 48, height: 48, borderRadius: 8, border: '1px solid #e2e8f0', background: '#f1f5f9' }} />
        ),
    },
    {
      title: '商品',
      dataIndex: 'title',
      key: 'title',
      width: 260,
      render: (t: string, p: ProductRow) => (
        <div>
          <div style={{ fontWeight: 600 }}>{t}</div>
        </div>
      ),
    },
    { title: '物料编号', dataIndex: 'materialCode', key: 'materialCode', width: 120 },
    { title: '大分类', dataIndex: 'majorCategory', key: 'majorCategory', width: 120 },
    { title: '性别', dataIndex: 'productGender', key: 'productGender', width: 100 },
    { title: '色系', dataIndex: 'colorSeries', key: 'colorSeries', width: 120 },
    {
      title: '核心能量标签',
      dataIndex: 'coreEnergyTag',
      key: 'coreEnergyTag',
      width: 200,
      render: (v: string | null) =>
        v ? (
          <span title={v}>
            {v.slice(0, 40)}
            {v.length > 40 ? '...' : ''}
          </span>
        ) : (
          '-'
        ),
    },
    {
      title: '矿脉溯源',
      dataIndex: 'mineVeinTrace',
      key: 'mineVeinTrace',
      width: 220,
      render: (v: string | null) => (v ? <span title={v}>{v}</span> : '-'),
    },
    {
      title: '材质溯源',
      dataIndex: 'materialTrace',
      key: 'materialTrace',
      width: 220,
      render: (v: string | null) => (v ? <span title={v}>{v}</span> : '-'),
    },
    {
      title: '视觉特征',
      dataIndex: 'visualFeatures',
      key: 'visualFeatures',
      width: 220,
      render: (v: string | null) => (v ? <span title={v}>{v}</span> : '-'),
    },
    {
      title: '经典六维',
      dataIndex: 'classicSixDimensions',
      key: 'classicSixDimensions',
      width: 220,
      render: (v: string | null) => (v ? <span title={v}>{v}</span> : '-'),
    },
    { title: '生肖', dataIndex: 'zodiac', key: 'zodiac', width: 100 },
    { title: '五行', dataIndex: 'fiveElements', key: 'fiveElements', width: 100 },
    { title: '星座', dataIndex: 'constellation', key: 'constellation', width: 100 },
    { title: '脉轮', dataIndex: 'chakra', key: 'chakra', width: 100 },
    { title: '价格', dataIndex: 'price', key: 'price', width: 110, render: (v: any) => String(v) },
    {
      title: '直径',
      dataIndex: 'diameter',
      key: 'diameter',
      width: 120,
      render: (v: string | null) => v || '-',
    },
    { title: '重量', dataIndex: 'weight', key: 'weight', width: 120, render: (v: string | null) => v || '-' },
    {
      title: (
        <span
          style={{
            cursor: 'pointer',
            fontWeight: sortConfig.key === 'createdAt' ? 600 : 400,
            color: sortConfig.key === 'createdAt' ? '#1677ff' : 'inherit',
          }}
          onClick={() => handleSort('createdAt')}
        >
          创建时间
          {sortConfig.key === 'createdAt' ? (
            sortConfig.order === 'desc' ? (
              <ArrowDownOutlined style={{ marginLeft: 6, color: '#1677ff', fontSize: 12 }} />
            ) : (
              <ArrowUpOutlined style={{ marginLeft: 6, color: '#1677ff', fontSize: 12 }} />
            )
          ) : (
            <ArrowDownOutlined style={{ marginLeft: 6, color: '#666', fontSize: 12 }} />
          )}
        </span>
      ),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 190,
      render: (iso: string) => (iso ? new Date(iso).toLocaleString() : '-'),
    },
    {
      title: (
        <span
          style={{
            cursor: 'pointer',
            fontWeight: sortConfig.key === 'updatedAt' ? 600 : 400,
            color: sortConfig.key === 'updatedAt' ? '#1677ff' : 'inherit',
          }}
          onClick={() => handleSort('updatedAt')}
        >
          更新时间
          {sortConfig.key === 'updatedAt' ? (
            sortConfig.order === 'desc' ? (
              <ArrowDownOutlined style={{ marginLeft: 6, color: '#1677ff', fontSize: 12 }} />
            ) : (
              <ArrowUpOutlined style={{ marginLeft: 6, color: '#1677ff', fontSize: 12 }} />
            )
          ) : (
            <ArrowDownOutlined style={{ marginLeft: 6, color: '#666', fontSize: 12 }} />
          )}
        </span>
      ),
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 190,
      render: (iso: string) => (iso ? new Date(iso).toLocaleString() : '-'),
    },
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
          if (saving || uploading) return
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
          {!editing ? (
            <Form.Item name="materialCode" label="物料编号">
              <Input placeholder="可选，需唯一" />
            </Form.Item>
          ) : null}
          <Form.Item name="title" label="物料名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="majorCategory" label="大分类">
            <Input placeholder="例如：主珠、配珠" />
          </Form.Item>
          <Form.Item name="productGender" label="性别">
            <Input />
          </Form.Item>
          <Form.Item name="colorSeries" label="色系（含色系归属）">
            <Input placeholder="#RRGGBB 或文字" />
          </Form.Item>
          <Form.Item name="coreEnergyTag" label="核心能量标签">
            <Input.TextArea rows={2} placeholder="可填写标签或短说明" />
          </Form.Item>
          <Form.Item name="mineVeinTrace" label="矿脉溯源">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="materialTrace" label="材质溯源">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="visualFeatures" label="视觉特征">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="classicSixDimensions" label="经典六维">
            <Input.TextArea rows={3} placeholder="可为 JSON 或长文本" />
          </Form.Item>
          <Form.Item name="zodiac" label="生肖">
            <Input placeholder="如：鼠、牛 或多选说明" />
          </Form.Item>
          <Form.Item name="fiveElements" label="五行">
            <Input placeholder="如：金、木" />
          </Form.Item>
          <Form.Item name="constellation" label="星座">
            <Input />
          </Form.Item>
          <Form.Item name="chakra" label="脉轮">
            <Input />
          </Form.Item>
          <Form.Item
            name="price"
            label="价格（元）"
            rules={[{ required: true, message: '请输入价格' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Space style={{ width: '100%', marginTop: 12 }} size={12}>
            <Form.Item name="diameter" label="直径" style={{ flex: 1, marginBottom: 0 }}>
              <Input placeholder="例如：6mm" />
            </Form.Item>
            <Form.Item name="weight" label="重量" style={{ flex: 1, marginBottom: 0 }}>
              <Input placeholder="例如：1.2g" />
            </Form.Item>
          </Space>

          <Form.Item label="图片" style={{ marginTop: 12 }}>
            <Space direction="vertical" style={{ width: '100%' }} size={8}>
              <Space wrap>
                <Button
                  onClick={() => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = 'image/*'
                    input.onchange = () => {
                      const file = (input.files || [])[0]
                      if (!file) return
                      void uploadImage(file)
                    }
                    input.click()
                  }}
                  disabled={uploading || saving}
                  icon={<UploadOutlined />}
                >
                  {uploading ? '上传中...' : '选择并上传'}
                </Button>
                {imageUrlValue ? (
                  <Image
                    src={String(imageUrlValue)}
                    width={64}
                    height={64}
                    style={{ objectFit: 'cover', borderRadius: 8 }}
                    preview
                  />
                ) : null}
              </Space>
              <Form.Item name="imageUrl" noStyle>
                <Input placeholder="也可以直接粘贴图片 URL" />
              </Form.Item>
            </Space>
          </Form.Item>

        </Form>
      </Modal>
    </div>
  )
}

