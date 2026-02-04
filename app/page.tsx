'use client'

import Link from 'next/link'
import { Palette } from 'lucide-react'

export default function Home() {
  return (
    <main className="pt-16 min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* 设计功能入口 */}
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Link
            href="/workspace"
            className="group flex flex-col items-center space-y-4 p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2 border-transparent hover:border-blue-200"
          >
            {/* 图标 */}
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
              <Palette size={40} className="text-white" />
            </div>
            
            {/* 标题 */}
            <h2 className="text-3xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
              设计
            </h2>
            
            {/* 小标题提示 */}
            <p className="text-gray-500 text-lg group-hover:text-gray-700 transition-colors">
              定制你的专属手串
            </p>
          </Link>
        </div>
      </div>
    </main>
  )
}
