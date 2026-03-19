'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CheckOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { Button, Input, Select, Space, Table, Typography } from 'antd'

type UserRow = {
  id: string
  nickname: string | null
  phone: string | null
  weixin_openid: string | null
  email: string | null
  role: string
  createdAt: string
  updatedAt: string
  _count: { braceletDesigns: number; orders: number; addresses: number }
}

type DesignRow = {
  id: string
  totalPrice: number
  wristSize: number | null
  wearingStyle: string | null
  items: any
  createdAt: string
  updatedAt: string
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
  const [userNewSearchType, setUserNewSearchType] = useState('all')
  const [userOldSearchType, setUserOldSearchType] = useState('all')
  const [userNewSearchValue, setUserNewSearchValue] = useState('')
  const [userOldSearchValue, setUserOldSearchValue] = useState('')
  const [userHasSearch, setUserHasSearch] = useState(false)
  const [userIsSort, setUserIsSort] = useState(false)
  const [userSortConfig, setUserSortConfig] = useState<{
    key: string
    order: 'asc' | 'desc' | null
  }>({ key: '', order: null })
  const [users, setUsers] = useState<UserRow[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersErr, setUsersErr] = useState<string | null>(null)

  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null)
  const [designs, setDesigns] = useState<DesignRow[]>([])
  const [designsLoading, setDesignsLoading] = useState(false)
  const [designsErr, setDesignsErr] = useState<string | null>(null)
  const [designNewSearchType, setDesignNewSearchType] = useState('all')
  const [designOldSearchType, setDesignOldSearchType] = useState('all')
  const [designNewSearchValue, setDesignNewSearchValue] = useState('')
  const [designOldSearchValue, setDesignOldSearchValue] = useState('')
  const [designHasSearch, setDesignHasSearch] = useState(false)
  const [designIsSort, setDesignIsSort] = useState(false)
  const [designSortConfig, setDesignSortConfig] = useState<{
    key: string
    order: 'asc' | 'desc' | null
  }>({ key: '', order: null })

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

  const userQueryKey = useMemo(() => {
    const sp = new URLSearchParams()
    const q = (userHasSearch ? userNewSearchValue : userOldSearchValue).trim()
    const field = (userHasSearch ? userNewSearchType : userOldSearchType).trim()
    if (q) sp.set('q', q)
    if (field && field !== 'all') sp.set('field', field)
    if (userSortConfig.key && userSortConfig.order) sp.set('sort', `${userSortConfig.key}:${userSortConfig.order}`)
    sp.set('page', '1')
    sp.set('pageSize', '20')
    return sp.toString()
  }, [
    userHasSearch,
    userNewSearchValue,
    userOldSearchValue,
    userNewSearchType,
    userOldSearchType,
    userSortConfig.key,
    userSortConfig.order,
  ])

  async function loadUsers() {
    setUsersLoading(true)
    setUsersErr(null)
    try {
      const res = await fetch(`/api/admin/users?${userQueryKey}`)
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
      const res = await fetch(`/api/admin/products?${sp.toString()}`)
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
      const sp = new URLSearchParams()
      const q = (designHasSearch ? designNewSearchValue : designOldSearchValue).trim()
      const field = (designHasSearch ? designNewSearchType : designOldSearchType).trim()
      if (q) sp.set('q', q)
      if (field && field !== 'all') sp.set('field', field)
      if (designSortConfig.key && designSortConfig.order) sp.set('sort', `${designSortConfig.key}:${designSortConfig.order}`)
      const res = await fetch(`/api/admin/users/${userId}/designs?${sp.toString()}`)
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
  }, [userQueryKey])

  useEffect(() => {
    if (!selectedUser) return
    void loadDesigns(selectedUser.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    designHasSearch,
    designNewSearchValue,
    designOldSearchValue,
    designNewSearchType,
    designOldSearchType,
    designSortConfig.key,
    designSortConfig.order,
    selectedUser?.id,
  ])

  useEffect(() => {
    void loadProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productQ])

  const handleUserSort = (key: string) => {
    setUserSortConfig((prev) => {
      if (prev.key === key) return { key, order: prev.order === 'desc' ? 'asc' : 'desc' }
      return { key, order: 'desc' }
    })
    setUserIsSort(true)
  }

  useEffect(() => {
    if (!userIsSort) return
    void loadUsers()
    setUserIsSort(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userIsSort])

  const triggerUserSearch = () => {
    setUserOldSearchValue(userNewSearchValue)
    setUserOldSearchType(userNewSearchType)
    if (userHasSearch) void loadUsers()
    else setUserHasSearch(true)
  }

  const handleDesignSort = (key: string) => {
    setDesignSortConfig((prev) => {
      if (prev.key === key) return { key, order: prev.order === 'desc' ? 'asc' : 'desc' }
      return { key, order: 'desc' }
    })
    setDesignIsSort(true)
  }

  useEffect(() => {
    if (!designIsSort || !selectedUser) return
    void loadDesigns(selectedUser.id)
    setDesignIsSort(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [designIsSort, selectedUser?.id])

  const triggerDesignSearch = () => {
    setDesignOldSearchValue(designNewSearchValue)
    setDesignOldSearchType(designNewSearchType)
    if (designHasSearch && selectedUser) void loadDesigns(selectedUser.id)
    else setDesignHasSearch(true)
  }

  const userSearchOptions = [
    { label: '全部', value: 'all' },
    { label: '用户ID', value: 'id' },
    { label: '昵称', value: 'nickname' },
    { label: '手机', value: 'phone' },
    { label: '微信 openid', value: 'weixin_openid' },
    { label: '邮箱', value: 'email' },
    { label: '创建时间（输入日期）', value: 'createdAt' },
    { label: '更新时间（输入日期）', value: 'updatedAt' },
  ]

  const designSearchOptions = [
    { label: '全部', value: 'all' },
    { label: '作品ID', value: 'id' },
    { label: '创建时间（输入日期）', value: 'createdAt' },
    { label: '更新时间（输入日期）', value: 'updatedAt' },
    { label: '价格', value: 'totalPrice' },
  ]

  const userColumns = [
    {
      title: '用户',
      key: 'user',
      width: 260,
      render: (_: any, u: UserRow) => (
        <div>
          <div style={{ fontWeight: 600 }}>{u.nickname || '-'}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{u.id}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            {u.phone || '-'} {u.weixin_openid ? `· ${u.weixin_openid}` : ''}
          </div>
        </div>
      ),
    },
    {
      title: (
        <span
          style={{
            cursor: 'pointer',
            fontWeight: userSortConfig.key === 'createdAt' ? 600 : 400,
            color: userSortConfig.key === 'createdAt' ? '#1677ff' : 'inherit',
          }}
          onClick={() => handleUserSort('createdAt')}
        >
          创建时间
          {userSortConfig.key === 'createdAt' ? (
            userSortConfig.order === 'desc' ? (
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
      render: (t: string) => new Date(t).toLocaleString(),
    },
    {
      title: (
        <span
          style={{
            cursor: 'pointer',
            fontWeight: userSortConfig.key === 'updatedAt' ? 600 : 400,
            color: userSortConfig.key === 'updatedAt' ? '#1677ff' : 'inherit',
          }}
          onClick={() => handleUserSort('updatedAt')}
        >
          更新时间
          {userSortConfig.key === 'updatedAt' ? (
            userSortConfig.order === 'desc' ? (
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
      render: (t: string) => new Date(t).toLocaleString(),
    },
    {
      title: '作品/订单',
      key: 'counts',
      width: 140,
      render: (_: any, u: UserRow) => (
        <span style={{ fontSize: 12, color: '#334155' }}>
          作品 {u._count?.braceletDesigns ?? 0} · 订单 {u._count?.orders ?? 0}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right' as const,
      width: 90,
      render: (_: any, u: UserRow) => (
        <Button
          type="primary"
          size="small"
          loading={usersLoading}
          icon={<CheckOutlined />}
          onClick={async () => {
            setSelectedUser(u)
            await loadDesigns(u.id)
          }}
        >
          选择
        </Button>
      ),
    },
  ]

  const designColumns = [
    { title: '作品ID', dataIndex: 'id', key: 'id', width: 240, render: (id: string) => <span style={{ fontWeight: 600 }}>{id}</span> },
    {
      title: (
        <span
          style={{
            cursor: 'pointer',
            fontWeight: designSortConfig.key === 'totalPrice' ? 600 : 400,
            color: designSortConfig.key === 'totalPrice' ? '#1677ff' : 'inherit',
          }}
          onClick={() => handleDesignSort('totalPrice')}
        >
          价格
          {designSortConfig.key === 'totalPrice' ? (
            designSortConfig.order === 'desc' ? (
              <ArrowDownOutlined style={{ marginLeft: 6, color: '#1677ff', fontSize: 12 }} />
            ) : (
              <ArrowUpOutlined style={{ marginLeft: 6, color: '#1677ff', fontSize: 12 }} />
            )
          ) : (
            <ArrowDownOutlined style={{ marginLeft: 6, color: '#666', fontSize: 12 }} />
          )}
        </span>
      ),
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      width: 120,
      render: (v: number) => `¥${v}`,
    },
    {
      title: (
        <span
          style={{
            cursor: 'pointer',
            fontWeight: designSortConfig.key === 'createdAt' ? 600 : 400,
            color: designSortConfig.key === 'createdAt' ? '#1677ff' : 'inherit',
          }}
          onClick={() => handleDesignSort('createdAt')}
        >
          创建时间
          {designSortConfig.key === 'createdAt' ? (
            designSortConfig.order === 'desc' ? (
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
      render: (t: string) => new Date(t).toLocaleString(),
    },
    {
      title: (
        <span
          style={{
            cursor: 'pointer',
            fontWeight: designSortConfig.key === 'updatedAt' ? 600 : 400,
            color: designSortConfig.key === 'updatedAt' ? '#1677ff' : 'inherit',
          }}
          onClick={() => handleDesignSort('updatedAt')}
        >
          更新时间
          {designSortConfig.key === 'updatedAt' ? (
            designSortConfig.order === 'desc' ? (
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
      render: (t: string) => new Date(t).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right' as const,
      width: 90,
      render: (_: any, d: DesignRow) => (
        <Button
          danger
          size="small"
          loading={designsLoading}
          onClick={() => void deleteDesign(d.id)}
          icon={<DeleteOutlined />}
        >
          删除
        </Button>
      ),
    },
  ]

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
        <Typography.Title level={4} style={{ margin: 0 }}>
          作品集管理
        </Typography.Title>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="font-medium text-zinc-900">选择用户</div>
          </div>

          <Space direction="vertical" style={{ width: '100%', marginBottom: 12 }} size={10}>
            <Space.Compact style={{ width: '100%' }}>
              <Select
                value={userNewSearchType}
                onChange={setUserNewSearchType}
                style={{ width: 160 }}
                options={userSearchOptions}
              />
              <Input
                placeholder="输入关键字或日期（如 2026-03-17）"
                value={userNewSearchValue}
                onChange={(e) => {
                  setUserNewSearchValue(e.target.value)
                  setUserHasSearch(false)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') triggerUserSearch()
                }}
              />
              <Button type="primary" onClick={triggerUserSearch} icon={<SearchOutlined />}>
                搜索
              </Button>
            </Space.Compact>
          </Space>

          {usersErr ? (
            <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {usersErr}
            </div>
          ) : null}

          <Table
            columns={userColumns as any}
            dataSource={users}
            rowKey="id"
            size="small"
            pagination={false}
            loading={{ spinning: usersLoading, tip: '加载中...' }}
            scroll={{ x: 'max-content', y: 420 }}
            rowClassName={(u: UserRow) => (selectedUser?.id === u.id ? 'ant-table-row-selected' : '')}
          />
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
                <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm font-medium text-zinc-900">该用户现有作品</div>
                  <Space.Compact style={{ width: 420 }}>
                    <Select
                      value={designNewSearchType}
                      onChange={setDesignNewSearchType}
                      style={{ width: 160 }}
                      options={designSearchOptions}
                    />
                    <Input
                      placeholder="请输入关键词"
                      value={designNewSearchValue}
                      onChange={(e) => {
                        setDesignNewSearchValue(e.target.value)
                        setDesignHasSearch(false)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') triggerDesignSearch()
                      }}
                    />
                    <Button type="primary" onClick={triggerDesignSearch} icon={<SearchOutlined />}>
                      搜索
                    </Button>
                  </Space.Compact>
                </div>
                <Table
                  columns={designColumns as any}
                  dataSource={designs}
                  rowKey="id"
                  size="small"
                  pagination={false}
                  loading={{ spinning: designsLoading, tip: '加载中...' }}
                  scroll={{ x: 'max-content', y: 260 }}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

