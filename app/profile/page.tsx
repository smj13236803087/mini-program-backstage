'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type User = {
  id: string
  email: string
  name: string | null
  shopifyCustomerId: string | null
}

export default function Profile() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login')
          return
        }
        throw new Error('获取用户信息失败')
      }
      const data = await res.json()
      setUser(data.user)
    } catch (err) {
      setError('获取用户信息失败')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
    } catch (err) {
      console.error('登出失败：', err)
    }
  }

  if (loading) {
    return (
      <main className="pt-16 min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-md p-8">
            <p className="text-gray-600">加载中...</p>
          </div>
        </div>
      </main>
    )
  }

  if (error || !user) {
    return (
      <main className="pt-16 min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-md p-8">
            <p className="text-red-600">{error || '未登录'}</p>
            <Link
              href="/login"
              className="mt-4 inline-block text-blue-600 hover:text-blue-700"
            >
              前往登录
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="pt-16 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">我的</h1>
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                邮箱
              </label>
              <p className="text-gray-900">{user.email}</p>
            </div>
            {user.name && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  姓名
                </label>
                <p className="text-gray-900">{user.name}</p>
              </div>
            )}
            {user.shopifyCustomerId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shopify 客户 ID
                </label>
                <p className="text-gray-900">{user.shopifyCustomerId}</p>
              </div>
            )}
            <div className="pt-4 border-t">
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                登出
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
