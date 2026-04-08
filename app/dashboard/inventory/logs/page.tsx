'use client'

import { useEffect, useState } from 'react'
import { Button, Input, Select, Space, Table, Typography, message } from 'antd'
import { DeleteOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'

type InventoryLogRow = {
  id: string
  productId: string
  productTitle: string
  type: string
  quantity: number
  beforeQty: number
  afterQty: number
  remark: string | null
  createdAt: string
}

export default function InventoryLogsPage() {
  const [data, setData] = useState<InventoryLogRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  })
  const [searchType, setSearchType] = useState<'all' | 'productTitle' | 'type'>('all')
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
      const res = await fetch(`/api/admin/inventory/logs?${sp.toString()}`)
      const json = (await res.json().catch(() => null)) as
        | { logs?: InventoryLogRow[]; total?: number; error?: string }
        | null
      if (!res.ok) {
        const msg = json?.error || `加载库存流水失败（${res.status}）`
        setError(msg)
        message.error(msg)
        setData([])
        return
      }
      setData(json?.logs || [])
      setPagination((prev) => ({
        ...prev,
        current: page,
        pageSize,
        total: json?.total ?? prev.total,
      }))
    } catch (e) {
      const msg = `加载库存流水失败：${String(e)}`
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

  const remove = async (row: InventoryLogRow) => {
    if (
      !confirm(
        `确认删除这条流水记录？\n\n商品：${row.productTitle}\n类型：${row.type}\n变动数量：${row.quantity}\n时间：${new Date(
          row.createdAt
        ).toLocaleString()}`
      )
    ) {
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/inventory/logs/${row.id}`, { method: 'DELETE' })
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
    { title: '商品ID', dataIndex: 'productId', key: 'productId', width: 200 },
    { title: '商品名称', dataIndex: 'productTitle', key: 'productTitle', width: 260 },
    { title: '类型', dataIndex: 'type', key: 'type', width: 100 },
    { title: '变动数量', dataIndex: 'quantity', key: 'quantity', width: 100 },
    { title: '变动前库存', dataIndex: 'beforeQty', key: 'beforeQty', width: 120 },
    { title: '变动后库存', dataIndex: 'afterQty', key: 'afterQty', width: 120 },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 220,
      render: (v: string | null) => v || '-',
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 200,
      render: (iso: string) => (iso ? new Date(iso).toLocaleString() : '-'),
    },
    {
      title: '操作',
      key: 'actions',
      fixed: 'right' as const,
      width: 120,
      render: (_: any, row: InventoryLogRow) => (
        <Button danger size="small" onClick={() => remove(row)}>
          删除
        </Button>
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          库存流水
        </Typography.Title>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <Space.Compact style={{ width: 480 }}>
          <Select
            value={searchType}
            onChange={(v) => setSearchType(v)}
            style={{ width: 170 }}
            options={[
              { label: '全部', value: 'all' },
              { label: '商品名称', value: 'productTitle' },
              { label: '类型', value: 'type' },
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
    </div>
  )
}

