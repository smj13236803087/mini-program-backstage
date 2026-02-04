'use client'

import { BraceletItem } from '@/types/bracelet'
import { X, ArrowUp, ArrowDown } from 'lucide-react'
import { useState } from 'react'

interface BraceletPreviewProps {
  items: BraceletItem[]
  onRemoveItem: (id: string) => void
  onReorderItems: (newItems: BraceletItem[]) => void
}

export default function BraceletPreview({
  items,
  onRemoveItem,
  onReorderItems,
}: BraceletPreviewProps) {
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null)

  const centerX = 200
  const centerY = 200
  const radius = 120

  // 移动项目位置（向上或向下）
  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === items.length - 1)
    ) {
      return
    }

    const newItems = [...items]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    ;[newItems[index], newItems[targetIndex]] = [
      newItems[targetIndex],
      newItems[index],
    ]
    onReorderItems(newItems)
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-8 flex items-center justify-center">
      {items.length === 0 ? (
        <div className="text-center text-gray-400 py-20">
          <p className="text-lg">从左侧选择珠子开始设计</p>
        </div>
      ) : (
        <div className="relative">
          <svg width="400" height="400" className="overflow-visible">
            {/* 手串圆形路径 */}
            <circle
              cx={centerX}
              cy={centerY}
              r={radius}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
            
            {/* 渲染珠子 */}
            {items.map((item, index) => {
              const angle = (2 * Math.PI / items.length) * index - Math.PI / 2
              const x = centerX + radius * Math.cos(angle)
              const y = centerY + radius * Math.sin(angle)
              
              const isHovered = hoveredItemId === item.id
              const itemColor = item.color || '#8b4513'

              return (
                <g
                  key={item.id}
                  onMouseEnter={() => setHoveredItemId(item.id)}
                  onMouseLeave={() => setHoveredItemId(null)}
                >
                  {/* 珠子 */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered ? 18 : 16}
                    fill={itemColor}
                    stroke="#fff"
                    strokeWidth={isHovered ? 3 : 2}
                    className="transition-all cursor-pointer"
                    style={{
                      filter: isHovered ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' : 'none',
                    }}
                  />
                  
                  {/* 悬停时显示控制按钮 */}
                  {isHovered && (
                    <>
                      {/* 删除按钮 */}
                      <foreignObject
                        x={x + 22}
                        y={y - 22}
                        width="24"
                        height="24"
                        className="cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation()
                          onRemoveItem(item.id)
                        }}
                      >
                        <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors">
                          <X size={14} color="white" />
                        </div>
                      </foreignObject>

                      {/* 上移按钮 */}
                      {index > 0 && (
                        <foreignObject
                          x={x - 12}
                          y={y - 32}
                          width="24"
                          height="24"
                          className="cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleMoveItem(index, 'up')
                          }}
                        >
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
                            <ArrowUp size={14} color="white" />
                          </div>
                        </foreignObject>
                      )}

                      {/* 下移按钮 */}
                      {index < items.length - 1 && (
                        <foreignObject
                          x={x - 12}
                          y={y + 8}
                          width="24"
                          height="24"
                          className="cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleMoveItem(index, 'down')
                          }}
                        >
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
                            <ArrowDown size={14} color="white" />
                          </div>
                        </foreignObject>
                      )}
                    </>
                  )}
                </g>
              )
            })}
          </svg>
        </div>
      )}
    </div>
  )
}

