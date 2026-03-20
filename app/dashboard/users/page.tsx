'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import {
  Button,
  Form,
  Image,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'

type UserRow = {
  id: string
  role: string
  weixin_openid: string | null
  email: string | null
  avatar: string | null
  gender: number | null
  nickname: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

type UserFormValues = {
  email?: string | null
  nickname: string
  avatar?: string
  gender: number
  weixin_openid?: string
  password?: string
  role: 'USER' | 'SUPER_ADMIN'
}

function roleTag(role: string) {
  const r = (role || '').toUpperCase()
  if (r === 'ADMIN') return <Tag color="gold">超级管理员</Tag>
  if (r === 'SUPER_ADMIN') return <Tag color="gold">超级管理员</Tag>
  if (r === 'USER') return <Tag color="blue">用户</Tag>
  return <Tag>{role}</Tag>
}

function genderText(gender: number | null | undefined) {
  if (gender === 1) return '男'
  if (gender === 2) return '女'
  return '未知'
}

function formatTime(v: string | null | undefined) {
  if (!v) return '-'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleString('zh-CN', { hour12: false })
}

export default function DashboardUsersPage() {
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
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<UserRow[]>([])
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<UserRow | null>(null)
  const [form] = Form.useForm<UserFormValues>()

  const queryKey = useMemo(() => {
    const sp = new URLSearchParams()
    const q = (hasSearch ? newSearchValue : oldSearchValue).trim()
    const field = (hasSearch ? newSearchType : oldSearchType).trim()
    if (q) sp.set('q', q)
    if (field && field !== 'all') sp.set('field', field)
    sp.set('sort', 'createdAt:desc')
    sp.set('page', String(pagination.current))
    sp.set('pageSize', String(pagination.pageSize))
    return sp.toString()
  }, [
    hasSearch,
    newSearchValue,
    oldSearchValue,
    newSearchType,
    oldSearchType,
    pagination.current,
    pagination.pageSize,
  ])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/users?${queryKey}`)
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(json?.error || `加载失败（${res.status}）`)
        setUsers([])
        return
      }
      setUsers(json?.users || [])
      const total = json?.total || 0
      setPagination((p) => ({ ...p, total }))
    } catch (e) {
      setError(`加载失败：${String(e)}`)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey])

  const openCreate = () => {
    setEditing(null)
    form.setFieldsValue({
      email: '',
      nickname: '',
      avatar: '',
      gender: 0,
      weixin_openid: '',
      password: '',
      role: 'USER',
    })
    setModalOpen(true)
  }

  const openEdit = (row: UserRow) => {
    setEditing(row)
    form.setFieldsValue({
      email: row.email || '',
      nickname: row.nickname || '',
      avatar: row.avatar || '',
      gender: Number(row.gender ?? 0),
      weixin_openid: row.weixin_openid || '',
      role: row.role === 'SUPER_ADMIN' || row.role === 'ADMIN' ? 'SUPER_ADMIN' : 'USER',
      password: '',
    })
    setModalOpen(true)
  }

  const submitForm = async () => {
    const values = await form.validateFields()
    const payload = {
      email: values.email ? String(values.email).trim().toLowerCase() : '',
      nickname: values.nickname.trim(),
      avatar: (values.avatar || '').trim(),
      gender: Number(values.gender || 0),
      weixin_openid: (values.weixin_openid || '').trim(),
      role: values.role,
      ...(values.password && String(values.password).trim() ? { password: String(values.password).trim() } : {}),
    }

    setSaving(true)
    try {
      const url = editing ? `/api/admin/users/${editing.id}` : '/api/admin/users'
      const method = editing ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: {
          'content-type': 'application/json',
        },
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

  const removeUser = async (row: UserRow) => {
    try {
      const res = await fetch(`/api/admin/users/${row.id}`, {
        method: 'DELETE',
      })
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

  const columns: ColumnsType<UserRow> = [
    {
      title: '昵称',
      dataIndex: 'nickname',
      render: (v) => v || '-',
      width: 180,
    },
    {
      title: '头像',
      dataIndex: 'avatar',
      width: 120,
      render: (v) => {
        const url = String(v || '').trim()
        if (!url) return '-'
        return (
          <Image
            src={url}
            width={42}
            height={42}
            style={{ borderRadius: 999, objectFit: 'cover' }}
            preview
          />
        )
      },
    },
    {
      title: '性别',
      dataIndex: 'gender',
      render: (v) => genderText(v),
      width: 100,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      render: (v) => (
        <Typography.Text style={{ maxWidth: 240 }} ellipsis={{ tooltip: v || '' }}>
          {v || '-'}
        </Typography.Text>
      ),
      width: 240,
    },
    {
      title: '微信 OpenID',
      dataIndex: 'weixin_openid',
      render: (v) => (
        <Typography.Text style={{ maxWidth: 300 }} ellipsis={{ tooltip: v || '' }}>
          {v || '-'}
        </Typography.Text>
      ),
      width: 300,
    },
    {
      title: '角色',
      dataIndex: 'role',
      render: (v) => roleTag(String(v || '')),
      width: 140,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      render: (v) => formatTime(v),
      width: 180,
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      render: (v) => formatTime(v),
      width: 180,
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
          <Popconfirm title="确认删除该用户？" onConfirm={() => void removeUser(row)} okText="删除" cancelText="取消">
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
          用户管理
        </Typography.Title>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新增用户
          </Button>
        </Space>
      </div>

      <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <Space.Compact style={{ width: 520 }}>
          <Select
            value={newSearchType}
            onChange={(v) => setNewSearchType(v)}
            options={[
              { value: 'all', label: '全部字段' },
              { value: 'id', label: '用户ID' },
              { value: 'nickname', label: '昵称' },
              { value: 'email', label: '邮箱' },
              { value: 'weixin_openid', label: 'OpenID' },
              { value: 'role', label: '角色(USER/SUPER_ADMIN)' },
            ]}
            style={{ width: 190 }}
          />
          <Input
            value={newSearchValue}
            onChange={(e) => setNewSearchValue(e.target.value)}
            placeholder="输入关键词"
            onPressEnter={() => {
              setOldSearchType(newSearchType)
              setOldSearchValue(newSearchValue)
              setHasSearch(true)
              setPagination((p) => ({ ...p, current: 1 }))
            }}
            allowClear
          />
          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={() => {
              setOldSearchType(newSearchType)
              setOldSearchValue(newSearchValue)
              setHasSearch(true)
              setPagination((p) => ({ ...p, current: 1 }))
            }}
          >
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
        <Table<UserRow>
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={users}
          scroll={{ x: 1600 }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
            showTotal: (t) => `共 ${t} 条`,
            onChange: (current, pageSize) => {
              setPagination((p) => ({ ...p, current, pageSize }))
            },
          }}
        />
      </div>

      <Modal
        title={editing ? '编辑用户' : '新增用户'}
        open={modalOpen}
        onOk={() => void submitForm()}
        onCancel={() => setModalOpen(false)}
        confirmLoading={saving}
        okText={editing ? '保存' : '创建'}
        cancelText="取消"
      >
        <Form<UserFormValues> form={form} layout="vertical">
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              {
                type: 'email',
                message: '邮箱格式不正确',
              },
            ]}
          >
            <Input placeholder="可为空；如填写将用于忘记密码" />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={[
              {
                required: !editing,
                message: '请输入密码',
              },
              {
                validator: (_, value) => {
                  const v = typeof value === 'string' ? value.trim() : ''
                  // 创建时密码不能为空；编辑时留空表示不修改密码
                  if (!v) return editing ? Promise.resolve() : Promise.reject(new Error('请输入密码'))
                  if (v.length < 8) return Promise.reject(new Error('密码长度至少 8 位'))
                  return Promise.resolve()
                },
              },
            ]}
          >
            <Input.Password placeholder={editing ? '留空表示不修改' : '请输入密码'} />
          </Form.Item>
          <Form.Item
            name="nickname"
            label="昵称"
            rules={[{ required: true, message: '请输入昵称' }]}
          >
            <Input placeholder="请输入昵称" />
          </Form.Item>
          <Form.Item name="avatar" label="头像 URL">
            <Input placeholder="可为空，前端会走默认头像" />
          </Form.Item>
          <Form.Item name="gender" label="性别">
            <Select
              options={[
                { value: 0, label: '未知' },
                { value: 1, label: '男' },
                { value: 2, label: '女' },
              ]}
            />
          </Form.Item>
          <Form.Item name="weixin_openid" label="微信 OpenID">
            <Input placeholder="可为空；如填写需唯一" />
          </Form.Item>
          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select
              options={[
                { value: 'USER', label: '用户' },
                { value: 'SUPER_ADMIN', label: '超级管理员' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

