'use client'

import { BraceletItem } from '@/types/bracelet'
import { useState, useRef, useEffect, useMemo } from 'react'
import { WearingStyle } from './WristSizeModal'

interface BraceletPreviewProps {
  items: BraceletItem[]
  onRemoveItem: (id: string) => void
  onReorderItems: (newItems: BraceletItem[]) => void
  wristSize: number | null
  wearingStyle: WearingStyle | null
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
  wristSize,
  wearingStyle,
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
  const baseRadius = 120 // 基础半径
  
  // 默认直径（毫米），如果没有指定则使用8mm
  const defaultDiameter = 8
  
  // 将毫米转换为像素：1mm = 2.5px（基础比例）
  const mmToPx = 2.5
  
  // 基础缩放因子：开始时使用较大的珠子，确保能围满一圈
  const maxPreferredScale = 2.0
  const minPreferredScale = 0.25
  
  // 使用固定的基础半径，通过调整珠子大小来确保正好围成一圈
  const radius = baseRadius

  // 计算当前周长（厘米）：所有珠子直径之和（毫米）转换为厘米
  const currentCircumference = useMemo(() => {
    const totalDiameterMm = items.reduce((sum, item) => {
      return sum + (item.diameter || defaultDiameter)
    }, 0)
    return totalDiameterMm / 10 // 毫米转厘米
  }, [items])
  
  // 计算最大周长
  const maxCircumference = useMemo(() => {
    if (!wristSize || !wearingStyle) return null
    return wearingStyle === 'single' ? wristSize * 1.1 : wristSize * 2.2
  }, [wristSize, wearingStyle])
  
  // 是否达到设定手围（允许小的误差）
  const reachesLimit = useMemo(() => {
    if (!maxCircumference || items.length === 0) return false
    // 允许0.2cm的误差，确保在接近时就开始调整
    return currentCircumference >= maxCircumference * 0.95
  }, [currentCircumference, maxCircumference, items.length])
  
  // 计算珠子大小的缩放因子：尽量让珠子“正好一圈”，并保持顺序从最右侧开始顺时针紧贴
  const beadScale = useMemo(() => {
    if (items.length === 0) return maxPreferredScale

    const target = 2 * Math.PI

    const totalAngleForScale = (scale: number) => {
      let total = 0
      for (let i = 0; i < items.length; i++) {
        const a = items[i]
        const b = items[(i + 1) % items.length]
        const d1 = a.diameter ?? defaultDiameter
        const d2 = b.diameter ?? defaultDiameter
        const r1 = (d1 / 2) * mmToPx * scale
        const r2 = (d2 / 2) * mmToPx * scale
        const combined = r1 + r2
        const safeRatio = Math.min(combined / (2 * radius), 0.999)
        total += 2 * Math.asin(safeRatio)
      }
      return total
    }

    // 希望“尽量大”，所以从最大开始往下找一个能闭合的
    const maxScale = maxPreferredScale
    const minScale = minPreferredScale

    const totalAtMax = totalAngleForScale(maxScale)
    if (Math.abs(totalAtMax - target) < 1e-4) return maxScale
    if (totalAtMax < target) {
      // 已经最大也填不满（珠子太少），返回最大，保持从右侧顺时针紧贴，留一个缺口是不可避免的
      return maxScale
    }

    const totalAtMin = totalAngleForScale(minScale)
    if (totalAtMin > target) {
      // 即使很小也超过一圈（极端情况），夹到最小
      return minScale
    }

    // 二分查找：找到 totalAngle(scale) ~= 2π 的 scale（优先更大，所以收敛到上界附近）
    let lo = minScale
    let hi = maxScale
    let best = minScale
    for (let iter = 0; iter < 50; iter++) {
      const mid = (lo + hi) / 2
      const t = totalAngleForScale(mid)
      if (Math.abs(t - target) < 1e-4) {
        best = mid
        break
      }
      if (t > target) {
        // 角度太大，scale 太大，减小
        hi = mid
      } else {
        // 角度太小，scale 太小，增大
        lo = mid
        best = mid
      }
      if (hi - lo < 1e-4) break
    }

    return best
  }, [items, defaultDiameter, mmToPx, radius, maxPreferredScale, minPreferredScale])
  
  // 计算每个珠子的半径（像素），应用缩放因子
  const getBeadRadius = (diameter: number | undefined): number => {
    const diameterMm = diameter || defaultDiameter
    return (diameterMm / 2) * mmToPx * beadScale
  }
  
  // 是否超过设定手围
  const exceedsLimit = maxCircumference !== null && currentCircumference > maxCircumference
  
  // 计算所有珠子的角度间隔（始终按顺序紧贴；不再强行“角度拉伸”到 2π，以保持顺时针顺序感）
  const angleSteps = useMemo(() => {
    if (items.length === 0) return []
    
    const steps: number[] = []
    for (let i = 0; i < items.length; i++) {
      const currentItem = items[i]
      const nextItem = items[(i + 1) % items.length] // 最后一个和第一个连接
      
      const radius1 = getBeadRadius(currentItem.diameter)
      const radius2 = getBeadRadius(nextItem.diameter)
      const combinedRadius = radius1 + radius2
      const safeRatio = Math.min(combinedRadius / (2 * radius), 0.999)
      const angleStep = 2 * Math.asin(safeRatio)
      steps.push(angleStep)
    }
    return steps
  }, [items, radius, beadScale])
  
  // 计算每个珠子的角度位置（基于累计角度间隔）
  const getItemAngle = (index: number): number => {
    if (index === 0) return 0
    
    let cumulativeAngle = 0
    for (let i = 0; i < index; i++) {
      cumulativeAngle += angleSteps[i]
    }
    return cumulativeAngle
  }
  
  // 计算两个珠子紧贴时的角度间隔（用于插入位置计算）
  const getAngleStep = (item1: BraceletItem, item2: BraceletItem, currentRadius: number): number => {
    const radius1 = getBeadRadius(item1.diameter)
    const radius2 = getBeadRadius(item2.diameter)
    const combinedRadius = radius1 + radius2
    // 确保参数在有效范围内
    const safeRatio = Math.min(combinedRadius / (2 * currentRadius), 0.999)
    return 2 * Math.asin(safeRatio)
  }

  // 根据角度计算应该插入的位置
  const getInsertIndex = (angle: number, currentItems: BraceletItem[]): number => {
    // 将角度标准化到 [0, 2π)
    let normalizedAngle = angle % (2 * Math.PI)
    if (normalizedAngle < 0) normalizedAngle += 2 * Math.PI

    // 如果数组为空，返回0
    if (currentItems.length === 0) return 0

    // 计算每个位置的累计角度
    const angles: number[] = [0]
    for (let i = 0; i < currentItems.length - 1; i++) {
      const angleStep = getAngleStep(currentItems[i], currentItems[i + 1], radius)
      angles.push(angles[i] + angleStep)
    }

    // 找到最接近的位置
    let minDiff = Infinity
    let bestIndex = currentItems.length

    for (let i = 0; i < angles.length; i++) {
      const targetAngle = angles[i]
      let diff = Math.abs(normalizedAngle - targetAngle)
      
      // 处理角度循环（0度和2π度是同一个位置）
      if (diff > Math.PI) {
        diff = 2 * Math.PI - diff
      }
      
      if (diff < minDiff) {
        minDiff = diff
        // 如果鼠标在目标位置之前，插入到该位置；否则插入到下一个位置
        if (i < angles.length - 1) {
          const nextAngle = angles[i + 1]
          if (normalizedAngle < (targetAngle + nextAngle) / 2) {
            bestIndex = i
          } else {
            bestIndex = i + 1
          }
        } else {
          // 最后一个位置，使用默认角度间隔估算
          const lastItem = currentItems[currentItems.length - 1]
          const defaultRadius = getBeadRadius(lastItem.diameter)
          const estimatedAngleStep = 2 * Math.asin((defaultRadius * 2) / (2 * radius))
          if (normalizedAngle < targetAngle + estimatedAngleStep / 2) {
            bestIndex = i
          } else {
            bestIndex = i + 1
          }
        }
      }
    }

    // 也检查插入到末尾的情况
    const lastAngle = angles[angles.length - 1]
    let lastDiff = Math.abs(normalizedAngle - lastAngle)
    if (lastDiff > Math.PI) {
      lastDiff = 2 * Math.PI - lastDiff
    }
    
    if (normalizedAngle > lastAngle) {
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

    const angle = getItemAngle(index)
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
    <div className="bg-white rounded-lg shadow-md p-8 flex flex-col items-center justify-center relative">
      {exceedsLimit && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          已达到设定手围！当前周长：{currentCircumference.toFixed(1)}cm，最大周长：{maxCircumference?.toFixed(1)}cm
        </div>
      )}
      {reachesLimit && !exceedsLimit && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          已完美匹配设定手围！手串已自动调整为完美圆形
        </div>
      )}
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
                const angle = getItemAngle(index)
              const x = centerX + radius * Math.cos(angle)
              const y = centerY + radius * Math.sin(angle)
              const itemColor = item.color || '#8b4513'
                const isDragging = draggedItemId === item.id
              const beadRadius = getBeadRadius(item.diameter)

              return (
                  <g key={item.id}>
                  {/* 珠子 */}
                  <circle
                    cx={x}
                    cy={y}
                      r={beadRadius}
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
