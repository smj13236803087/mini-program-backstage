'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { BraceletItem } from '@/types/bracelet'
import BraceletPreview from '@/components/workspace/BraceletPreview'
import type { WearingStyle } from '@/components/workspace/WristSizeModal'
import { Loader2, ArrowLeft, Pencil } from 'lucide-react'

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

export default function DesignDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const [design, setDesign] = useState<Design | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    async function fetchDesign() {
      try {
        setLoading(true)
        const res = await fetch(`/api/designs/${id}`)
        if (!res.ok) {
          router.push('/portfolio')
          return
        }
        const data = await res.json()
        setDesign(data.design)
      } catch (e) {
        console.error(e)
        router.push('/portfolio')
      } finally {
        setLoading(false)
      }
    }
    fetchDesign()
  }, [id, router])

  if (loading || !design) {
    return (
      <main className="pt-16 min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-12 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">正在加载作品详情...</p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="pt-16 min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4" />
            返回
          </button>
          <button
            onClick={() => router.push(`/workspace?designId=${design.id}`)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            <Pencil className="w-4 h-4" />
            在工作台中编辑
          </button>
        </div>

        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/20">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1 flex items-center justify-center">
              <div className="w-full max-w-md h-[380px] flex items-center justify-center bg-gray-50 rounded-2xl">
                <BraceletPreview
                  items={design.items || []}
                  onRemoveItem={() => {}}
                  onReorderItems={() => {}}
                  wristSize={design.wristSize}
                  wearingStyle={design.wearingStyle}
                  size={320}
                  hideTips
                />
              </div>
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  {design.name}
                </h1>
                <p className="text-sm text-gray-500">
                  创建于 {new Date(design.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">总价格</span>
                  <span className="text-2xl font-bold text-blue-600">
                    ¥{design.totalPrice}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                  {design.averageDiameter && (
                    <span>平均直径约 {design.averageDiameter.toFixed(1)} mm</span>
                  )}
                  {design.totalWeight && design.totalWeight > 0 && (
                    <span>总重量约 {design.totalWeight.toFixed(2)} g</span>
                  )}
                  {design.wristSize && (
                    <span>
                      手围 {design.wristSize}cm（
                      {design.wearingStyle === 'double' ? '双圈' : '单圈'}）
                    </span>
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-sm font-semibold text-gray-700 mb-2">
                  材料明细
                </h2>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {design.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: item.color || '#8b4513' }}
                        />
                        <span className="text-sm text-gray-800">
                          {item.name}
                        </span>
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        {item.diameter && <div>{item.diameter} mm</div>}
                        {item.weight && <div>{item.weight} g</div>}
                        <div className="text-gray-800 font-medium">
                          ¥{item.price}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

