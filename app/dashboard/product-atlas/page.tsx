'use client'

import { useEffect, useMemo, useState } from 'react'
import { Image, Input, Select, Space, Table, Typography, Button, Form, Modal } from 'antd'
import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined, UploadOutlined } from '@ant-design/icons'

type AtlasRow = {
  id: string
  title: string
  imageUrl: string | null
  majorCategory: string | null
  coreEnergyTag: string | null
  mineVeinTrace: string | null
  materialTrace: string | null
  visualFeatures: string | null
  classicSixDimensions: string | null
  zodiac: string | null
  fiveElements: string | null
  constellation: string | null
  chakra: string | null
  updatedAt: string
}

export default function DashboardProductAtlasPage() {
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
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [atlases, setAtlases] = useState<AtlasRow[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AtlasRow | null>(null)
  const [form] = Form.useForm<AtlasRow>()
  const imageUrlValue = Form.useWatch('imageUrl', form)

  const queryKey = useMemo(() => {
    const sp = new URLSearchParams()
    const q = (hasSearch ? newSearchValue : oldSearchValue).trim()
    const field = (hasSearch ? newSearchType : oldSearchType).trim()
    if (q) sp.set('q', q)
    if (field && field !== 'all') sp.set('field', field)
    sp.set('page', String(pagination.current))
    sp.set('pageSize', String(pagination.pageSize))
    return sp.toString()
  }, [hasSearch, newSearchValue, oldSearchValue, newSearchType, oldSearchType, pagination.current, pagination.pageSize])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/product-atlas?${queryKey}`)
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(json?.error || `加载失败（${res.status}）`)
        setAtlases([])
        return
      }
      setAtlases(json?.atlases || [])
      setPagination((p) => ({ ...p, total: json?.total || 0 }))
    } catch (e) {
      setError(`加载失败：${String(e)}`)
      setAtlases([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey])

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
    { label: '商品名', value: 'title' },
    { label: '大分类', value: 'majorCategory' },
    { label: '核心能量标签', value: 'coreEnergyTag' },
  ]

  const columns = [
    {
      title: '图片',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 90,
      render: (url: string | null, p: AtlasRow) =>
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
    { title: '商品名', dataIndex: 'title', key: 'title', width: 180, render: (v: string) => v || '-' },
    { title: '大分类', dataIndex: 'majorCategory', key: 'majorCategory', width: 120, render: (v: string | null) => v || '-' },
    { title: '核心能量标签', dataIndex: 'coreEnergyTag', key: 'coreEnergyTag', width: 220, render: (v: string | null) => v || '-' },
    { title: '矿脉溯源', dataIndex: 'mineVeinTrace', key: 'mineVeinTrace', width: 220, render: (v: string | null) => v || '-' },
    { title: '材质溯源', dataIndex: 'materialTrace', key: 'materialTrace', width: 220, render: (v: string | null) => v || '-' },
    { title: '视觉特征', dataIndex: 'visualFeatures', key: 'visualFeatures', width: 220, render: (v: string | null) => v || '-' },
    { title: '经典六维', dataIndex: 'classicSixDimensions', key: 'classicSixDimensions', width: 220, render: (v: string | null) => v || '-' },
    { title: '生肖', dataIndex: 'zodiac', key: 'zodiac', width: 100, render: (v: string | null) => v || '-' },
    { title: '五行', dataIndex: 'fiveElements', key: 'fiveElements', width: 100, render: (v: string | null) => v || '-' },
    { title: '星座', dataIndex: 'constellation', key: 'constellation', width: 120, render: (v: string | null) => v || '-' },
    { title: '脉轮', dataIndex: 'chakra', key: 'chakra', width: 120, render: (v: string | null) => v || '-' },
    {
      title: '操作',
      key: 'actions',
      fixed: 'right' as const,
      width: 180,
      render: (_: unknown, row: AtlasRow) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(row)}>
            编辑
          </Button>
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => void remove(row)}>
            删除
          </Button>
        </Space>
      ),
    },
  ]

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
    form.resetFields()
  }

  const openEdit = (row: AtlasRow) => {
    setEditing(row)
    setModalOpen(true)
    form.setFieldsValue({
      ...row,
      title: row.title || '',
      imageUrl: row.imageUrl || '',
      majorCategory: row.majorCategory || '',
      coreEnergyTag: row.coreEnergyTag || '',
      mineVeinTrace: row.mineVeinTrace || '',
      materialTrace: row.materialTrace || '',
      visualFeatures: row.visualFeatures || '',
      classicSixDimensions: row.classicSixDimensions || '',
      zodiac: row.zodiac || '',
      fiveElements: row.fiveElements || '',
      constellation: row.constellation || '',
      chakra: row.chakra || '',
    })
  }

  const submit = async (values: AtlasRow) => {
    setSaving(true)
    setError(null)
    const payload = {
      title: values.title.trim(),
      imageUrl: (values.imageUrl || '').trim() || null,
      majorCategory: (values.majorCategory || '').trim() || null,
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
    try {
      const isEdit = Boolean(editing?.id)
      const res = await fetch(
        isEdit ? `/api/admin/product-atlas/${editing!.id}` : '/api/admin/product-atlas',
        {
          method: isEdit ? 'PATCH' : 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(json?.error || `保存失败（${res.status}）`)
        return
      }
      setModalOpen(false)
      setEditing(null)
      await load()
    } catch (e) {
      setError(`保存失败：${String(e)}`)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (row: AtlasRow) => {
    const ok = confirm(`确认删除图鉴？\n\n商品名：${row.title}\n\n删除后会把关联商品的 atlasId 置空。`)
    if (!ok) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/product-atlas/${row.id}`, { method: 'DELETE' })
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

  const uploadImage = async (file: File) => {
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
      const url = String(json?.url || '').trim()
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          图鉴列表
        </Typography.Title>
        <Button type="primary" onClick={openCreate} icon={<PlusOutlined />}>
          新增图鉴
        </Button>
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
        dataSource={atlases}
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
        title={editing ? '编辑图鉴' : '新增图鉴'}
        open={modalOpen}
        okText="保存"
        cancelText="取消"
        confirmLoading={saving}
        onOk={() => form.submit()}
        onCancel={() => {
          if (saving || uploading) return
          setModalOpen(false)
          setEditing(null)
        }}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={submit}>
          <Form.Item name="title" label="商品名" rules={[{ required: true, message: '请输入商品名' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="图片">
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
                  disabled={saving || uploading}
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
          <Form.Item name="majorCategory" label="大分类">
            <Input />
          </Form.Item>
          <Form.Item name="coreEnergyTag" label="核心能量标签">
            <Input.TextArea rows={2} />
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
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="zodiac" label="生肖">
            <Input />
          </Form.Item>
          <Form.Item name="fiveElements" label="五行">
            <Input />
          </Form.Item>
          <Form.Item name="constellation" label="星座">
            <Input />
          </Form.Item>
          <Form.Item name="chakra" label="脉轮">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

