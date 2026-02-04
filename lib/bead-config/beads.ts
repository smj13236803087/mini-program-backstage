import {
  BeadCategoryConfig,
  AccessoryCategoryConfig,
  PendantConfig,
  BeadCategory,
  AccessoryCategory,
} from '@/types/bracelet'

// 珠子配置（层级结构：大类 -> 子类型 -> 尺寸）
export const beadCategoryConfigs: BeadCategoryConfig[] = [
  {
    category: 'obsidian',
    name: '曜石',
    subTypes: [
      {
        name: '冰曜石',
        color: '#1a1a2e',
        description: '冰曜石，具有保护能量',
        sizes: [
          { size: 6, price: 5 },
          { size: 8, price: 8 },
          { size: 10, price: 12 },
        ],
      },
      {
        name: '银曜石',
        color: '#2c3e50',
        description: '银曜石，带来稳定能量',
        sizes: [
          { size: 6, price: 6 },
          { size: 8, price: 9 },
          { size: 10, price: 14 },
        ],
      },
      {
        name: '金曜石',
        color: '#34495e',
        description: '金曜石，增强财运',
        sizes: [
          { size: 6, price: 7 },
          { size: 8, price: 10 },
          { size: 10, price: 15 },
        ],
      },
    ],
  },
  {
    category: 'amethyst',
    name: '紫水晶',
    subTypes: [
      {
        name: '深紫水晶',
        color: '#6a1b9a',
        description: '深紫色水晶，提升灵性',
        sizes: [
          { size: 6, price: 8 },
          { size: 8, price: 12 },
          { size: 10, price: 18 },
        ],
      },
      {
        name: '浅紫水晶',
        color: '#ba68c8',
        description: '浅紫色水晶，温和能量',
        sizes: [
          { size: 6, price: 7 },
          { size: 8, price: 10 },
          { size: 10, price: 15 },
        ],
      },
      {
        name: '紫黄晶',
        color: '#9b59b6',
        description: '紫黄晶，平衡能量',
        sizes: [
          { size: 6, price: 10 },
          { size: 8, price: 15 },
          { size: 10, price: 22 },
        ],
      },
    ],
  },
  {
    category: 'moonstone',
    name: '月光',
    subTypes: [
      {
        name: '白月光',
        color: '#f0f8ff',
        description: '白月光石，带来温柔能量',
        sizes: [
          { size: 6, price: 10 },
          { size: 8, price: 15 },
          { size: 10, price: 20 },
        ],
      },
      {
        name: '蓝月光',
        color: '#e6f3ff',
        description: '蓝月光石，增强直觉',
        sizes: [
          { size: 6, price: 12 },
          { size: 8, price: 18 },
          { size: 10, price: 25 },
        ],
      },
      {
        name: '彩虹月光',
        color: '#f5f5dc',
        description: '彩虹月光石，多彩能量',
        sizes: [
          { size: 6, price: 15 },
          { size: 8, price: 22 },
          { size: 10, price: 30 },
        ],
      },
    ],
  },
]

// 配饰配置（层级结构：大类 -> 子类型 -> 尺寸）
export const accessoryCategoryConfigs: AccessoryCategoryConfig[] = [
  {
    category: 'spacer',
    name: '隔断',
    subTypes: [
      {
        name: '金片隔珠',
        color: '#ffd700',
        description: '金色片状隔珠',
        sizes: [
          { size: 4, price: 3 },
          { size: 6, price: 5 },
          { size: 8, price: 8 },
        ],
      },
      {
        name: '双银花',
        color: '#c0c0c0',
        description: '银色双花隔珠',
        sizes: [
          { size: 4, price: 4 },
          { size: 6, price: 6 },
          { size: 8, price: 10 },
        ],
      },
      {
        name: '单银花',
        color: '#e8e8e8',
        description: '银色单花隔珠',
        sizes: [
          { size: 4, price: 2 },
          { size: 6, price: 4 },
          { size: 8, price: 7 },
        ],
      },
    ],
  },
  {
    category: 'decoration',
    name: '装饰',
    subTypes: [
      {
        name: '金珠装饰',
        color: '#ffd700',
        description: '金色装饰珠',
        sizes: [
          { size: 6, price: 5 },
          { size: 8, price: 8 },
          { size: 10, price: 12 },
        ],
      },
      {
        name: '银珠装饰',
        color: '#c0c0c0',
        description: '银色装饰珠',
        sizes: [
          { size: 6, price: 4 },
          { size: 8, price: 7 },
          { size: 10, price: 10 },
        ],
      },
      {
        name: '铜珠装饰',
        color: '#b87333',
        description: '铜色装饰珠',
        sizes: [
          { size: 6, price: 3 },
          { size: 8, price: 5 },
          { size: 10, price: 8 },
        ],
      },
    ],
  },
  {
    category: 'doubleTerminated',
    name: '双尖水晶',
    subTypes: [
      {
        name: '白双尖',
        color: '#f0f0f0',
        description: '白色双尖水晶',
        sizes: [
          { size: 6, price: 12 },
          { size: 8, price: 18 },
          { size: 10, price: 25 },
        ],
      },
      {
        name: '紫双尖',
        color: '#9b59b6',
        description: '紫色双尖水晶',
        sizes: [
          { size: 6, price: 15 },
          { size: 8, price: 22 },
          { size: 10, price: 30 },
        ],
      },
      {
        name: '粉双尖',
        color: '#ffb6c1',
        description: '粉色双尖水晶',
        sizes: [
          { size: 6, price: 14 },
          { size: 8, price: 20 },
          { size: 10, price: 28 },
        ],
      },
    ],
  },
]

// 吊坠配置
export const pendantConfig: PendantConfig = {
  type: 'pendant',
  name: '吊坠',
  price: 20,
  color: '#8b4513',
  description: '精美吊坠',
}

// 根据大类获取配置
export function getBeadCategoryConfig(
  category: BeadCategory
): BeadCategoryConfig | undefined {
  return beadCategoryConfigs.find((config) => config.category === category)
}

// 根据大类获取配饰配置
export function getAccessoryCategoryConfig(
  category: AccessoryCategory
): AccessoryCategoryConfig | undefined {
  return accessoryCategoryConfigs.find((config) => config.category === category)
}
