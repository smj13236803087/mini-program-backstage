import { BraceletItem } from '@/types/bracelet'

// 计算手串总价
export function calculateTotalPrice(items: BraceletItem[]): number {
  return items.reduce((total, item) => total + item.price, 0)
}

// 生成唯一ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}
