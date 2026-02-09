'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BraceletItem } from '@/types/bracelet'
import BraceletPreview from '@/components/workspace/BraceletPreview'
import type { WearingStyle } from '@/components/workspace/WristSizeModal'
import { Loader2, Pencil, Trash2, PlusCircle } from 'lucide-react'

type Design = {
  id: string
  name: string
  totalPrice: number
  totalWeight: number | null
  averageDiameter: number | null
  wristSize: number | null
  wearingStyle: WearingStyle | null
  items: BraceletItem[]
  createdAt: string
}

export default function PortfolioPage() {
  const router = useRouter()
  const [designs, setDesigns] = useState<Design[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchDesigns = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/designs')
      if (!res.ok) {
        throw new Error('获取作品集失败')
      }
      const data = await res.json()
      setDesigns(data.designs || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDesigns()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个作品吗？此操作不可恢复。')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/designs/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || '删除失败')
        return
      }
      setDesigns((prev) => prev.filter((d) => d.id !== id))
    } catch (e) {
      console.error(e)
      alert('删除失败，请稍后再试')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <main className="pt-16 min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-12 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">正在加载作品集...</p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="pt-16 min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              我的作品集
            </h1>
            <p className="text-gray-600 mt-1">
              管理你设计好的手串作品，继续编辑或删除
            </p>
          </div>
          <button
            onClick={() => router.push('/workspace')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            <PlusCircle className="w-5 h-5" />
            新建作品
          </button>
        </div>

        {designs.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-12 text-center">
            <p className="text-gray-600 mb-4">你还没有保存任何作品。</p>
            <button
              onClick={() => router.push('/workspace')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-medium shadow hover:bg-blue-700 transition-colors"
            >
              <PlusCircle className="w-5 h-5" />
              前往工作台开始设计
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {designs.map((design) => (
              <div
                key={design.id}
                className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/40 flex flex-col overflow-hidden"
              >
                {/* 预览区域，点击进入详情，底部带操作条 */}
                <div
                  onClick={() => router.push(`/portfolio/${design.id}`)}
                  className="w-full px-3 pt-3 pb-2 border-b border-gray-100 hover:bg-gray-50/50 transition-colors cursor-pointer"
                >
                  <div className="relative flex items-center justify-center bg-gray-50 rounded-xl overflow-hidden py-3">
                    <BraceletPreview
                      items={design.items || []}
                      onRemoveItem={() => {}}
                      onReorderItems={() => {}}
                      wristSize={design.wristSize}
                      wearingStyle={design.wearingStyle}
                      size={240}
                      hideTips
                    />

                    {/* 底部半透明操作条，始终贴着卡片下沿可见 */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white/95 via-white/80 to-transparent px-2.5 pb-2.5 pt-4">
                      <div className="flex items-center justify-between gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/workspace?designId=${design.id}`)
                          }}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-full bg-blue-600 text-white text-[11px] font-medium hover:bg-blue-700 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                          编辑
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(design.id)
                          }}
                          disabled={deletingId === design.id}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-full bg-red-50 text-red-600 text-[11px] font-medium hover:bg-red-100 disabled:opacity-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          {deletingId === design.id ? '删除中' : '删除'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 文本信息区域（卡片上仅展示名称和价格，详细参数在详情页展示） */}
                <div className="px-3 pt-2 pb-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold text-gray-900 truncate">
                      {design.name}
                    </h2>
                    <span className="text-sm font-bold text-blue-600">
                      ¥{design.totalPrice}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

