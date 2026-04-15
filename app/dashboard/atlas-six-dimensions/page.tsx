'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button, Form, Input, InputNumber, Modal, Select, Space, Table, Typography } from 'antd'
import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons'

type Row = {
  atlasId: string
  title: string
  majorCategory: string | null
  love: any
  wealth: any
  career: any
  focus: any
  emotion: any
  protection: any
  updatedAt: string
}

type FormValues = {
  atlasId?: string
  love: number
  wealth: number
  career: number
  focus: number
  emotion: number
  protection: number
}

export default function DashboardAtlasSixDimensionsPage() {
  const [newSearchType, setNewSearchType] = useState('all')
  const [oldSearchType, setOldSearchType] = useState('all')
  const [newSearchValue, setNewSearchValue] = useState('')
  const [oldSearchValue, setOldSearchValue] = useState('')
  const [hasSearch, setHasSearch] = useState(false)

  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<Row[]>([])

  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Row | null>(null)
  const [form] = Form.useForm<FormValues>()

  const [atlasOptions, setAtlasOptions] = useState<{ label: string; value: string }[]>([])
  const [atlasLoading, setAtlasLoading] = useState(false)

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
      const res = await fetch(`/api/admin/atlas-six-dimensions?${queryKey}`)
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(json?.error || `加载失败（${res.status}）`)
        setRows([])
        return
      }
      setRows(json?.items || [])
      setPagination((p) => ({ ...p, total: json?.total || 0 }))
    } catch (e) {
      setError(`加载失败：${String(e)}`)
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey])

  useEffect(() => {
    if (!modalOpen || editing) return
    let cancelled = false
    ;(async () => {
      setAtlasLoading(true)
      try {
        const res = await fetch('/api/admin/product-atlas?page=1&pageSize=2000')
        const json = await res.json().catch(() => ({}))
        if (!res.ok || cancelled) return
        const list = (json?.atlases || []) as Array<{ id: string; title: string; majorCategory: string | null }>
        setAtlasOptions(
          list.map((a) => ({
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

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
    form.resetFields()
  }

  const openEdit = (r: Row) => {
    setEditing(r)
    setModalOpen(true)
    form.setFieldsValue({
      love: Number(r.love ?? 0),
      wealth: Number(r.wealth ?? 0),
      career: Number(r.career ?? 0),
      focus: Number(r.focus ?? 0),
      emotion: Number(r.emotion ?? 0),
      protection: Number(r.protection ?? 0),
    })
  }

  const submit = async (values: FormValues) => {
    setSaving(true)
    setError(null)
    const payload = {
      love: Number(values.love),
      wealth: Number(values.wealth),
      career: Number(values.career),
      focus: Number(values.focus),
      emotion: Number(values.emotion),
      protection: Number(values.protection),
    }
    try {
      const isEdit = Boolean(editing?.atlasId)
      const url = isEdit ? `/api/admin/atlas-six-dimensions/${editing!.atlasId}` : '/api/admin/atlas-six-dimensions'
      const method = isEdit ? 'PATCH' : 'POST'
      const body = isEdit ? payload : { atlasId: (values.atlasId || '').trim(), ...payload }
      const res = await fetch(url, {
        method,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
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

  async function remove(r: Row) {
    const ok = confirm(`确认删除六维？\n\n物料：${r.title}\n图鉴ID：${r.atlasId}\n\n删除后不可恢复。`)
    if (!ok) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/atlas-six-dimensions/${r.atlasId}`, { method: 'DELETE' })
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

  const searchOptions = [
    { label: '全部', value: 'all' },
    { label: '物料名称', value: 'title' },
    { label: '大分类', value: 'majorCategory' },
  ]

  const columns = [
    { title: '物料名称', dataIndex: 'title', key: 'title', width: 180, render: (v: string) => v || '-' },
    { title: '大分类', dataIndex: 'majorCategory', key: 'majorCategory', width: 120, render: (v: string | null) => v || '-' },
    { title: '爱情吸引', dataIndex: 'love', key: 'love', width: 110, render: (v: any) => (v ?? '-') },
    { title: '财富丰盛', dataIndex: 'wealth', key: 'wealth', width: 110, render: (v: any) => (v ?? '-') },
    { title: '事业成功', dataIndex: 'career', key: 'career', width: 110, render: (v: any) => (v ?? '-') },
    { title: '专注成长', dataIndex: 'focus', key: 'focus', width: 110, render: (v: any) => (v ?? '-') },
    { title: '情绪平衡', dataIndex: 'emotion', key: 'emotion', width: 110, render: (v: any) => (v ?? '-') },
    { title: '能量守护', dataIndex: 'protection', key: 'protection', width: 110, render: (v: any) => (v ?? '-') },
    {
      title: '操作',
      key: 'actions',
      fixed: 'right' as const,
      width: 180,
      render: (_: unknown, r: Row) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>
            编辑
          </Button>
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => void remove(r)}>
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
          商品六维
        </Typography.Title>
        <Button type="primary" onClick={openCreate} icon={<PlusOutlined />}>
          新增六维
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
        dataSource={rows}
        rowKey="atlasId"
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
        title={editing ? '编辑六维' : '新增六维'}
        open={modalOpen}
        okText="保存"
        cancelText="取消"
        confirmLoading={saving}
        onOk={() => form.submit()}
        onCancel={() => {
          if (saving) return
          setModalOpen(false)
          setEditing(null)
        }}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={submit} preserve={false}>
          {!editing ? (
            <Form.Item name="atlasId" label="关联图鉴" rules={[{ required: true, message: '请选择图鉴' }]}>
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

          <Space style={{ width: '100%' }} size={12} wrap>
            <Form.Item name="love" label="爱情吸引" rules={[{ required: true, message: '必填' }]} style={{ flex: 1, minWidth: 180 }}>
              <InputNumber min={0} max={1} step={0.01} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="wealth" label="财富丰盛" rules={[{ required: true, message: '必填' }]} style={{ flex: 1, minWidth: 180 }}>
              <InputNumber min={0} max={1} step={0.01} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="career" label="事业成功" rules={[{ required: true, message: '必填' }]} style={{ flex: 1, minWidth: 180 }}>
              <InputNumber min={0} max={1} step={0.01} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="focus" label="专注成长" rules={[{ required: true, message: '必填' }]} style={{ flex: 1, minWidth: 180 }}>
              <InputNumber min={0} max={1} step={0.01} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="emotion" label="情绪平衡" rules={[{ required: true, message: '必填' }]} style={{ flex: 1, minWidth: 180 }}>
              <InputNumber min={0} max={1} step={0.01} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="protection"
              label="能量守护"
              rules={[{ required: true, message: '必填' }]}
              style={{ flex: 1, minWidth: 180 }}
            >
              <InputNumber min={0} max={1} step={0.01} style={{ width: '100%' }} />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  )
}

