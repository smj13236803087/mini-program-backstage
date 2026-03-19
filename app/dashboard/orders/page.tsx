'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CreditCardOutlined,
  DeleteOutlined,
  DeliveredProcedureOutlined,
  EyeOutlined,
  GiftOutlined,
  ReloadOutlined,
  SearchOutlined,
  ToolOutlined,
} from '@ant-design/icons'
import { Button, Input, Select, Space, Table, Tag, Typography } from 'antd'

type OrderRow = {
  id: string
  status: string
  totalAmount: any
  payAmount: any
  freightAmount: any
  recipient: string
  phone: string
  outTradeNo: string | null
  payStatus: string
  paidAt: string | null
  shippingCompany: string | null
  trackingNo: string | null
  shippedAt: string | null
  receivedAt: string | null
  refundStatus: string | null
  refundAmount: any | null
  createdAt: string
  updatedAt: string
  user: { id: string; nickname: string | null; phone: string | null } | null
  items: { id: string; name: string; quantity: number; subtotal: any }[]
}

function statusLabel(s: string) {
  switch (s) {
    case 'making':
      return '制作中'
    case 'inspect':
      return '实物检视'
    case 'ready':
      return '结缘发出'
    case 'to_ship':
      return '待发货'
    case 'to_receive':
      return '待收货'
    case 'done':
      return '已完成'
    case 'refund':
      return '退款/售后'
    case 'to_pay':
      return '待支付'
    case 'cancelled':
      return '已取消'
    case 'pending':
      return '处理中'
    default:
      return s
  }
}

function fmtTime(iso: string | null | undefined) {
  if (!iso) return '-'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString()
}

export default function DashboardOrdersPage() {
  const [status, setStatus] = useState('all')
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
  const [data, setData] = useState<{ total: number; orders: OrderRow[] } | null>(
    null
  )

  const queryKey = useMemo(() => {
    const s = new URLSearchParams()
    if (status && status !== 'all') s.set('status', status)
    const q = (hasSearch ? newSearchValue : oldSearchValue).trim()
    const field = (hasSearch ? newSearchType : oldSearchType).trim()
    if (q) s.set('q', q)
    if (field && field !== 'all') s.set('field', field)
    if (sortConfig.key && sortConfig.order) s.set('sort', `${sortConfig.key}:${sortConfig.order}`)
    s.set('page', String(pagination.current))
    s.set('pageSize', String(pagination.pageSize))
    return s.toString()
  }, [
    status,
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
      const res = await fetch(`/api/admin/orders?${queryKey}`)
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(json?.error || `加载失败（${res.status}）`)
        setData(null)
        return
      }
      const total = json.total || 0
      setData({ total, orders: json.orders || [] })
      setPagination((p) => ({ ...p, total }))
    } catch (e) {
      setError(`加载失败：${String(e)}`)
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey])

  async function patchOrder(id: string, body: Record<string, any>, successMsg?: string) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(body),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(json?.error || `更新失败（${res.status}）`)
        return
      }
      if (successMsg) {
        try {
          alert(successMsg)
        } catch {}
      }
      await load()
    } catch (e) {
      setError(`更新失败：${String(e)}`)
    } finally {
      setLoading(false)
    }
  }

  async function deleteOrder(id: string) {
    const ok = confirm(`确认删除订单？\n\n订单号：${id}\n\n删除后不可恢复。`)
    if (!ok) return

    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/orders/${id}`, { method: 'DELETE' })
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
    { label: '订单号', value: 'id' },
    { label: '支付单号（outTradeNo）', value: 'outTradeNo' },
    { label: '收件人', value: 'recipient' },
    { label: '手机', value: 'phone' },
    { label: '运单号', value: 'trackingNo' },
    { label: '创建时间（输入日期）', value: 'createdAt' },
    { label: '更新时间（输入日期）', value: 'updatedAt' },
  ]

  const columns = [
    {
      title: '订单号',
      dataIndex: 'id',
      key: 'id',
      width: 220,
      render: (id: string, o: OrderRow) => (
        <div>
          <div style={{ fontWeight: 600 }}>{id}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            {o.items?.length
              ? `${o.items[0].name} 等 ${
                  o.items.reduce((s, it) => s + (it.quantity || 0), 0) || 0
                } 件`
              : '-'}
          </div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            {o.recipient} / {o.phone}
          </div>
        </div>
      ),
    },
    {
      title: '用户',
      dataIndex: ['user', 'nickname'],
      key: 'user',
      width: 160,
      render: (_: any, o: OrderRow) => (
        <div>
          <div>{o.user?.nickname || '-'}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{o.user?.phone || o.phone || '-'}</div>
        </div>
      ),
    },
    {
      title: '金额',
      key: 'amount',
      width: 160,
      render: (_: any, o: OrderRow) => (
        <div>
          <div>实付：{String(o.payAmount)}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            商品：{String(o.totalAmount)} 运费：{String(o.freightAmount)}
          </div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (s: string, o: OrderRow) => (
        <div>
          <Tag color="default">{statusLabel(s)}</Tag>
          {o.shippingCompany || o.trackingNo ? (
            <div style={{ fontSize: 12, color: '#64748b' }}>
              {o.shippingCompany || '-'} {o.trackingNo || ''}
            </div>
          ) : null}
          {o.refundStatus ? (
            <div style={{ fontSize: 12, color: '#e11d48' }}>退款：{o.refundStatus}</div>
          ) : null}
        </div>
      ),
    },
    {
      title: '支付',
      key: 'pay',
      width: 140,
      render: (_: any, o: OrderRow) => (
        <div>
          <div>{o.payStatus}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{fmtTime(o.paidAt)}</div>
        </div>
      ),
    },
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
      render: (iso: string) => fmtTime(iso),
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
      render: (iso: string) => fmtTime(iso),
    },
    {
      title: '操作',
      key: 'actions',
      fixed: 'right' as const,
      width: 520,
      render: (_: any, o: OrderRow) => (
        <Space wrap>
          <Button
            size="small"
            disabled={loading}
            onClick={() => patchOrder(o.id, { payStatus: 'paid' }, '已模拟支付（制作中）')}
            icon={<CreditCardOutlined />}
          >
            模拟支付
          </Button>
          <Button
            size="small"
            disabled={loading}
            onClick={() => patchOrder(o.id, { status: 'making' }, '已标记为制作中')}
            icon={<ToolOutlined />}
          >
            制作中
          </Button>
          <Button
            size="small"
            disabled={loading}
            onClick={() => patchOrder(o.id, { status: 'inspect' }, '已标记为实物检视')}
            icon={<EyeOutlined />}
          >
            实物检视
          </Button>
          <Button
            size="small"
            disabled={loading}
            onClick={() => patchOrder(o.id, { status: 'ready' }, '已标记为结缘发出')}
            icon={<GiftOutlined />}
          >
            结缘发出
          </Button>
          <Button
            size="small"
            disabled={loading}
            icon={<DeliveredProcedureOutlined />}
            onClick={() => {
              const company = prompt('物流公司（可空）', o.shippingCompany || '') ?? ''
              const tracking = prompt('运单号（可空）', o.trackingNo || '') ?? ''
              void patchOrder(
                o.id,
                {
                  status: 'to_receive',
                  shippingCompany: company || null,
                  trackingNo: tracking || null,
                },
                '已发货（待收货）'
              )
            }}
          >
            发货
          </Button>
          <Button
            size="small"
            disabled={loading}
            onClick={() => patchOrder(o.id, { status: 'done' }, '已完成')}
            icon={<CheckCircleOutlined />}
          >
            完成
          </Button>
          <Button
            size="small"
            disabled={loading}
            danger
            onClick={() => patchOrder(o.id, { status: 'refund', refundStatus: 'requested' }, '已标记为退款/售后')}
            icon={<CloseCircleOutlined />}
          >
            退款/售后
          </Button>
          <Button size="small" disabled={loading} danger onClick={() => deleteOrder(o.id)} icon={<DeleteOutlined />}>
            删除
          </Button>
        </Space>
      ),
    },
  ]

  const statusOptions = [
    { label: '全部', value: 'all' },
    { label: '待支付', value: 'to_pay' },
    { label: '待发货', value: 'to_ship' },
    { label: '待收货', value: 'to_receive' },
    { label: '已完成', value: 'done' },
    { label: '退款/售后', value: 'refund' },
    { label: '已取消', value: 'cancelled' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          订单管理
        </Typography.Title>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <Space>
          <span style={{ color: '#475569' }}>状态</span>
          <Select
            style={{ width: 160 }}
            value={status}
            options={statusOptions}
            onChange={(v) => {
              setPagination((p) => ({ ...p, current: 1 }))
              setStatus(v)
            }}
          />
        </Space>

        <Space.Compact style={{ width: 440 }}>
          <Select value={newSearchType} onChange={setNewSearchType} style={{ width: 150 }} options={searchOptions} />
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
          共 <span style={{ fontWeight: 600, color: '#0f172a' }}>{data?.total ?? 0}</span> 条
        </div>
      </div>

      {error ? (
        <div style={{ border: '1px solid #fecaca', background: '#fff1f2', padding: 12, borderRadius: 8, color: '#be123c' }}>
          {error}
        </div>
      ) : null}

      <Table
        columns={columns as any}
        dataSource={data?.orders || []}
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
    </div>
  )
}

