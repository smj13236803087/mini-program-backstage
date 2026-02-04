'use client'

import { BraceletItem } from '@/types/bracelet'
import { ShoppingCart } from 'lucide-react'

interface PriceDisplayProps {
  items: BraceletItem[]
  totalPrice: number
  onAddToCart: () => void
}

export default function PriceDisplay({
  items,
  totalPrice,
  onAddToCart,
}: PriceDisplayProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
      <h3 className="text-xl font-bold text-gray-800">价格明细</h3>
      
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-2 bg-gray-50 rounded"
          >
            <div className="flex items-center space-x-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{
                  backgroundColor: item.color || '#8b4513',
                }}
              />
              <span className="text-sm text-gray-700">{item.name}</span>
            </div>
            <span className="text-sm font-medium text-gray-800">¥{item.price}</span>
          </div>
        ))}
      </div>

      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-lg font-bold text-gray-800">总计</span>
          <span className="text-2xl font-bold text-blue-600">¥{totalPrice}</span>
        </div>

        <button
          onClick={onAddToCart}
          disabled={items.length === 0}
          className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
        >
          <ShoppingCart size={20} />
          <span>加入购物车</span>
        </button>
      </div>
    </div>
  )
}

