'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, RefreshCw, Truck, BadgeCheck, BadgeX, CreditCard, Trash2 } from 'lucide-react'

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
  user: { id: string; nickname: string | null; phone: string | null } | null
  items: { id: string; name: string; quantity: number; subtotal: any }[]
}

function statusLabel(s: string) {
  switch (s) {
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

function statusPillClass(s: string) {
  switch (s) {
    case 'to_ship':
      return 'bg-amber-100 text-amber-800'
    case 'to_receive':
      return 'bg-blue-100 text-blue-800'
    case 'done':
      return 'bg-emerald-100 text-emerald-800'
    case 'refund':
      return 'bg-rose-100 text-rose-800'
    case 'to_pay':
      return 'bg-zinc-100 text-zinc-800'
    case 'cancelled':
      return 'bg-zinc-200 text-zinc-700'
    default:
      return 'bg-zinc-100 text-zinc-800'
  }
}

function fmtTime(iso: string | null | undefined) {
  if (!iso) return '-'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString()
}

export default function DashboardOrdersPage() {
  const [adminToken, setAdminToken] = useState('dev-admin-token')
  const [status, setStatus] = useState('all')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<{ total: number; orders: OrderRow[] } | null>(
    null
  )

  useEffect(() => {
    try {
      const saved = localStorage.getItem('ADMIN_TOKEN')
      if (saved) setAdminToken(saved)
    } catch {}
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('ADMIN_TOKEN', adminToken)
    } catch {}
  }, [adminToken])

  const queryKey = useMemo(() => {
    const s = new URLSearchParams()
    if (status && status !== 'all') s.set('status', status)
    if (q.trim()) s.set('q', q.trim())
    s.set('page', String(page))
    s.set('pageSize', String(pageSize))
    return s.toString()
  }, [status, q, page, pageSize])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/orders?${queryKey}`, {
        headers: { 'x-admin-token': adminToken },
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(json?.error || `加载失败（${res.status}）`)
        setData(null)
        return
      }
      setData({ total: json.total || 0, orders: json.orders || [] })
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
  }, [queryKey, adminToken])

  async function patchOrder(id: string, body: Record<string, any>, successMsg?: string) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          'x-admin-token': adminToken,
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
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': adminToken },
      })
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="text-xl font-semibold text-zinc-900">订单管理</div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="text-sm text-zinc-700">
            管理 Token
            <input
              className="ml-2 w-56 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
              value={adminToken}
              onChange={(e) => {
                setPage(1)
                setAdminToken(e.target.value)
              }}
              placeholder="ADMIN_TOKEN"
            />
          </label>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            onClick={() => load()}
            disabled={loading}
            type="button"
          >
            <RefreshCw className="h-4 w-4" />
            刷新
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center">
        <label className="text-sm text-zinc-700">
          状态
          <select
            className="ml-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
            value={status}
            onChange={(e) => {
              setPage(1)
              setStatus(e.target.value)
            }}
          >
            <option value="all">全部</option>
            <option value="to_pay">待支付</option>
            <option value="to_ship">待发货</option>
            <option value="to_receive">待收货</option>
            <option value="done">已完成</option>
            <option value="refund">退款/售后</option>
            <option value="cancelled">已取消</option>
          </select>
        </label>

        <label className="flex flex-1 items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus-within:border-zinc-400">
          <Search className="h-4 w-4 text-zinc-500" />
          <input
            className="w-full outline-none"
            value={q}
            onChange={(e) => {
              setPage(1)
              setQ(e.target.value)
            }}
            placeholder="搜索：订单号 / outTradeNo / 收件人 / 手机 / 运单号"
          />
        </label>

        <div className="text-sm text-zinc-500">
          共 <span className="font-medium text-zinc-800">{data?.total ?? 0}</span> 条
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
              <tr>
                <th className="whitespace-nowrap px-4 py-3">订单</th>
                <th className="whitespace-nowrap px-4 py-3">用户</th>
                <th className="whitespace-nowrap px-4 py-3">金额</th>
                <th className="whitespace-nowrap px-4 py-3">状态</th>
                <th className="whitespace-nowrap px-4 py-3">支付</th>
                <th className="whitespace-nowrap px-4 py-3">创建时间</th>
                <th className="whitespace-nowrap px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {(data?.orders || []).map((o) => {
                const totalQty =
                  o.items?.reduce((s, it) => s + (it.quantity || 0), 0) || 0
                const itemText =
                  o.items?.length > 0 ? `${o.items[0].name} 等 ${totalQty} 件` : '-'

                return (
                  <tr key={o.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-zinc-900">{o.id}</div>
                      <div className="mt-1 text-xs text-zinc-500">{itemText}</div>
                      <div className="mt-1 text-xs text-zinc-500">
                        {o.recipient} / {o.phone}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-zinc-900">{o.user?.nickname || '-'}</div>
                      <div className="mt-1 text-xs text-zinc-500">
                        {o.user?.phone || o.phone || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-zinc-900">实付：{String(o.payAmount)}</div>
                      <div className="mt-1 text-xs text-zinc-500">
                        商品：{String(o.totalAmount)} 运费：{String(o.freightAmount)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${statusPillClass(
                          o.status
                        )}`}
                      >
                        {statusLabel(o.status)}
                      </span>
                      {o.shippingCompany || o.trackingNo ? (
                        <div className="mt-1 text-xs text-zinc-500">
                          {o.shippingCompany || '-'} {o.trackingNo || ''}
                        </div>
                      ) : null}
                      {o.refundStatus ? (
                        <div className="mt-1 text-xs text-rose-600">
                          退款：{o.refundStatus}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-zinc-900">{o.payStatus}</div>
                      <div className="mt-1 text-xs text-zinc-500">{fmtTime(o.paidAt)}</div>
                    </td>
                    <td className="px-4 py-3 text-zinc-700">{fmtTime(o.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
                          disabled={loading}
                          type="button"
                          onClick={() => patchOrder(o.id, { payStatus: 'paid' }, '已模拟支付')}
                          title="模拟支付成功（置为待发货）"
                        >
                          <CreditCard className="h-4 w-4" />
                          模拟支付
                        </button>

                        <button
                          className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
                          disabled={loading}
                          type="button"
                          onClick={() => {
                            const company =
                              prompt('物流公司（可空）', o.shippingCompany || '') ?? ''
                            const tracking =
                              prompt('运单号（可空）', o.trackingNo || '') ?? ''
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
                          title="录入物流并标记为待收货"
                        >
                          <Truck className="h-4 w-4" />
                          发货
                        </button>

                        <button
                          className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
                          disabled={loading}
                          type="button"
                          onClick={() => patchOrder(o.id, { status: 'done' }, '已完成')}
                          title="确认收货（已完成）"
                        >
                          <BadgeCheck className="h-4 w-4" />
                          完成
                        </button>

                        <button
                          className="inline-flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                          disabled={loading}
                          type="button"
                          onClick={() =>
                            patchOrder(
                              o.id,
                              { status: 'refund', refundStatus: 'requested' },
                              '已标记为退款/售后'
                            )
                          }
                          title="标记退款/售后"
                        >
                          <BadgeX className="h-4 w-4" />
                          退款/售后
                        </button>

                        <button
                          className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                          disabled={loading}
                          type="button"
                          onClick={() => deleteOrder(o.id)}
                          title="删除订单（不可恢复）"
                        >
                          <Trash2 className="h-4 w-4" />
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}

              {!loading && (data?.orders?.length || 0) === 0 ? (
                <tr>
                  <td
                    className="px-4 py-10 text-center text-sm text-zinc-500"
                    colSpan={7}
                  >
                    暂无订单
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-3 text-sm">
          <div className="text-zinc-500">
            第 <span className="font-medium text-zinc-800">{page}</span> 页
          </div>
          <div className="flex gap-2">
            <button
              className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={loading || page <= 1}
              type="button"
            >
              上一页
            </button>
            <button
              className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
              onClick={() => setPage((p) => p + 1)}
              disabled={loading || (data?.orders?.length || 0) < pageSize}
              type="button"
            >
              下一页
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

