'use client'

import { BraceletItem } from '@/types/bracelet'
import { useState, useRef, useEffect } from 'react'

interface BraceletPreviewProps {
  items: BraceletItem[]
  onRemoveItem: (id: string) => void
  onReorderItems: (newItems: BraceletItem[]) => void
}

interface ContextMenu {
  x: number
  y: number
  itemId: string
}

export default function BraceletPreview({
  items,
  onRemoveItem,
  onReorderItems,
}: BraceletPreviewProps) {
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const itemsRef = useRef<BraceletItem[]>(items)

  // 同步 items 到 ref
  useEffect(() => {
    itemsRef.current = items
  }, [items])

  const centerX = 200
  const centerY = 200
  const radius = 120
  const beadRadius = 16 // 珠子半径（像素）
  
  // 计算两个珠子紧贴时的角度间隔
  const angleStep = 2 * Math.asin(beadRadius / radius)

  // 根据角度计算应该插入的位置
  const getInsertIndex = (angle: number, currentItems: BraceletItem[]): number => {
    // 将角度标准化到 [0, 2π)
    let normalizedAngle = angle % (2 * Math.PI)
    if (normalizedAngle < 0) normalizedAngle += 2 * Math.PI

    // 如果数组为空，返回0
    if (currentItems.length === 0) return 0

    // 找到最接近的位置
    let minDiff = Infinity
    let bestIndex = currentItems.length

    for (let i = 0; i < currentItems.length; i++) {
      const targetAngle = angleStep * i
      let diff = Math.abs(normalizedAngle - targetAngle)
      
      // 处理角度循环（0度和2π度是同一个位置）
      if (diff > Math.PI) {
        diff = 2 * Math.PI - diff
      }
      
      if (diff < minDiff) {
        minDiff = diff
        // 如果鼠标在目标位置之前，插入到该位置；否则插入到下一个位置
        if (normalizedAngle < targetAngle + angleStep / 2) {
          bestIndex = i
        } else {
          bestIndex = i + 1
        }
      }
    }

    // 也检查插入到末尾的情况
    const lastAngle = angleStep * (currentItems.length - 1)
    let lastDiff = Math.abs(normalizedAngle - lastAngle)
    if (lastDiff > Math.PI) {
      lastDiff = 2 * Math.PI - lastDiff
    }
    
    if (normalizedAngle > lastAngle + angleStep / 2) {
      bestIndex = currentItems.length
    }

    return Math.max(0, Math.min(bestIndex, currentItems.length))
  }

  // 处理拖拽开始
  const handleMouseDown = (e: React.MouseEvent, itemId: string, index: number) => {
    e.preventDefault()
    if (e.button !== 0) return // 只处理左键

    const item = items.find((it) => it.id === itemId)
    if (!item) return

    const angle = angleStep * index
    const x = centerX + radius * Math.cos(angle)
    const y = centerY + radius * Math.sin(angle)

    setDraggedItemId(itemId)
    setDragOffset({
      x: e.clientX - x,
      y: e.clientY - y,
    })
  }

  // 处理拖拽移动
  useEffect(() => {
    if (!draggedItemId || !dragOffset || !svgRef.current) return

    let lastTargetIndex = -1

    const handleMouseMove = (e: MouseEvent) => {
      if (!svgRef.current) return

      const rect = svgRef.current.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      // 计算鼠标相对于圆心的角度
      let angle = Math.atan2(mouseY - centerY, mouseX - centerX)
      // 标准化角度到 [0, 2π)
      if (angle < 0) angle += 2 * Math.PI

      // 使用 ref 获取最新的 items
      const currentItems = itemsRef.current

      // 找到应该插入的位置
      const targetIndex = getInsertIndex(angle, currentItems)

      // 如果位置改变了，更新顺序
      if (targetIndex !== lastTargetIndex && targetIndex >= 0) {
        lastTargetIndex = targetIndex

        // 找到当前拖拽项的索引
        const currentIndex = currentItems.findIndex((it) => it.id === draggedItemId)
        if (currentIndex === -1) return

        // 如果目标位置和当前位置相同，不需要移动
        if (targetIndex === currentIndex) return

        const newItems = [...currentItems]
        const [movedItem] = newItems.splice(currentIndex, 1)
        
        // 计算正确的插入位置
        let insertIndex = targetIndex
        if (targetIndex > currentIndex) {
          insertIndex = targetIndex - 1
        }
        insertIndex = Math.max(0, Math.min(insertIndex, newItems.length))
        
        newItems.splice(insertIndex, 0, movedItem)
        onReorderItems(newItems)
      }
    }

    const handleMouseUp = () => {
      setDraggedItemId(null)
      setDragOffset(null)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [draggedItemId, dragOffset, onReorderItems])

  // 处理右键菜单
  const handleContextMenu = (e: React.MouseEvent, itemId: string) => {
    e.preventDefault()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      itemId,
    })
  }

  // 关闭右键菜单
  useEffect(() => {
    const handleClick = () => {
      setContextMenu(null)
    }

    if (contextMenu) {
      window.addEventListener('click', handleClick)
      return () => {
        window.removeEventListener('click', handleClick)
      }
    }
  }, [contextMenu])

  // 处理删除
  const handleDelete = (itemId: string) => {
    onRemoveItem(itemId)
    setContextMenu(null)
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-8 flex items-center justify-center relative">
      {items.length === 0 ? (
        <div className="text-center text-gray-400 py-20">
          <p className="text-lg">从左侧选择珠子开始设计</p>
        </div>
      ) : (
        <>
          <div className="relative">
            <svg
              ref={svgRef}
              width="400"
              height="400"
              className="overflow-visible"
            >
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
              
              {/* 渲染珠子 - 从右侧（0度）开始，顺时针紧贴排列 */}
              {items.map((item, index) => {
                const angle = angleStep * index
                const x = centerX + radius * Math.cos(angle)
                const y = centerY + radius * Math.sin(angle)
                const itemColor = item.color || '#8b4513'
                const isDragging = draggedItemId === item.id

                return (
                  <g key={item.id}>
                    {/* 珠子 */}
                    <circle
                      cx={x}
                      cy={y}
                      r={16}
                      fill={itemColor}
                      stroke="#fff"
                      strokeWidth={2}
                      className={`transition-all cursor-move ${
                        isDragging ? 'opacity-50' : ''
                      }`}
                      style={{
                        filter: isDragging
                          ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
                          : 'none',
                      }}
                      onMouseDown={(e) => handleMouseDown(e, item.id, index)}
                      onContextMenu={(e) => handleContextMenu(e, item.id)}
                    />
                  </g>
                )
              })}
            </svg>
          </div>

          {/* 右键菜单 */}
          {contextMenu && (
            <div
              className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50"
              style={{
                left: `${contextMenu.x}px`,
                top: `${contextMenu.y}px`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                onClick={() => handleDelete(contextMenu.itemId)}
              >
                删除
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
