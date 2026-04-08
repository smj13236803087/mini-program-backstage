'use client'

import { useEffect, useState } from 'react'
import { Button, Form, Input, InputNumber, Modal, Select, Space, Table, Typography, message } from 'antd'
import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons'

type InventoryRow = {
  id: string
  productId: string
  productTitle: string
  materialCode: string | null
  quantity: number
  updatedAt: string
}

type InventoryFormValues = {
  productId?: string
  quantity?: number
  remark?: string
}

export default function InventoryListPage() {
  const [data, setData] = useState<InventoryRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  })

  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<InventoryRow | null>(null)
  const [form] = Form.useForm<InventoryFormValues>()
  const [searchType, setSearchType] = useState<'all' | 'title' | 'materialCode'>('all')
  const [searchValue, setSearchValue] = useState('')

  const load = async (page = pagination.current, pageSize = pagination.pageSize) => {
    setLoading(true)
    setError(null)
    try {
      const sp = new URLSearchParams()
      sp.set('page', String(page))
      sp.set('pageSize', String(pageSize))
      const q = searchValue.trim()
      const field = searchType
      if (q) sp.set('q', q)
      if (field && field !== 'all') sp.set('field', field)
      const res = await fetch(`/api/admin/inventory?${sp.toString()}`)
      const json = (await res.json().catch(() => null)) as
        | { inventories?: InventoryRow[]; total?: number; error?: string }
        | null
      if (!res.ok) {
        const msg = json?.error || `加载库存失败（${res.status}）`
        setError(msg)
        message.error(msg)
        setData([])
        return
      }
      setData(json?.inventories || [])
      setPagination((prev) => ({
        ...prev,
        current: page,
        pageSize,
        total: json?.total ?? prev.total,
      }))
    } catch (e) {
      const msg = `加载库存失败：${String(e)}`
      setError(msg)
      message.error(msg)
      setData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load(1, pagination.pageSize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    setModalOpen(true)
  }

  const openEdit = (row: InventoryRow) => {
    setEditing(row)
    form.setFieldsValue({
      productId: row.productId,
      quantity: row.quantity,
      remark: '',
    })
    setModalOpen(true)
  }

  const submit = async (values: InventoryFormValues) => {
    const isEdit = Boolean(editing)
    const payload = {
      productId: (values.productId || '').trim() || undefined,
      quantity: values.quantity ?? 0,
      remark: (values.remark || '').trim() || undefined,
    }

    setSaving(true)
    setError(null)
    try {
      const url = isEdit ? `/api/admin/inventory/${editing!.id}` : '/api/admin/inventory'
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg = json?.error || `保存失败（${res.status}）`
        setError(msg)
        message.error(msg)
        return
      }
      setModalOpen(false)
      await load()
    } catch (e) {
      const msg = `保存失败：${String(e)}`
      setError(msg)
      message.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (row: InventoryRow) => {
    if (
      !confirm(
        `确认删除该库存记录？\n\n商品：${row.productTitle}\n物料编号：${
          row.materialCode || '--'
        }\n当前库存：${row.quantity}\n\n删除后会记录一条库存变动流水。`
      )
    ) {
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/inventory/${row.id}`, { method: 'DELETE' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg = json?.error || `删除失败（${res.status}）`
        setError(msg)
        message.error(msg)
        return
      }
      await load()
    } catch (e) {
      const msg = `删除失败：${String(e)}`
      setError(msg)
      message.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    { title: '商品名称', dataIndex: 'productTitle', key: 'productTitle', width: 260 },
    { title: '物料型号', dataIndex: 'materialCode', key: 'materialCode', width: 180 },
    { title: '当前库存', dataIndex: 'quantity', key: 'quantity', width: 120 },
    {
      title: '最近更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 200,
      render: (iso: string) => (iso ? new Date(iso).toLocaleString() : '-'),
    },
    {
      title: '操作',
      key: 'actions',
      fixed: 'right' as const,
      width: 180,
      render: (_: any, row: InventoryRow) => (
        <Space>
          <Button size="small" onClick={() => openEdit(row)} icon={<EditOutlined />}>
            编辑
          </Button>
          <Button size="small" danger onClick={() => remove(row)} icon={<DeleteOutlined />}>
            删除
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          库存列表
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          新增库存
        </Button>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <Space.Compact style={{ width: 480 }}>
          <Select
            value={searchType}
            onChange={(v) => setSearchType(v)}
            style={{ width: 170 }}
            options={[
              { label: '全部', value: 'all' },
              { label: '商品名称', value: 'title' },
              { label: '物料型号', value: 'materialCode' },
            ]}
          />
          <Input
            placeholder="请输入关键词"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void load(1, pagination.pageSize)
            }}
          />
          <Button
            type="primary"
            onClick={() => void load(1, pagination.pageSize)}
            icon={<SearchOutlined />}
          >
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
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showTotal: (t) => `总计 ${t} 条`,
        }}
        onChange={(p) => {
          const current = p.current || 1
          const pageSize = p.pageSize || pagination.pageSize
          void load(current, pageSize)
        }}
        scroll={{ x: 'max-content' }}
      />

      <Modal
        open={modalOpen}
        title={editing ? '调整库存' : '新增库存'}
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
          form={form}
          layout="vertical"
          preserve={false}
          onFinish={submit}
          initialValues={
            editing
              ? {
                  productId: editing.productId,
                  quantity: editing.quantity,
                  remark: '',
                }
              : { productId: '', quantity: 0, remark: '' }
          }
        >
          {!editing ? (
            <Form.Item
              name="productId"
              label="商品 ID"
              rules={[{ required: true, message: '请输入商品 ID' }]}
            >
              <Input placeholder="请输入商品 ID（Product.id）" />
            </Form.Item>
          ) : (
            <Form.Item label="商品 ID">
              <Input value={editing.productId} disabled />
            </Form.Item>
          )}
          <Form.Item
            name="quantity"
            label="当前库存"
            rules={[{ required: true, message: '请输入库存数量' }]}
          >
            <InputNumber min={0} precision={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="可选，用于说明调整原因，将写入库存流水" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

