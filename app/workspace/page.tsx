'use client'

import { useState, useMemo, useEffect } from 'react'
import { BraceletItem, BeadCategory, AccessoryCategory } from '@/types/bracelet'
import { calculateTotalPrice, generateId } from '@/lib/pricing/calculator'
import ConfigPanel from '@/components/workspace/ConfigPanel'
import BraceletPreview from '@/components/workspace/BraceletPreview'
import PriceDisplay from '@/components/workspace/PriceDisplay'
import WristSizeModal, { WearingStyle } from '@/components/workspace/WristSizeModal'

export default function Workspace() {
  const [items, setItems] = useState<BraceletItem[]>([])
  const [showWristSizeModal, setShowWristSizeModal] = useState(true)
  const [wristSize, setWristSize] = useState<number | null>(null)
  const [wearingStyle, setWearingStyle] = useState<WearingStyle | null>(null)

  // 计算总价
  const totalPrice = useMemo(() => calculateTotalPrice(items), [items])

  // 检查是否超过手围限制
  const checkWristSizeLimit = (newDiameter: number): boolean => {
    if (!wristSize || !wearingStyle) return true // 如果未设置手围，允许添加
    
    const maxCircumference = wearingStyle === 'single' ? wristSize * 1.1 : wristSize * 2.2
    const defaultDiameter = 8
    const currentTotalDiameterMm = items.reduce((sum, item) => {
      return sum + (item.diameter || defaultDiameter)
    }, 0)
    const newTotalDiameterMm = currentTotalDiameterMm + (newDiameter || defaultDiameter)
    const newCircumference = newTotalDiameterMm / 10 // 毫米转厘米
    
    return newCircumference <= maxCircumference
  }

  // 添加珠子
  const handleAddBead = (
    category: BeadCategory,
    subType: string,
    name: string,
    price: number,
    color: string,
    image?: string,
    diameter?: number,
    weight?: number
  ) => {
    if (!checkWristSizeLimit(diameter || 8)) {
      alert(`已达到设定手围！无法添加更多珠子。`)
      return
    }
    
    const newItem: BraceletItem = {
      id: generateId(),
      type: 'bead',
      beadCategory: category,
      beadSubType: subType,
      name: name,
      price: price,
      color: color,
      image: image,
      diameter: diameter,
      weight: weight,
    }
    setItems([...items, newItem])
  }

  // 添加配饰
  const handleAddAccessory = (
    category: AccessoryCategory,
    subType: string,
    name: string,
    price: number,
    color: string,
    image?: string,
    diameter?: number,
    weight?: number
  ) => {
    if (!checkWristSizeLimit(diameter || 8)) {
      alert(`已达到设定手围！无法添加更多配饰。`)
      return
    }
    
    const newItem: BraceletItem = {
      id: generateId(),
      type: 'accessory',
      accessoryCategory: category,
      accessorySubType: subType,
      name: name,
      price: price,
      color: color,
      image: image,
      diameter: diameter,
      weight: weight,
    }
    setItems([...items, newItem])
  }

  // 添加吊坠
  const handleAddPendant = (
    name: string,
    price: number,
    color: string,
    image?: string,
    diameter?: number,
    weight?: number
  ) => {
    if (!checkWristSizeLimit(diameter || 8)) {
      alert(`已达到设定手围！无法添加更多吊坠。`)
      return
    }
    
    const newItem: BraceletItem = {
      id: generateId(),
      type: 'pendant',
      pendantType: 'pendant',
      name: name,
      price: price,
      color: color,
      image: image,
      diameter: diameter,
      weight: weight,
    }
    setItems([...items, newItem])
  }

  // 删除项目
  const handleRemoveItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id))
  }

  // 重新排序
  const handleReorderItems = (newItems: BraceletItem[]) => {
    setItems(newItems)
  }

  // 加入购物车
  const handleAddToCart = () => {
    // TODO: 实现购物车功能
    console.log('加入购物车:', items)
    alert('已加入购物车！')
  }

  // 完成手腕尺寸设置
  const handleWristSizeComplete = (size: number, style: WearingStyle) => {
    setWristSize(size)
    setWearingStyle(style)
    setShowWristSizeModal(false)
  }

  return (
    <main className="pt-16 min-h-screen bg-gray-50">
      <WristSizeModal
        isOpen={showWristSizeModal}
        onComplete={handleWristSizeComplete}
      />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">工作台</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 左侧：配置面板 */}
          <div className="lg:col-span-4">
            <ConfigPanel
              onAddBead={handleAddBead}
              onAddAccessory={handleAddAccessory}
              onAddPendant={handleAddPendant}
            />
          </div>

          {/* 中间：手串预览 */}
          <div className="lg:col-span-5">
            <BraceletPreview
              items={items}
              onRemoveItem={handleRemoveItem}
              onReorderItems={handleReorderItems}
              wristSize={wristSize}
              wearingStyle={wearingStyle}
            />
          </div>

          {/* 右侧：价格显示 */}
          <div className="lg:col-span-3">
            <PriceDisplay
              items={items}
              totalPrice={totalPrice}
              onAddToCart={handleAddToCart}
              wristSize={wristSize}
              wearingStyle={wearingStyle}
            />
          </div>
        </div>
      </div>
    </main>
  )
}
