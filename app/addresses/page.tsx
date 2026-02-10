'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  MapPin,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  Loader2,
  AlertCircle,
  Home,
  Building2,
  School,
  Star,
  ArrowLeft,
} from 'lucide-react'
import { CHINA_REGIONS, type ChinaRegionNode } from '@/lib/china-regions'

type Address = {
  id: string
  recipient: string
  phone: string
  country: string
  province: string
  city: string
  district: string
  detail: string
  postalCode: string | null
  tag: string | null
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

type AddressFormData = {
  recipient: string
  phone: string
  country: string
  province: string
  city: string
  district: string
  detail: string
  postalCode: string
  tag: string
  isDefault: boolean
}

const TAG_OPTIONS = [
  { value: '家', icon: Home, color: 'from-blue-500 to-blue-600' },
  { value: '公司', icon: Building2, color: 'from-purple-500 to-purple-600' },
  { value: '学校', icon: School, color: 'from-green-500 to-green-600' },
]

export default function AddressesPage() {
  const router = useRouter()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState<AddressFormData>({
    recipient: '',
    phone: '',
    country: '中国',
    province: '',
    city: '',
    district: '',
    detail: '',
    postalCode: '',
    tag: '',
    isDefault: false,
  })
  const [submitting, setSubmitting] = useState(false)

  // 根据选择的省份/城市，动态计算可选项
  // 不做任何默认选中，初始状态下为空，只显示“请选择xxx”的灰色提示
  const selectedProvince = useMemo(
    () => CHINA_REGIONS.find((p) => p.name === formData.province),
    [formData.province]
  )

  const cityOptions: ChinaRegionNode[] = useMemo(() => {
    if (!selectedProvince?.children) return []
    return selectedProvince.children
  }, [selectedProvince])

  const selectedCity = useMemo(
    () => cityOptions.find((c) => c.name === formData.city),
    [cityOptions, formData.city]
  )

  const districtOptions: ChinaRegionNode[] = useMemo(() => {
    if (!selectedCity?.children) return []
    return selectedCity.children
  }, [selectedCity])

  useEffect(() => {
    fetchAddresses()
  }, [])

  const fetchAddresses = async () => {
    try {
      const res = await fetch('/api/addresses')
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login')
          return
        }
        throw new Error('获取地址列表失败')
      }
      const data = await res.json()
      setAddresses(data.addresses || [])
    } catch (err) {
      setError('获取地址列表失败')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (address: Address) => {
    setFormData({
      recipient: address.recipient,
      phone: address.phone,
      country: address.country,
      province: address.province,
      city: address.city,
      district: address.district,
      detail: address.detail,
      postalCode: address.postalCode || '',
      tag: address.tag || '',
      isDefault: address.isDefault,
    })
    setEditingId(address.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个地址吗？')) return

    try {
      const res = await fetch(`/api/addresses/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('删除失败')
      await fetchAddresses()
    } catch (err) {
      alert('删除地址失败')
      console.error(err)
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      const res = await fetch(`/api/addresses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      })
      if (!res.ok) throw new Error('设置默认地址失败')
      await fetchAddresses()
    } catch (err) {
      alert('设置默认地址失败')
      console.error(err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const url = editingId
        ? `/api/addresses/${editingId}`
        : '/api/addresses'
      const method = editingId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || '保存失败')
      }

      await fetchAddresses()
      setShowForm(false)
      setEditingId(null)
      setFormData({
        recipient: '',
        phone: '',
        country: '中国',
        province: '',
        city: '',
        district: '',
        detail: '',
        postalCode: '',
        tag: '',
        isDefault: false,
      })
    } catch (err: any) {
      alert(err.message || '保存地址失败')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData({
      recipient: '',
      phone: '',
      country: '中国',
      province: '',
      city: '',
      district: '',
      detail: '',
      postalCode: '',
      tag: '',
      isDefault: false,
    })
  }

  if (loading) {
    return (
      <main className="pt-16 min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-12 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">加载中...</p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="pt-16 min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-red-200">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <p className="text-red-600 font-semibold">{error}</p>
            </div>
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              返回个人中心
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="pt-16 min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 头部 */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>返回个人中心</span>
            </Link>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              我的地址
            </h1>
            <p className="text-gray-600">管理你的收货地址信息</p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              新增地址
            </button>
          )}
        </div>

        {/* 地址表单 */}
        {showForm && (
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 mb-6 border border-white/20">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingId ? '编辑地址' : '新增地址'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    收件人姓名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.recipient}
                    onChange={(e) =>
                      setFormData({ ...formData, recipient: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="请输入收件人姓名"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    手机号码 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="请输入手机号码"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    省份 <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.province}
                    onChange={(e) => {
                      const provinceName = e.target.value
                      setFormData({
                        ...formData,
                        province: provinceName,
                        city: '',
                        district: '',
                      })
                    }}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      formData.province ? 'text-gray-900' : 'text-gray-400'
                    }`}
                  >
                    <option value="" disabled>
                      请选择省份
                    </option>
                    {CHINA_REGIONS.map((p) => (
                      <option key={p.code} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    城市 <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.city}
                    onChange={(e) => {
                      const cityName = e.target.value
                      setFormData({
                        ...formData,
                        city: cityName,
                        district: '',
                      })
                    }}
                    disabled={!selectedProvince}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:text-gray-400 ${
                      formData.city ? 'text-gray-900' : 'text-gray-400'
                    }`}
                  >
                    <option value="" disabled>
                      请选择城市
                    </option>
                    {cityOptions.map((c) => (
                      <option key={c.code} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    区/县 <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.district}
                    onChange={(e) =>
                      setFormData({ ...formData, district: e.target.value })
                    }
                    disabled={!selectedCity}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:text-gray-400 ${
                      formData.district ? 'text-gray-900' : 'text-gray-400'
                    }`}
                  >
                    <option value="" disabled>
                      请选择区/县
                    </option>
                    {districtOptions.map((d) => (
                      <option key={d.code} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  详细地址 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.detail}
                  onChange={(e) =>
                    setFormData({ ...formData, detail: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="请输入街道、门牌号等详细地址"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    邮政编码
                  </label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) =>
                      setFormData({ ...formData, postalCode: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="请输入邮政编码（可选）"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    地址标签
                  </label>
                  <div className="flex gap-3">
                    {TAG_OPTIONS.map((option) => {
                      const Icon = option.icon
                      const isSelected = formData.tag === option.value
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              tag: isSelected ? '' : option.value,
                            })
                          }
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all ${
                            isSelected
                              ? `bg-gradient-to-r ${option.color} text-white border-transparent shadow-lg`
                              : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{option.value}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) =>
                    setFormData({ ...formData, isDefault: e.target.checked })
                  }
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label
                  htmlFor="isDefault"
                  className="text-sm font-semibold text-gray-700 cursor-pointer"
                >
                  设为默认地址
                </label>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      保存地址
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={submitting}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <X className="w-5 h-5" />
                  取消
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 地址列表 */}
        {addresses.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-12 border border-white/20 text-center">
            <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              还没有收货地址
            </h3>
            <p className="text-gray-600 mb-6">添加你的第一个收货地址吧</p>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
              >
                <Plus className="w-5 h-5" />
                新增地址
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map((address) => {
              const tagOption = TAG_OPTIONS.find((t) => t.value === address.tag)
              const TagIcon = tagOption?.icon || MapPin

              return (
                <div
                  key={address.id}
                  className={`bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border-2 transition-all hover:shadow-2xl ${
                    address.isDefault
                      ? 'border-blue-500 bg-gradient-to-br from-blue-50/50 to-purple-50/50'
                      : 'border-white/20'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        {address.isDefault && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-semibold rounded-full shadow-lg">
                            <Star className="w-3 h-3 fill-current" />
                            默认地址
                          </span>
                        )}
                        {address.tag && tagOption && (
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r ${tagOption.color} text-white text-xs font-semibold rounded-full shadow-lg`}
                          >
                            <TagIcon className="w-3 h-3" />
                            {address.tag}
                          </span>
                        )}
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-gray-900">
                            {address.recipient}
                          </span>
                          <span className="text-gray-600">{address.phone}</span>
                        </div>
                        <div className="text-gray-700 leading-relaxed">
                          <p>
                            {address.country} {address.province} {address.city}{' '}
                            {address.district}
                          </p>
                          <p className="text-gray-600">{address.detail}</p>
                          {address.postalCode && (
                            <p className="text-sm text-gray-500 mt-1">
                              邮编：{address.postalCode}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      {!address.isDefault && (
                        <button
                          onClick={() => handleSetDefault(address.id)}
                          className="px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors flex items-center gap-2"
                          title="设为默认"
                        >
                          <Star className="w-4 h-4" />
                          设为默认
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(address)}
                        className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(address.id)}
                        className="px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
