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
} from '@ant-design/icons'
import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Typography,
  message,
} from 'antd'
import { braceletItemFromProductRow, type ProductRowLite } from '@/lib/product-display'

const { TextArea } = Input
const { Text } = Typography

type UserBrief = {
  id: string
  nickname: string | null
  phone: string | null
  email: string | null
}

type PlazaListRow = {
  id: string
  braceletDesignId: string
  userId: string
  adoptCount: number
  createdAt: string
  updatedAt: string
  snapshotTitle: string
  user: UserBrief
}

type PlazaPostFull = PlazaListRow & {
  snapshot: unknown
}

type ProductRow = ProductRowLite & {
  stock: number
  imageUrl: string | null
}

export default function DashboardPlazaPage() {
  const [q, setQ] = useState('')
  const [qCommitted, setQCommitted] = useState('')
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [posts, setPosts] = useState<PlazaListRow[]>([])

  const [sortConfig, setSortConfig] = useState<{ key: 'createdAt' | 'updatedAt'; order: 'asc' | 'desc' }>(
    {
      key: 'updatedAt',
      order: 'desc',
    }
  )

  const [addOpen, setAddOpen] = useState(false)
  const [addSaving, setAddSaving] = useState(false)

  // 发布者（广场作品的 owner）
  const [publisherSearchQ, setPublisherSearchQ] = useState('')
  const [publisherOptions, setPublisherOptions] = useState<UserBrief[]>([])
  const [publisherLoading, setPublisherLoading] = useState(false)
  const [publisherErr, setPublisherErr] = useState<string | null>(null)
  const [publisherId, setPublisherId] = useState('')

  // 材料选择（复用作品集添加逻辑）
  const [productSearchQ, setProductSearchQ] = useState('')
  const [products, setProducts] = useState<ProductRow[]>([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [productsErr, setProductsErr] = useState<string | null>(null)
  const [selectedProductId, setSelectedProductId] = useState('')
  const [sequence, setSequence] = useState<ProductRow[]>([])

  // 作品集字段（用于生成 braceletDesign，并进一步生成 PlazaPost 快照）
  const [formTotalPrice, setFormTotalPrice] = useState('199')
  const [formWristSize, setFormWristSize] = useState('15')
  const [formWearingStyle, setFormWearingStyle] = useState<'single' | 'double'>('single')
  const [formAdoptCount, setFormAdoptCount] = useState(0)

  const [editOpen, setEditOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [editForm] = Form.useForm<{
    braceletDesignId: string
    userId: string
    snapshotJson: string
    adoptCount: number
  }>()
  const [editSaving, setEditSaving] = useState(false)

  const queryKey = useMemo(() => {
    const sp = new URLSearchParams()
    if (qCommitted.trim()) sp.set('q', qCommitted.trim())
    if (sortConfig.key && sortConfig.order) sp.set('sort', `${sortConfig.key}:${sortConfig.order}`)
    sp.set('page', String(pagination.current))
    sp.set('pageSize', String(pagination.pageSize))
    return sp.toString()
  }, [qCommitted, pagination.current, pagination.pageSize, sortConfig.key, sortConfig.order])

  const handleSort = (key: 'createdAt' | 'updatedAt') => {
    setSortConfig((prev) => {
      if (prev.key === key) return { key, order: prev.order === 'desc' ? 'asc' : 'desc' }
      return { key, order: 'desc' }
    })
    setPagination((p) => ({ ...p, current: 1 }))
  }

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/plaza/posts?${queryKey}`)
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(json?.error || `加载失败（${res.status}）`)
        setPosts([])
        return
      }
      setPosts(json?.posts || [])
      setPagination((p) => ({ ...p, total: json?.total ?? 0 }))
    } catch (e) {
      setError(`加载失败：${String(e)}`)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey])

  const runSearch = () => {
    setQCommitted(q)
    setPagination((p) => ({ ...p, current: 1 }))
  }

  async function loadPublishers(keyword: string) {
    setPublisherLoading(true)
    setPublisherErr(null)
    try {
      const sp = new URLSearchParams()
      const kw = keyword.trim()
      if (kw) sp.set('q', kw)
      sp.set('page', '1')
      sp.set('pageSize', '1000')
      const res = await fetch(`/api/admin/users?${sp.toString()}`)
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setPublisherErr(json?.error || `加载用户失败（${res.status}）`)
        setPublisherOptions([])
        return
      }
      setPublisherOptions((json?.users || []) as UserBrief[])
    } catch (e) {
      setPublisherErr(`加载用户失败：${String(e)}`)
      setPublisherOptions([])
    } finally {
      setPublisherLoading(false)
    }
  }

  async function loadProductsList(keyword: string) {
    setProductsLoading(true)
    setProductsErr(null)
    try {
      const sp = new URLSearchParams()
      const kw = keyword.trim()
      if (kw) sp.set('q', kw)
      sp.set('page', '1')
      sp.set('pageSize', '60')
      const res = await fetch(`/api/admin/products?${sp.toString()}`)
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setProductsErr(json?.error || `加载商品失败（${res.status}）`)
        setProducts([])
        return
      }
      setProducts((json?.products || []) as ProductRow[])
    } catch (e) {
      setProductsErr(`加载商品失败：${String(e)}`)
      setProducts([])
    } finally {
      setProductsLoading(false)
    }
  }

  const openAdd = () => {
    setPublisherId('')
    setPublisherOptions([])
    setPublisherSearchQ('')
    setPublisherErr(null)

    setProductSearchQ('')
    setProducts([])
    setProductsErr(null)
    setSelectedProductId('')
    setSequence([])

    setFormTotalPrice('199')
    setFormWristSize('15')
    setFormWearingStyle('single')
    setFormAdoptCount(0)

    setAddOpen(true)
    void loadPublishers('')
    void loadProductsList('')
  }

  const submitAdd = async () => {
    if (!publisherId) {
      message.error('请先选择发布者用户')
      return
    }
    if (!sequence.length) {
      message.error('请先从商品表选择珠子序列')
      return
    }

    const totalPrice = Number(formTotalPrice)
    if (Number.isNaN(totalPrice)) {
      message.error('totalPrice 必须是数字')
      return
    }

    const wristSize = formWristSize.trim() ? Number(formWristSize) : null
    if (wristSize !== null && Number.isNaN(wristSize)) {
      message.error('wristSize 必须是数字或留空')
      return
    }

    // 复用作品集添加时的 items 结构（后续由后端生成 PlazaPost 快照）
    const items: any[] = sequence.map((p, idx) => braceletItemFromProductRow(p, idx))

    setAddSaving(true)
    try {
      // 先创建“作品集”条目，再把它同步成 PlazaPost
      const resDesign = await fetch(`/api/admin/users/${publisherId}/designs`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          items,
          totalPrice,
          wristSize,
          wearingStyle: formWearingStyle,
        }),
      })
      const jsonDesign = await resDesign.json().catch(() => ({}))
      if (!resDesign.ok) {
        message.error(jsonDesign?.error || `创建作品失败（${resDesign.status}）`)
        return
      }

      const braceletDesignId = jsonDesign?.design?.id
      if (!braceletDesignId) {
        message.error('创建作品成功但未返回 braceletDesignId')
        return
      }

      const resPlaza = await fetch('/api/admin/plaza/posts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          braceletDesignId,
          adoptCount: formAdoptCount,
        }),
      })
      const jsonPlaza = await resPlaza.json().catch(() => ({}))
      if (!resPlaza.ok) {
        message.error(jsonPlaza?.error || `保存广场失败（${resPlaza.status}）`)
        return
      }

      message.success('已保存到广场')
      setAddOpen(false)
      await load()
    } catch (e) {
      message.error(`保存失败：${String(e)}`)
    } finally {
      setAddSaving(false)
    }
  }

  const openEdit = async (row: PlazaListRow) => {
    setEditingId(row.id)
    setAddOpen(false)
    setEditOpen(true)
    setEditLoading(true)

    try {
      const res = await fetch(`/api/admin/plaza/posts/${row.id}`)
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        message.error(json?.error || '加载详情失败')
        setEditOpen(false)
        return
      }

      const post = json.post as PlazaPostFull
      const snap = (post.snapshot || {}) as Record<string, any>

      setPublisherId(post.userId || '')
      setFormAdoptCount(post.adoptCount || 0)

      setFormTotalPrice(String(snap.totalPrice ?? 0))
      setFormWristSize(snap.wristSize === null || snap.wristSize === undefined ? '' : String(snap.wristSize))
      setFormWearingStyle(snap.wearingStyle === 'double' ? 'double' : 'single')

      const snapItems = Array.isArray(snap.items) ? snap.items : []
      setSequence(
        snapItems.map((it: any, idx: number) => {
          const rawId = String(it.productId ?? it.id ?? `${idx}`)
          const baseId = rawId.replace(/_\d+$/, '')
          return {
            id: baseId,
            materialCode: it.materialCode ?? null,
            majorCategory: it.majorCategory ?? null,
            colorSeries: typeof it.color === 'string' ? it.color : null,
            title: String(it.name ?? it.title ?? `珠子${idx + 1}`),
            price: it.price ?? 0,
            diameter: typeof it.diameter === 'string' ? it.diameter : it.size ?? null,
            weight: it.weight ?? null,
            stock: 0,
            imageUrl: it.imageUrl ?? null,
          }
        })
      )

      setProductSearchQ('')
      setProducts([])
      setSelectedProductId('')
      setProductsErr(null)

      // 拉取全量用户，支持切换任意发布者
      await loadPublishers('')
      await loadProductsList('')
    } catch (e: any) {
      message.error(`加载详情失败：${e?.message || String(e)}`)
    } finally {
      setEditLoading(false)
    }
  }

  const submitEdit = async () => {
    if (!editingId) return
    if (!publisherId) {
      message.error('请先选择发布者用户')
      return
    }
    if (!sequence.length) {
      message.error('请先从商品表选择珠子序列')
      return
    }

    const totalPrice = Number(formTotalPrice)
    if (Number.isNaN(totalPrice)) {
      message.error('totalPrice 必须是数字')
      return
    }

    const wristSize = formWristSize.trim() ? Number(formWristSize) : null
    if (wristSize !== null && Number.isNaN(wristSize)) {
      message.error('wristSize 必须是数字或留空')
      return
    }

    const items: any[] = sequence.map((p, idx) => braceletItemFromProductRow(p, idx))

    setEditSaving(true)
    try {
      // 创建新的作品集 design（用于重装作品）
      const resDesign = await fetch(`/api/admin/users/${publisherId}/designs`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          items,
          totalPrice,
          wristSize,
          wearingStyle: formWearingStyle,
        }),
      })
      const jsonDesign = await resDesign.json().catch(() => ({}))
      if (!resDesign.ok) {
        message.error(jsonDesign?.error || `创建作品失败（${resDesign.status}）`)
        return
      }

      const braceletDesignId = jsonDesign?.design?.id
      if (!braceletDesignId) {
        message.error('创建作品成功但未返回 braceletDesignId')
        return
      }

      // 指向新作品并自动生成 Plaza snapshot
      const resPlaza = await fetch(`/api/admin/plaza/posts/${editingId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          userId: publisherId,
          braceletDesignId,
          adoptCount: formAdoptCount,
        }),
      })
      const jsonPlaza = await resPlaza.json().catch(() => ({}))
      if (!resPlaza.ok) {
        message.error(jsonPlaza?.error || `保存广场失败（${resPlaza.status}）`)
        return
      }

      message.success('已更新')
      setEditOpen(false)
      await load()
    } catch (e: any) {
      message.error(`保存失败：${e?.message || String(e)}`)
    } finally {
      setEditSaving(false)
    }
  }

  const deleteRow = async (id: string) => {
    const res = await fetch(`/api/admin/plaza/posts/${id}`, { method: 'DELETE' })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      message.error(json?.error || '删除失败')
      return
    }
    message.success('已删除')
    await load()
  }

  const columns = [
    {
      title: '快照标题',
      dataIndex: 'snapshotTitle',
      key: 'snapshotTitle',
      ellipsis: true,
      width: 220,
    },
    {
      title: '用户',
      key: 'user',
      width: 200,
      render: (_: unknown, r: PlazaListRow) => <div>{r.user?.nickname || '—'}</div>,
    },
    {
      title: '采纳次数',
      dataIndex: 'adoptCount',
      key: 'adoptCount',
      width: 96,
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
      width: 180,
      render: (t: string) => new Date(t).toLocaleString(),
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
      width: 180,
      render: (t: string) => new Date(t).toLocaleString(),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      fixed: 'right' as const,
      render: (_: unknown, r: PlazaListRow) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => void openEdit(r)}>
            编辑
          </Button>
          <Popconfirm title="确定删除该广场条目？" onConfirm={() => void deleteRow(r.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Typography.Title level={4} style={{ marginTop: 0 }}>
        灵感广场管理
      </Typography.Title>
      <Text type="secondary">
        管理用户发布到广场的配方快照；新增时可选择发布者并从商品表拼装手串。
      </Text>

      {error ? (
        <div style={{ marginTop: 12, color: '#cf1322' }}>{error}</div>
      ) : null}

      <Space wrap style={{ marginTop: 16, marginBottom: 16 }}>
        <Input
          allowClear
          placeholder="搜索：条目 ID / 作品 ID / 用户 ID"
          style={{ width: 320 }}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onPressEnter={runSearch}
        />
        <Button type="primary" icon={<SearchOutlined />} onClick={runSearch}>
          搜索
        </Button>
        <Button icon={<ReloadOutlined />} onClick={() => void load()}>
          刷新
        </Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
          添加
        </Button>
      </Space>

      <Table<PlazaListRow>
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={posts}
        scroll={{ x: 1100 }}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          onChange: (page, pageSize) => {
            setPagination((p) => ({ ...p, current: page, pageSize: pageSize || p.pageSize }))
          },
        }}
      />

      <Modal
        title="添加广场作品"
        open={addOpen}
        onCancel={() => setAddOpen(false)}
        onOk={() => void submitAdd()}
        confirmLoading={addSaving}
        width={980}
        destroyOnClose
      >
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 320px', minWidth: 320 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>选择发布者用户</div>
            <Space.Compact style={{ width: '100%', marginBottom: 12 }}>
              <Input
                placeholder="搜索用户（昵称 / 手机 / 邮箱）"
                value={publisherSearchQ}
                onChange={(e) => setPublisherSearchQ(e.target.value)}
                onPressEnter={() => void loadPublishers(publisherSearchQ)}
              />
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={() => void loadPublishers(publisherSearchQ)}
                loading={publisherLoading}
              >
                搜索
              </Button>
            </Space.Compact>

            {publisherErr ? (
              <div style={{ marginBottom: 12, color: '#cf1322' }}>{publisherErr}</div>
            ) : null}

            <Select
              style={{ width: '100%' }}
              placeholder="请选择用户"
              allowClear
              value={publisherId || undefined}
              options={publisherOptions.map((u) => ({
                label: u.nickname || '未设置昵称',
                value: u.id,
              }))}
              onChange={(v) => setPublisherId(v ? String(v) : '')}
            />
          </div>

          <div style={{ flex: '2 1 560px', minWidth: 420 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>从商品表选择材料组成手串（按顺序）</div>

            <Space.Compact style={{ width: '100%', marginBottom: 12 }}>
              <Input
                placeholder="搜索商品（title / 物料编号 / diameter）"
                value={productSearchQ}
                onChange={(e) => setProductSearchQ(e.target.value)}
                onPressEnter={() => void loadProductsList(productSearchQ)}
              />
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={() => void loadProductsList(productSearchQ)}
                loading={productsLoading}
              >
                加载
              </Button>
            </Space.Compact>

            {productsErr ? (
              <div style={{ marginBottom: 12, color: '#cf1322' }}>{productsErr}</div>
            ) : null}

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
              <Select
                style={{ flex: 1 }}
                placeholder="选择商品"
                allowClear
                value={selectedProductId || undefined}
                options={products.map((p) => ({
                  label: `${p.title} · ${p.materialCode || p.diameter || '-'} · ¥${String(p.price)}`,
                  value: p.id,
                }))}
                onChange={(v) => setSelectedProductId(v ? String(v) : '')}
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                disabled={!selectedProductId || productsLoading}
                onClick={() => {
                  const p = products.find((x) => x.id === selectedProductId)
                  if (!p) return
                  setSequence((s) => [...s, p])
                }}
              >
                添加
              </Button>
              <Button disabled={!sequence.length} onClick={() => setSequence([])}>
                清空
              </Button>
            </div>

              <details style={{ marginBottom: 12 }}>
                <summary style={{ fontSize: 12, color: '#64748b', cursor: 'pointer' }}>
                  当前序列（从左到右保存顺序）
                </summary>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                  {sequence.map((p, i) => (
                    <div
                      key={`${p.id}_${i}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        border: '1px solid #e2e8f0',
                        borderRadius: 999,
                        padding: '6px 10px',
                        background: '#fff',
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>{i + 1}.</span>
                      <span style={{ whiteSpace: 'nowrap' }}>{p.title}</span>
                      <Button
                        size="small"
                        danger
                        onClick={() => setSequence((s) => s.filter((_, idx) => idx !== i))}
                      >
                        删除
                      </Button>
                      <Button
                        size="small"
                        disabled={i === 0}
                        onClick={() =>
                          setSequence((s) => {
                            const next = [...s]
                            const tmp = next[i - 1]
                            next[i - 1] = next[i]
                            next[i] = tmp
                            return next
                          })
                        }
                      >
                        ↑
                      </Button>
                      <Button
                        size="small"
                        disabled={i === sequence.length - 1}
                        onClick={() =>
                          setSequence((s) => {
                            const next = [...s]
                            const tmp = next[i + 1]
                            next[i + 1] = next[i]
                            next[i] = tmp
                            return next
                          })
                        }
                      >
                        ↓
                      </Button>
                    </div>
                  ))}
                  {!sequence.length ? <div style={{ fontSize: 12, color: '#94a3b8' }}>还没选择任何珠子</div> : null}
                </div>
              </details>

            <details>
              <summary style={{ cursor: 'pointer', color: '#475569', fontSize: 12 }}>查看生成的 items JSON（只读）</summary>
              <TextArea
                rows={10}
                style={{ fontFamily: 'monospace', fontSize: 12, marginTop: 8 }}
                readOnly
                value={(() => {
                  try {
                    const items = sequence.map((p, idx) => braceletItemFromProductRow(p, idx))
                    return JSON.stringify(items, null, 2)
                  } catch {
                    return ''
                  }
                })()}
              />
            </details>
          </div>
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <label style={{ flex: '1 1 180px' }}>
            <div style={{ fontSize: 12, color: '#475569' }}>totalPrice</div>
            <Input value={formTotalPrice} onChange={(e) => setFormTotalPrice(e.target.value)} />
          </label>
          <label style={{ flex: '1 1 180px' }}>
            <div style={{ fontSize: 12, color: '#475569' }}>wristSize（可空）</div>
            <Input value={formWristSize} onChange={(e) => setFormWristSize(e.target.value)} />
          </label>
          <label style={{ flex: '1 1 180px' }}>
            <div style={{ fontSize: 12, color: '#475569' }}>wearingStyle</div>
            <Select
              value={formWearingStyle}
              options={[
                { label: 'single', value: 'single' },
                { label: 'double', value: 'double' },
              ]}
              onChange={(v) => setFormWearingStyle(v as 'single' | 'double')}
              style={{ width: '100%' }}
            />
          </label>
          <label style={{ flex: '1 1 180px' }}>
            <div style={{ fontSize: 12, color: '#475569' }}>采纳次数（可选，默认 0）</div>
            <InputNumber min={0} style={{ width: '100%' }} value={formAdoptCount} onChange={(v) => setFormAdoptCount(Number(v || 0))} />
          </label>
        </div>
      </Modal>

      <Modal
        title="编辑广场作品"
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        onOk={() => void submitEdit()}
        confirmLoading={editSaving}
        width={980}
        destroyOnClose
        footer={[
          <Button key="cancel" onClick={() => setEditOpen(false)}>
            取消
          </Button>,
          <Button
            key="ok"
            type="primary"
            loading={editSaving}
            disabled={editLoading}
            onClick={() => void submitEdit()}
          >
            保存
          </Button>,
        ]}
      >
        {editLoading ? (
          <div style={{ padding: 24 }}>加载中…</div>
        ) : (
          <div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 320px', minWidth: 320 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>选择发布者用户</div>
              <Space.Compact style={{ width: '100%', marginBottom: 12 }}>
                <Input
                  placeholder="搜索用户（昵称 / 手机 / 邮箱）"
                  value={publisherSearchQ}
                  onChange={(e) => setPublisherSearchQ(e.target.value)}
                  onPressEnter={() => void loadPublishers(publisherSearchQ)}
                />
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={() => void loadPublishers(publisherSearchQ)}
                  loading={publisherLoading}
                >
                  搜索
                </Button>
              </Space.Compact>

              {publisherErr ? <div style={{ marginBottom: 12, color: '#cf1322' }}>{publisherErr}</div> : null}

              <Select
                style={{ width: '100%' }}
                placeholder="请选择用户"
                allowClear
                value={publisherId || undefined}
                options={publisherOptions.map((u) => ({
                  label: u.nickname || '未设置昵称',
                  value: u.id,
                }))}
                onChange={(v) => setPublisherId(v ? String(v) : '')}
              />
            </div>

            <div style={{ flex: '2 1 560px', minWidth: 420 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>重新组装手串（从商品表选择材料按顺序）</div>

              <Space.Compact style={{ width: '100%', marginBottom: 12 }}>
                <Input
                  placeholder="搜索商品（title / 物料编号 / diameter）"
                  value={productSearchQ}
                  onChange={(e) => setProductSearchQ(e.target.value)}
                  onPressEnter={() => void loadProductsList(productSearchQ)}
                />
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={() => void loadProductsList(productSearchQ)}
                  loading={productsLoading}
                >
                  加载
                </Button>
              </Space.Compact>

              {productsErr ? <div style={{ marginBottom: 12, color: '#cf1322' }}>{productsErr}</div> : null}

              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                <Select
                  style={{ flex: 1 }}
                  placeholder="选择商品"
                  allowClear
                  value={selectedProductId || undefined}
                  options={products.map((p) => ({
                    label: `${p.title} · ${p.materialCode || p.diameter || '-'} · ¥${String(p.price)}`,
                    value: p.id,
                  }))}
                  onChange={(v) => setSelectedProductId(v ? String(v) : '')}
                />
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  disabled={!selectedProductId || productsLoading}
                  onClick={() => {
                    const p = products.find((x) => x.id === selectedProductId)
                    if (!p) return
                    setSequence((s) => [...s, p])
                  }}
                >
                  添加
                </Button>
                <Button disabled={!sequence.length} onClick={() => setSequence([])}>
                  清空
                </Button>
              </div>

              <details style={{ marginBottom: 12 }}>
                <summary style={{ fontSize: 12, color: '#64748b', cursor: 'pointer' }}>
                  当前序列（从左到右保存顺序）
                </summary>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                  {sequence.map((p, i) => (
                    <div
                      key={`${p.id}_${i}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        border: '1px solid #e2e8f0',
                        borderRadius: 999,
                        padding: '6px 10px',
                        background: '#fff',
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>{i + 1}.</span>
                      <span style={{ whiteSpace: 'nowrap' }}>{p.title}</span>
                      <Button size="small" danger onClick={() => setSequence((s) => s.filter((_, idx) => idx !== i))}>
                        删除
                      </Button>
                      <Button
                        size="small"
                        disabled={i === 0}
                        onClick={() =>
                          setSequence((s) => {
                            const next = [...s]
                            const tmp = next[i - 1]
                            next[i - 1] = next[i]
                            next[i] = tmp
                            return next
                          })
                        }
                      >
                        ↑
                      </Button>
                      <Button
                        size="small"
                        disabled={i === sequence.length - 1}
                        onClick={() =>
                          setSequence((s) => {
                            const next = [...s]
                            const tmp = next[i + 1]
                            next[i + 1] = next[i]
                            next[i] = tmp
                            return next
                          })
                        }
                      >
                        ↓
                      </Button>
                    </div>
                  ))}
                  {!sequence.length ? <div style={{ fontSize: 12, color: '#94a3b8' }}>还没选择任何珠子</div> : null}
                </div>
              </details>

              <details>
                <summary style={{ cursor: 'pointer', color: '#475569', fontSize: 12 }}>查看生成的 items JSON（只读）</summary>
                <TextArea
                  rows={10}
                  style={{ fontFamily: 'monospace', fontSize: 12, marginTop: 8 }}
                  readOnly
                  value={(() => {
                    try {
                      const items = sequence.map((p, idx) => braceletItemFromProductRow(p, idx))
                      return JSON.stringify(items, null, 2)
                    } catch {
                      return ''
                    }
                  })()}
                />
              </details>
            </div>
          </div>

          <div style={{ marginTop: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <label style={{ flex: '1 1 180px' }}>
              <div style={{ fontSize: 12, color: '#475569' }}>totalPrice</div>
              <Input value={formTotalPrice} onChange={(e) => setFormTotalPrice(e.target.value)} />
            </label>
            <label style={{ flex: '1 1 180px' }}>
              <div style={{ fontSize: 12, color: '#475569' }}>wristSize（可空）</div>
              <Input value={formWristSize} onChange={(e) => setFormWristSize(e.target.value)} />
            </label>
            <label style={{ flex: '1 1 180px' }}>
              <div style={{ fontSize: 12, color: '#475569' }}>wearingStyle</div>
              <Select
                value={formWearingStyle}
                options={[
                  { label: 'single', value: 'single' },
                  { label: 'double', value: 'double' },
                ]}
                onChange={(v) => setFormWearingStyle(v as 'single' | 'double')}
                style={{ width: '100%' }}
              />
            </label>
            <label style={{ flex: '1 1 220px' }}>
              <div style={{ fontSize: 12, color: '#475569' }}>同款次数（可选，默认 0）</div>
              <InputNumber min={0} style={{ width: '100%' }} value={formAdoptCount} onChange={(v) => setFormAdoptCount(Number(v || 0))} />
            </label>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
