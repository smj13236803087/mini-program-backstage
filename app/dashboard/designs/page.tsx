'use client'

import { useEffect, useMemo, useState } from 'react'

type UserRow = {
  id: string
  nickname: string | null
  phone: string | null
  weixin_openid: string | null
  email: string | null
  role: string
  createdAt: string
  _count: { braceletDesigns: number; orders: number; addresses: number }
}

type DesignRow = {
  id: string
  totalPrice: number
  wristSize: number | null
  wearingStyle: string | null
  items: any
  createdAt: string
}

type ProductRow = {
  id: string
  title: string
  productType: string
  price: any
  diameter: string | null
  weight: string | null
  stock: number
  images: any
  energy_tags?: any
}

export default function DashboardDesignsPage() {
  const [adminToken, setAdminToken] = useState('dev-admin-token')
  const [userQ, setUserQ] = useState('')
  const [users, setUsers] = useState<UserRow[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersErr, setUsersErr] = useState<string | null>(null)

  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null)
  const [designs, setDesigns] = useState<DesignRow[]>([])
  const [designsLoading, setDesignsLoading] = useState(false)
  const [designsErr, setDesignsErr] = useState<string | null>(null)

  const [products, setProducts] = useState<ProductRow[]>([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [productsErr, setProductsErr] = useState<string | null>(null)
  const [productQ, setProductQ] = useState('')
  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const [sequence, setSequence] = useState<ProductRow[]>([])

  const [formTotalPrice, setFormTotalPrice] = useState('199')
  const [formWristSize, setFormWristSize] = useState('15')
  const [formWearingStyle, setFormWearingStyle] = useState<'single' | 'double'>(
    'single'
  )
  const [formItemsJson, setFormItemsJson] = useState('')

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

  const userQueryKey = useMemo(() => {
    const sp = new URLSearchParams()
    if (userQ.trim()) sp.set('q', userQ.trim())
    sp.set('page', '1')
    sp.set('pageSize', '20')
    return sp.toString()
  }, [userQ])

  async function loadUsers() {
    setUsersLoading(true)
    setUsersErr(null)
    try {
      const res = await fetch(`/api/admin/users?${userQueryKey}`, {
        headers: { 'x-admin-token': adminToken },
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setUsersErr(json?.error || `加载用户失败（${res.status}）`)
        setUsers([])
        return
      }
      setUsers(json?.users || [])
    } catch (e) {
      setUsersErr(`加载用户失败：${String(e)}`)
      setUsers([])
    } finally {
      setUsersLoading(false)
    }
  }

  async function loadProducts() {
    setProductsLoading(true)
    setProductsErr(null)
    try {
      const sp = new URLSearchParams()
      if (productQ.trim()) sp.set('q', productQ.trim())
      const res = await fetch(`/api/admin/products?${sp.toString()}`, {
        headers: { 'x-admin-token': adminToken },
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setProductsErr(json?.error || `加载商品失败（${res.status}）`)
        setProducts([])
        return
      }
      const list = (json?.products || []) as ProductRow[]
      setProducts(list)
      if (!selectedProductId && list.length) {
        setSelectedProductId(list[0].id)
      }
    } catch (e) {
      setProductsErr(`加载商品失败：${String(e)}`)
      setProducts([])
    } finally {
      setProductsLoading(false)
    }
  }

  async function loadDesigns(userId: string) {
    setDesignsLoading(true)
    setDesignsErr(null)
    try {
      const res = await fetch(`/api/admin/users/${userId}/designs`, {
        headers: { 'x-admin-token': adminToken },
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setDesignsErr(json?.error || `加载作品集失败（${res.status}）`)
        setDesigns([])
        return
      }
      setDesigns(json?.designs || [])
    } catch (e) {
      setDesignsErr(`加载作品集失败：${String(e)}`)
      setDesigns([])
    } finally {
      setDesignsLoading(false)
    }
  }

  useEffect(() => {
    void loadUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminToken, userQueryKey])

  useEffect(() => {
    void loadProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminToken, productQ])

  async function createDesign() {
    if (!selectedUser) return
    const items: any[] = sequence.map((p, idx) => {
      const meta0 = p?.images?.[0]?.meta || {}
      return {
        // 兼容小程序预览：id/name/price/color/size
        id: `${p.id}_${idx}`,
        productId: p.id,
        name: p.title,
        price: Number(p.price || 0),
        color: meta0.color || '#e5e7eb',
        size: meta0.size || p.diameter || '--',
        diameter: p.diameter || null,
        weight: p.weight || null,
        energy_tags: p.energy_tags || [],
        productType: p.productType,
      }
    })
    if (!items.length) {
      alert('请先从下拉列表按顺序选择珠子，组成设计序列')
      return
    }

    const totalPrice = Number(formTotalPrice)
    if (Number.isNaN(totalPrice)) {
      alert('totalPrice 必须是数字')
      return
    }
    const wristSize = formWristSize.trim() ? Number(formWristSize) : null
    if (formWristSize.trim() && Number.isNaN(Number(formWristSize))) {
      alert('wristSize 必须是数字或留空')
      return
    }

    setDesignsLoading(true)
    setDesignsErr(null)
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/designs`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-admin-token': adminToken,
        },
        body: JSON.stringify({
          items,
          totalPrice,
          wristSize,
          wearingStyle: formWearingStyle,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setDesignsErr(json?.error || `创建失败（${res.status}）`)
        return
      }
      await loadDesigns(selectedUser.id)
    } catch (e) {
      setDesignsErr(`创建失败：${String(e)}`)
    } finally {
      setDesignsLoading(false)
    }
  }

  async function deleteDesign(designId: string) {
    if (!selectedUser) return
    const ok = confirm(`确认删除作品？\n\n作品ID：${designId}\n用户ID：${selectedUser.id}\n\n删除后不可恢复。`)
    if (!ok) return

    setDesignsLoading(true)
    setDesignsErr(null)
    try {
      const res = await fetch(
        `/api/admin/users/${selectedUser.id}/designs/${designId}`,
        {
          method: 'DELETE',
          headers: { 'x-admin-token': adminToken },
        }
      )
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setDesignsErr(json?.error || `删除失败（${res.status}）`)
        return
      }
      await loadDesigns(selectedUser.id)
    } catch (e) {
      setDesignsErr(`删除失败：${String(e)}`)
    } finally {
      setDesignsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="text-xl font-semibold text-zinc-900">作品集管理</div>
        <label className="text-sm text-zinc-700">
          管理 Token
          <input
            className="ml-2 w-56 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
            value={adminToken}
            onChange={(e) => setAdminToken(e.target.value)}
            placeholder="ADMIN_TOKEN"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="font-medium text-zinc-900">选择用户</div>
            <button
              className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
              type="button"
              onClick={() => loadUsers()}
              disabled={usersLoading}
            >
              刷新
            </button>
          </div>

          <label className="mb-3 block text-sm text-zinc-700">
            搜索（id / 昵称 / 手机 / openid / 邮箱）
            <input
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
              value={userQ}
              onChange={(e) => setUserQ(e.target.value)}
              placeholder="输入关键字"
            />
          </label>

          {usersErr ? (
            <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {usersErr}
            </div>
          ) : null}

          <div className="max-h-[420px] overflow-auto rounded-lg border border-zinc-100">
            <table className="min-w-full text-left text-sm">
              <thead className="sticky top-0 bg-zinc-50 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-3 py-2">用户</th>
                  <th className="px-3 py-2">作品/订单</th>
                  <th className="px-3 py-2">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {(users || []).map((u) => {
                  const active = selectedUser?.id === u.id
                  return (
                    <tr key={u.id} className={active ? 'bg-violet-50' : 'hover:bg-zinc-50'}>
                      <td className="px-3 py-2">
                        <div className="font-medium text-zinc-900">{u.nickname || '-'}</div>
                        <div className="mt-1 text-xs text-zinc-500">{u.id}</div>
                        <div className="mt-1 text-xs text-zinc-500">
                          {u.phone || '-'} {u.weixin_openid ? `· ${u.weixin_openid}` : ''}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs text-zinc-700">
                        作品 {u._count?.braceletDesigns ?? 0} · 订单 {u._count?.orders ?? 0}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          className="rounded-md bg-zinc-900 px-3 py-2 text-xs font-medium text-white hover:bg-zinc-800"
                          type="button"
                          onClick={async () => {
                            setSelectedUser(u)
                            await loadDesigns(u.id)
                          }}
                        >
                          选择
                        </button>
                      </td>
                    </tr>
                  )
                })}
                {!usersLoading && (users?.length || 0) === 0 ? (
                  <tr>
                    <td className="px-3 py-6 text-center text-sm text-zinc-500" colSpan={3}>
                      暂无用户
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="font-medium text-zinc-900">
              {selectedUser ? `为用户新增作品：${selectedUser.nickname || selectedUser.id}` : '为用户新增作品'}
            </div>
            <button
              className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
              type="button"
              onClick={() => selectedUser && loadDesigns(selectedUser.id)}
              disabled={!selectedUser || designsLoading}
            >
              刷新作品
            </button>
          </div>

          {!selectedUser ? (
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
              先在左侧选择一个用户。
            </div>
          ) : (
            <>
              {designsErr ? (
                <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  {designsErr}
                </div>
              ) : null}

              <div className="grid grid-cols-1 gap-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <label className="text-sm text-zinc-700">
                    totalPrice
                    <input
                      className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
                      value={formTotalPrice}
                      onChange={(e) => setFormTotalPrice(e.target.value)}
                    />
                  </label>
                  <label className="text-sm text-zinc-700">
                    wristSize（可空）
                    <input
                      className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
                      value={formWristSize}
                      onChange={(e) => setFormWristSize(e.target.value)}
                    />
                  </label>
                  <label className="text-sm text-zinc-700">
                    wearingStyle
                    <select
                      className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
                      value={formWearingStyle}
                      onChange={(e) =>
                        setFormWearingStyle(e.target.value as 'single' | 'double')
                      }
                    >
                      <option value="single">single</option>
                      <option value="double">double</option>
                    </select>
                  </label>
                </div>

                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-sm font-medium text-zinc-900">
                      从商品表选择珠子（按顺序）
                    </div>
                    <button
                      className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
                      type="button"
                      onClick={() => loadProducts()}
                      disabled={productsLoading}
                    >
                      刷新商品
                    </button>
                  </div>

                  {productsErr ? (
                    <div className="mb-2 rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">
                      {productsErr}
                    </div>
                  ) : null}

                  <label className="mb-2 block text-xs text-zinc-700">
                    搜索商品（title / productType / diameter）
                    <input
                      className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
                      value={productQ}
                      onChange={(e) => setProductQ(e.target.value)}
                      placeholder="例如：紫水晶 / spacer / 6mm"
                    />
                  </label>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <select
                      className="w-full flex-1 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                    >
                      {(products || []).map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title} · {p.diameter || '-'} · ¥{String(p.price)}
                        </option>
                      ))}
                    </select>
                    <button
                      className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                      type="button"
                      disabled={!selectedProductId}
                      onClick={() => {
                        const p = products.find((x) => x.id === selectedProductId)
                        if (!p) return
                        setSequence((s) => [...s, p])
                      }}
                    >
                      添加到序列（+1 颗）
                    </button>
                    <button
                      className="rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
                      type="button"
                      disabled={!sequence.length}
                      onClick={() => setSequence([])}
                    >
                      清空序列
                    </button>
                  </div>

                  <div className="mt-3 rounded-lg border border-zinc-200 bg-white p-2">
                    <div className="mb-2 text-xs font-medium text-zinc-700">
                      当前序列（从左到右即保存顺序）
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {sequence.map((p, i) => (
                        <div
                          key={`${p.id}_${i}`}
                          className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-800"
                        >
                          <span className="font-medium">{i + 1}.</span>
                          <span>{p.title}</span>
                          <button
                            className="ml-1 rounded-full border border-zinc-200 bg-white px-2 py-1 text-[11px] text-zinc-700 hover:bg-zinc-50"
                            type="button"
                            onClick={() => {
                              setSequence((s) => s.filter((_, idx) => idx !== i))
                            }}
                            title="删除这颗"
                          >
                            删除
                          </button>
                          <button
                            className="rounded-full border border-zinc-200 bg-white px-2 py-1 text-[11px] text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                            type="button"
                            disabled={i === 0}
                            onClick={() => {
                              setSequence((s) => {
                                const next = [...s]
                                const tmp = next[i - 1]
                                next[i - 1] = next[i]
                                next[i] = tmp
                                return next
                              })
                            }}
                            title="上移"
                          >
                            ↑
                          </button>
                          <button
                            className="rounded-full border border-zinc-200 bg-white px-2 py-1 text-[11px] text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                            type="button"
                            disabled={i === sequence.length - 1}
                            onClick={() => {
                              setSequence((s) => {
                                const next = [...s]
                                const tmp = next[i + 1]
                                next[i + 1] = next[i]
                                next[i] = tmp
                                return next
                              })
                            }}
                            title="下移"
                          >
                            ↓
                          </button>
                        </div>
                      ))}
                      {!sequence.length ? (
                        <div className="text-xs text-zinc-500">还没选择任何珠子</div>
                      ) : null}
                    </div>
                  </div>

                  {/* 保留一个只读 items JSON 预览，方便你复制/检查 */}
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs text-zinc-600">
                      查看生成的 items JSON（只读）
                    </summary>
                    <textarea
                      className="mt-2 h-36 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 font-mono text-xs outline-none"
                      readOnly
                      value={(() => {
                        try {
                          const items = sequence.map((p, idx) => {
                            const meta0 = p?.images?.[0]?.meta || {}
                            return {
                              id: `${p.id}_${idx}`,
                              productId: p.id,
                              name: p.title,
                              price: Number(p.price || 0),
                              color: meta0.color || '#e5e7eb',
                              size: meta0.size || p.diameter || '--',
                              diameter: p.diameter || null,
                              weight: p.weight || null,
                              energy_tags: (p as any).energy_tags || [],
                              productType: p.productType,
                            }
                          })
                          return JSON.stringify(items, null, 2)
                        } catch {
                          return ''
                        }
                      })()}
                    />
                  </details>
                </div>

                <button
                  className="inline-flex items-center justify-center rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
                  type="button"
                  disabled={designsLoading}
                  onClick={() => void createDesign()}
                >
                  新增作品（写入该用户作品集）
                </button>
              </div>

              <div className="mt-5">
                <div className="mb-2 text-sm font-medium text-zinc-900">该用户现有作品</div>
                <div className="max-h-[260px] overflow-auto rounded-lg border border-zinc-100">
                  <table className="min-w-full text-left text-sm">
                    <thead className="sticky top-0 bg-zinc-50 text-xs uppercase text-zinc-500">
                      <tr>
                        <th className="px-3 py-2">作品</th>
                        <th className="px-3 py-2">价格/手围</th>
                        <th className="px-3 py-2">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {(designs || []).map((d) => (
                        <tr key={d.id} className="hover:bg-zinc-50">
                          <td className="px-3 py-2">
                            <div className="font-medium text-zinc-900">{d.id}</div>
                            <div className="mt-1 text-xs text-zinc-500">
                              {new Date(d.createdAt).toLocaleString()}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-xs text-zinc-700">
                            ¥{d.totalPrice} · {d.wristSize ?? '--'}cm ·{' '}
                            {d.wearingStyle || '--'}
                          </td>
                          <td className="px-3 py-2">
                            <button
                              className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                              type="button"
                              disabled={designsLoading}
                              onClick={() => void deleteDesign(d.id)}
                            >
                              删除
                            </button>
                          </td>
                        </tr>
                      ))}
                      {!designsLoading && (designs?.length || 0) === 0 ? (
                        <tr>
                          <td className="px-3 py-6 text-center text-sm text-zinc-500" colSpan={3}>
                            暂无作品
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

