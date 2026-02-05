'use client'

import { useState, useMemo } from 'react'
import { BraceletItem, BeadCategory, AccessoryCategory } from '@/types/bracelet'
import { calculateTotalPrice, generateId } from '@/lib/pricing/calculator'
import ConfigPanel from '@/components/workspace/ConfigPanel'
import BraceletPreview from '@/components/workspace/BraceletPreview'
import PriceDisplay from '@/components/workspace/PriceDisplay'

export default function Workspace() {
  const [items, setItems] = useState<BraceletItem[]>([])

  // 计算总价
  const totalPrice = useMemo(() => calculateTotalPrice(items), [items])

  // 添加珠子
  const handleAddBead = (
    category: BeadCategory,
    subType: string,
    name: string,
    price: number,
    color: string,
    image?: string
  ) => {
    const newItem: BraceletItem = {
      id: generateId(),
      type: 'bead',
      beadCategory: category,
      beadSubType: subType,
      name: name,
      price: price,
      color: color,
      image: image,
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
    image?: string
  ) => {
    const newItem: BraceletItem = {
      id: generateId(),
      type: 'accessory',
      accessoryCategory: category,
      accessorySubType: subType,
      name: name,
      price: price,
      color: color,
      image: image,
    }
    setItems([...items, newItem])
  }

  // 添加吊坠
  const handleAddPendant = (
    name: string,
    price: number,
    color: string,
    image?: string
  ) => {
    const newItem: BraceletItem = {
      id: generateId(),
      type: 'pendant',
      pendantType: 'pendant',
      name: name,
      price: price,
      color: color,
      image: image,
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

  return (
    <main className="pt-16 min-h-screen bg-gray-50">
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
            />
          </div>

          {/* 右侧：价格显示 */}
          <div className="lg:col-span-3">
            <PriceDisplay
              items={items}
              totalPrice={totalPrice}
              onAddToCart={handleAddToCart}
            />
          </div>
        </div>
      </div>
    </main>
  )
}
