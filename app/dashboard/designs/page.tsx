'use client'

import { useEffect, useMemo, useState } from 'react'
import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons'
import {
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Typography,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'

type DesignRow = {
  id: string
  userId: string
  totalPrice: number
  totalWeight: number | null
  averageDiameter: number | null
  wristSize: number | null
  wearingStyle: string | null
  items: unknown
  createdAt: string
  updatedAt: string
  user?: {
    id: string
    nickname: string | null
    phone: string | null
  } | null
}

type DesignFormValues = {
  userId: string
  totalPrice: number
  totalWeight?: number | null
  averageDiameter?: number | null
  wristSize?: number | null
  wearingStyle?: string | null
  itemsJson: string
}

type UserOption = {
  id: string
  nickname: string | null
  phone?: string | null
}

function formatTime(v: string | null | undefined) {
  if (!v) return '-'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleString('zh-CN', { hour12: false })
}

function parseOptionalNumber(v: unknown): number | null {
  if (v === undefined || v === null || v === '') return null
  const n = Number(v)
  return Number.isNaN(n) ? null : n
}

export default function DashboardDesignsPage() {
  const [newSearchType, setNewSearchType] = useState('all')
  const [oldSearchType, setOldSearchType] = useState('all')
  const [newSearchValue, setNewSearchValue] = useState('')
  const [oldSearchValue, setOldSearchValue] = useState('')
  const [hasSearch, setHasSearch] = useState(false)

  const [sortConfig, setSortConfig] = useState<{
    key: string
    order: 'asc' | 'desc' | null
  }>({ key: 'createdAt', order: 'desc' })

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [designs, setDesigns] = useState<DesignRow[]>([])
  const [saving, setSaving] = useState(false)
  const [usersLoading, setUsersLoading] = useState(false)
  const [userOptions, setUserOptions] = useState<UserOption[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<DesignRow | null>(null)
  const [form] = Form.useForm<DesignFormValues>()

  async function loadUserOptions(keyword = '') {
    setUsersLoading(true)
    try {
      const sp = new URLSearchParams()
      if (keyword.trim()) {
        sp.set('q', keyword.trim())
      }
      sp.set('page', '1')
      sp.set('pageSize', '30')
      sp.set('sort', 'createdAt:desc')
      const res = await fetch(`/api/admin/users?${sp.toString()}`)
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        message.error(json?.error || `加载用户失败（${res.status}）`)
        return
      }
      setUserOptions((json?.users || []) as UserOption[])
    } catch (e) {
      message.error(`加载用户失败：${String(e)}`)
    } finally {
      setUsersLoading(false)
    }
  }

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
    newSearchType,
    oldSearchType,
    newSearchValue,
    oldSearchValue,
    sortConfig.key,
    sortConfig.order,
    pagination.current,
    pagination.pageSize,
  ])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/designs?${queryKey}`)
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(json?.error || `加载失败（${res.status}）`)
        setDesigns([])
        return
      }
      setDesigns(json?.designs || [])
      setPagination((prev) => ({ ...prev, total: json?.total || 0 }))
    } catch (e) {
      setError(`加载失败：${String(e)}`)
      setDesigns([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey])

  const triggerSearch = () => {
    setOldSearchType(newSearchType)
    setOldSearchValue(newSearchValue)
    setHasSearch(true)
    setPagination((prev) => ({ ...prev, current: 1 }))
  }

  const openCreate = () => {
    setEditing(null)
    void loadUserOptions()
    form.setFieldsValue({
      userId: '',
      totalPrice: 0,
      totalWeight: null,
      averageDiameter: null,
      wristSize: null,
      wearingStyle: 'single',
      itemsJson: '[]',
    })
    setModalOpen(true)
  }

  const openEdit = (row: DesignRow) => {
    setEditing(row)
    void loadUserOptions(row.user?.nickname || row.userId || '')
    setUserOptions((prev) => {
      if (prev.some((u) => u.id === row.userId)) return prev
      return [
        { id: row.userId, nickname: row.user?.nickname || null, phone: row.user?.phone || null },
        ...prev,
      ]
    })
    form.setFieldsValue({
      userId: row.userId,
      totalPrice: row.totalPrice,
      totalWeight: row.totalWeight ?? null,
      averageDiameter: row.averageDiameter ?? null,
      wristSize: row.wristSize ?? null,
      wearingStyle: row.wearingStyle || '',
      itemsJson: JSON.stringify(Array.isArray(row.items) ? row.items : [], null, 2),
    })
    setModalOpen(true)
  }

  const submitForm = async () => {
    const values = await form.validateFields()
    let parsedItems: unknown
    try {
      parsedItems = JSON.parse(values.itemsJson)
    } catch {
      message.error('items JSON 格式不正确')
      return
    }
    if (!Array.isArray(parsedItems)) {
      message.error('items 必须是数组')
      return
    }

    const payload = {
      userId: values.userId.trim(),
      totalPrice: Number(values.totalPrice),
      totalWeight: parseOptionalNumber(values.totalWeight),
      averageDiameter: parseOptionalNumber(values.averageDiameter),
      wristSize: parseOptionalNumber(values.wristSize),
      wearingStyle: (values.wearingStyle || '').trim() || null,
      items: parsedItems,
    }

    setSaving(true)
    try {
      const url = editing ? `/api/admin/designs/${editing.id}` : '/api/admin/designs'
      const method = editing ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        message.error(json?.error || `${editing ? '更新' : '创建'}失败（${res.status}）`)
        return
      }
      message.success(editing ? '更新成功' : '创建成功')
      setModalOpen(false)
      await load()
    } catch (e) {
      message.error(`${editing ? '更新' : '创建'}失败：${String(e)}`)
    } finally {
      setSaving(false)
    }
  }

  const removeDesign = async (row: DesignRow) => {
    try {
      const res = await fetch(`/api/admin/designs/${row.id}`, { method: 'DELETE' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        message.error(json?.error || `删除失败（${res.status}）`)
        return
      }
      message.success('删除成功')
      await load()
    } catch (e) {
      message.error(`删除失败：${String(e)}`)
    }
  }

  const columns: ColumnsType<DesignRow> = [
    {
      title: '作品ID',
      dataIndex: 'id',
      width: 240,
      render: (id: string) => (
        <Typography.Text style={{ maxWidth: 220 }} ellipsis={{ tooltip: id }}>
          {id}
        </Typography.Text>
      ),
    },
    {
      title: '用户',
      key: 'user',
      width: 280,
      render: (_, row) => (
        <div>
          <div>{row.user?.nickname || '-'}</div>
          <Typography.Text style={{ maxWidth: 260 }} ellipsis={{ tooltip: row.userId }}>
            {row.userId}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: '总价',
      dataIndex: 'totalPrice',
      width: 110,
      sorter: true,
      render: (v) => `¥${String(v)}`,
    },
    {
      title: '手围',
      dataIndex: 'wristSize',
      width: 100,
      sorter: true,
      render: (v) => (v === null || v === undefined ? '-' : String(v)),
    },
    {
      title: '佩戴方式',
      dataIndex: 'wearingStyle',
      width: 110,
      render: (v) => v || '-',
    },
    {
      title: '珠子数量',
      dataIndex: 'items',
      width: 110,
      render: (items) => (Array.isArray(items) ? items.length : 0),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 180,
      sorter: true,
      render: (v) => formatTime(v),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 180,
      sorter: true,
      render: (v) => formatTime(v),
    },
    {
      title: '操作',
      key: 'actions',
      fixed: 'right',
      width: 170,
      render: (_, row) => (
        <Space size={8} wrap>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(row)}>
            编辑
          </Button>
          <Popconfirm title="确认删除该作品？" onConfirm={() => void removeDesign(row)} okText="删除" cancelText="取消">
            <Button size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          作品集管理
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          新增作品
        </Button>
      </div>

      <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <Space.Compact style={{ width: 520 }}>
          <Select
            value={newSearchType}
            onChange={(v) => setNewSearchType(v)}
            options={[
              { value: 'all', label: '全部字段' },
              { value: 'id', label: '作品ID' },
              { value: 'userId', label: '用户ID' },
              { value: 'wearingStyle', label: '佩戴方式' },
              { value: 'totalPrice', label: '总价' },
            ]}
            style={{ width: 170 }}
          />
          <Input
            value={newSearchValue}
            onChange={(e) => setNewSearchValue(e.target.value)}
            placeholder="输入关键词"
            onPressEnter={triggerSearch}
            allowClear
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={triggerSearch}>
            搜索
          </Button>
        </Space.Compact>
      </div>

      {error ? (
        <Typography.Text type="danger" style={{ display: 'block', marginTop: 12 }}>
          {error}
        </Typography.Text>
      ) : null}

      <div style={{ marginTop: 16 }}>
        <Table<DesignRow>
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={designs}
          scroll={{ x: 1700 }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
            showTotal: (t) => `共 ${t} 条`,
          }}
          onChange={(p, _, sorter: any) => {
            const nextSort = Array.isArray(sorter) ? sorter[0] : sorter
            const field = String(nextSort?.field || '')
            const order =
              nextSort?.order === 'ascend'
                ? 'asc'
                : nextSort?.order === 'descend'
                  ? 'desc'
                  : null
            if (field && order) {
              setSortConfig({ key: field, order })
            } else {
              setSortConfig({ key: 'createdAt', order: 'desc' })
            }
            setPagination((prev) => ({
              ...prev,
              current: p.current || 1,
              pageSize: p.pageSize || prev.pageSize,
            }))
          }}
        />
      </div>

      <Modal
        title={editing ? '编辑作品' : '新增作品'}
        open={modalOpen}
        onOk={() => void submitForm()}
        onCancel={() => setModalOpen(false)}
        confirmLoading={saving}
        okText={editing ? '保存' : '创建'}
        cancelText="取消"
        width={760}
      >
        <Form<DesignFormValues> form={form} layout="vertical">
          <Form.Item name="userId" label="用户" rules={[{ required: true, message: '请选择用户' }]}>
            <Select
              showSearch
              placeholder="请选择用户（可搜索昵称/手机号/ID）"
              filterOption={false}
              onSearch={(value) => {
                void loadUserOptions(value)
              }}
              loading={usersLoading}
              options={userOptions.map((u) => ({
                value: u.id,
                label: `${u.nickname || '未命名用户'} · ${u.phone || '-'} · ${u.id}`,
              }))}
            />
          </Form.Item>
          <Form.Item name="totalPrice" label="总价" rules={[{ required: true, message: '请输入总价' }]}>
            <Input type="number" min={0} />
          </Form.Item>
          <Form.Item name="wearingStyle" label="佩戴方式">
            <Select
              allowClear
              options={[
                { value: 'single', label: 'single' },
                { value: 'double', label: 'double' },
              ]}
            />
          </Form.Item>
          <Form.Item name="wristSize" label="手围（可空）">
            <Input type="number" />
          </Form.Item>
          <Form.Item name="totalWeight" label="总重（可空）">
            <Input type="number" />
          </Form.Item>
          <Form.Item name="averageDiameter" label="平均粒径（可空）">
            <Input type="number" />
          </Form.Item>
          <Form.Item
            name="itemsJson"
            label="items JSON（数组）"
            rules={[{ required: true, message: '请输入 items JSON' }]}
          >
            <Input.TextArea rows={10} placeholder='例如：[{"productId":"xxx","name":"紫水晶","price":99}]' />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

