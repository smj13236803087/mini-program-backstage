const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding Product table...')

  // 清空旧数据（仅开发环境使用）
  await prisma.product.deleteMany()

  // 统一占位图，真实颜色/元数据从 images[0].meta 里读
  const placeholderSrc = 'https://example.com/placeholder.png'

  /** @type {import('@prisma/client').Prisma.ProductCreateManyInput[]} */
  const products = [
    // 主引流石（main）系列
    {
      title: '曜石 8mm 主引流石',
      productType: 'main_obsidian_8',
      imageUrl: null,
      images: [
        {
          src: placeholderSrc,
          meta: {
            category: 'main',
            size: '8mm',
            color: '#111827',
            energy: { protection: 3, calm: 1 },
            energyTag: { emoji: '🛡️', label: '能量结界' },
          },
        },
      ],
      price: '199.00',
      stock: 999,
      energy_tags: ['保护', '稳固'],
      diameter: '8mm',
      weight: '1.65g',
    },
    {
      title: '紫水晶 8mm 主引流石',
      productType: 'main_amethyst_8',
      imageUrl: null,
      images: [
        {
          src: placeholderSrc,
          meta: {
            category: 'main',
            size: '8mm',
            color: '#8b5cf6',
            energy: { wisdom: 3, calm: 2 },
            energyTag: { emoji: '🧠', label: '智慧开悟' },
          },
        },
      ],
      price: '259.00',
      stock: 999,
      energy_tags: ['智慧', '安神'],
      diameter: '8mm',
      weight: '1.80g',
    },
    {
      title: '月光石 8mm 主引流石',
      productType: 'main_moonstone_8',
      imageUrl: null,
      images: [
        {
          src: placeholderSrc,
          meta: {
            category: 'main',
            size: '8mm',
            color: '#e5e7eb',
            energy: { love: 2, calm: 3 },
            energyTag: { emoji: '💖', label: '情感疗愈' },
          },
        },
      ],
      price: '289.00',
      stock: 999,
      energy_tags: ['情绪', '疗愈'],
      diameter: '8mm',
      weight: '1.70g',
    },
    {
      title: '黄水晶 8mm 主引流石',
      productType: 'main_citrine_8',
      imageUrl: null,
      images: [
        {
          src: placeholderSrc,
          meta: {
            category: 'main',
            size: '8mm',
            color: '#fbbf24',
            energy: { wealth: 3, vitality: 1 },
            energyTag: { emoji: '💰', label: '财富显化' },
          },
        },
      ],
      price: '279.00',
      stock: 999,
      energy_tags: ['财富', '自信'],
      diameter: '8mm',
      weight: '1.75g',
    },
    {
      title: '青金石 8mm 主引流石',
      productType: 'main_lapis_8',
      imageUrl: null,
      images: [
        {
          src: placeholderSrc,
          meta: {
            category: 'main',
            size: '8mm',
            color: '#1d4ed8',
            energy: { wisdom: 2, protection: 2 },
            energyTag: { emoji: '🌊', label: '极效净心' },
          },
        },
      ],
      price: '269.00',
      stock: 999,
      energy_tags: ['净化', '洞察'],
      diameter: '8mm',
      weight: '1.78g',
    },

    // 调和辅石（support）系列
    {
      title: '白水晶 6mm 调和辅石',
      productType: 'support_clear_6',
      imageUrl: null,
      images: [
        {
          src: placeholderSrc,
          meta: {
            category: 'support',
            size: '6mm',
            color: '#f9fafb',
            energy: { calm: 2, vitality: 1 },
            energyTag: { emoji: '✨', label: '能量放大' },
          },
        },
      ],
      price: '59.00',
      stock: 999,
      energy_tags: ['净化', '放大'],
      diameter: '6mm',
      weight: '0.80g',
    },
    {
      title: '粉晶 6mm 调和辅石',
      productType: 'support_rose_6',
      imageUrl: null,
      images: [
        {
          src: placeholderSrc,
          meta: {
            category: 'support',
            size: '6mm',
            color: '#f472b6',
            energy: { love: 3 },
            energyTag: { emoji: '💗', label: '自我接纳' },
          },
        },
      ],
      price: '69.00',
      stock: 999,
      energy_tags: ['爱', '疗愈'],
      diameter: '6mm',
      weight: '0.82g',
    },
    {
      title: '绿幽灵 6mm 调和辅石',
      productType: 'support_green_6',
      imageUrl: null,
      images: [
        {
          src: placeholderSrc,
          meta: {
            category: 'support',
            size: '6mm',
            color: '#16a34a',
            energy: { wealth: 2, vitality: 2 },
            energyTag: { emoji: '🌱', label: '成长扩展' },
          },
        },
      ],
      price: '89.00',
      stock: 999,
      energy_tags: ['事业', '成长'],
      diameter: '6mm',
      weight: '0.90g',
    },
    {
      title: '拉长石 6mm 调和辅石',
      productType: 'support_labradorite_6',
      imageUrl: null,
      images: [
        {
          src: placeholderSrc,
          meta: {
            category: 'support',
            size: '6mm',
            color: '#4b5563',
            energy: { protection: 2, wisdom: 1 },
            energyTag: { emoji: '🌌', label: '直觉守护' },
          },
        },
      ],
      price: '79.00',
      stock: 999,
      energy_tags: ['直觉', '守护'],
      diameter: '6mm',
      weight: '0.88g',
    },
    {
      title: '黄虎眼 6mm 调和辅石',
      productType: 'support_tigereye_6',
      imageUrl: null,
      images: [
        {
          src: placeholderSrc,
          meta: {
            category: 'support',
            size: '6mm',
            color: '#b45309',
            energy: { vitality: 3 },
            energyTag: { emoji: '🔥', label: '行动力' },
          },
        },
      ],
      price: '75.00',
      stock: 999,
      energy_tags: ['行动', '勇气'],
      diameter: '6mm',
      weight: '0.86g',
    },

    // 能量隔珠（spacer）系列
    {
      title: '金色 4mm 能量隔珠',
      productType: 'spacer_gold_4',
      imageUrl: null,
      images: [
        {
          src: placeholderSrc,
          meta: {
            category: 'spacer',
            size: '4mm',
            color: '#facc15',
            energy: { protection: 1 },
            energyTag: { emoji: '⚡', label: '能量隔离' },
          },
        },
      ],
      price: '29.00',
      stock: 999,
      energy_tags: ['辅助'],
      diameter: '4mm',
      weight: '0.30g',
    },
    {
      title: '银色 4mm 能量隔珠',
      productType: 'spacer_silver_4',
      imageUrl: null,
      images: [
        {
          src: placeholderSrc,
          meta: {
            category: 'spacer',
            size: '4mm',
            color: '#e5e7eb',
            energy: { calm: 1 },
            energyTag: { emoji: '💫', label: '频段过渡' },
          },
        },
      ],
      price: '29.00',
      stock: 999,
      energy_tags: ['辅助'],
      diameter: '4mm',
      weight: '0.30g',
    },
    {
      title: '玫瑰金 4mm 能量隔珠',
      productType: 'spacer_rosegold_4',
      imageUrl: null,
      images: [
        {
          src: placeholderSrc,
          meta: {
            category: 'spacer',
            size: '4mm',
            color: '#fb7185',
            energy: { love: 1 },
            energyTag: { emoji: '💓', label: '柔和过渡' },
          },
        },
      ],
      price: '32.00',
      stock: 999,
      energy_tags: ['辅助'],
      diameter: '4mm',
      weight: '0.32g',
    },
    {
      title: '黑钛 4mm 能量隔珠',
      productType: 'spacer_black_4',
      imageUrl: null,
      images: [
        {
          src: placeholderSrc,
          meta: {
            category: 'spacer',
            size: '4mm',
            color: '#020617',
            energy: { protection: 2 },
            energyTag: { emoji: '🪨', label: '稳固锚点' },
          },
        },
      ],
      price: '32.00',
      stock: 999,
      energy_tags: ['辅助'],
      diameter: '4mm',
      weight: '0.34g',
    },
    {
      title: '磨砂银 4mm 能量隔珠',
      productType: 'spacer_matte_silver_4',
      imageUrl: null,
      images: [
        {
          src: placeholderSrc,
          meta: {
            category: 'spacer',
            size: '4mm',
            color: '#9ca3af',
            energy: { calm: 1, protection: 1 },
            energyTag: { emoji: '🌫️', label: '柔雾护盾' },
          },
        },
      ],
      price: '31.00',
      stock: 999,
      energy_tags: ['辅助'],
      diameter: '4mm',
      weight: '0.33g',
    },

    // 灵性配饰（accessory）系列
    {
      title: '狐狸灵感吊坠',
      productType: 'accessory_fox',
      imageUrl: null,
      images: [
        {
          src: placeholderSrc,
          meta: {
            category: 'accessory',
            size: '12mm',
            color: '#f97316',
            energy: { love: 1, wealth: 1 },
            energyTag: { emoji: '🦊', label: '魅力守护' },
          },
        },
      ],
      price: '169.00',
      stock: 999,
      energy_tags: ['魅力', '守护'],
      diameter: '12mm',
      weight: '3.20g',
    },
    {
      title: '双尖水晶能量锥',
      productType: 'accessory_double_point',
      imageUrl: null,
      images: [
        {
          src: placeholderSrc,
          meta: {
            category: 'accessory',
            size: '10mm',
            color: '#e5e7eb',
            energy: { vitality: 2, calm: 1 },
            energyTag: { emoji: '⚡', label: '能量聚焦' },
          },
        },
      ],
      price: '129.00',
      stock: 999,
      energy_tags: ['能量', '聚焦'],
      diameter: '10mm',
      weight: '2.50g',
    },
    {
      title: '银色跑环挂件',
      productType: 'accessory_runner_silver',
      imageUrl: null,
      images: [
        {
          src: placeholderSrc,
          meta: {
            category: 'accessory',
            size: '8mm',
            color: '#d1d5db',
            energy: { vitality: 1 },
            energyTag: { emoji: '🏃‍♀️', label: '流动连接' },
          },
        },
      ],
      price: '59.00',
      stock: 999,
      energy_tags: ['连接', '辅助'],
      diameter: '8mm',
      weight: '1.20g',
    },
    {
      title: '星月坠饰',
      productType: 'accessory_moon_star',
      imageUrl: null,
      images: [
        {
          src: placeholderSrc,
          meta: {
            category: 'accessory',
            size: '11mm',
            color: '#38bdf8',
            energy: { wisdom: 1, calm: 2 },
            energyTag: { emoji: '🌙', label: '夜间守护' },
          },
        },
      ],
      price: '149.00',
      stock: 999,
      energy_tags: ['睡眠', '灵感'],
      diameter: '11mm',
      weight: '2.80g',
    },
    {
      title: '小铃铛挂件',
      productType: 'accessory_bell',
      imageUrl: null,
      images: [
        {
          src: placeholderSrc,
          meta: {
            category: 'accessory',
            size: '9mm',
            color: '#fde68a',
            energy: { vitality: 2, wealth: 1 },
            energyTag: { emoji: '🔔', label: '喜悦共振' },
          },
        },
      ],
      price: '99.00',
      stock: 999,
      energy_tags: ['喜悦', '招财'],
      diameter: '9mm',
      weight: '2.10g',
    },
  ]

  await prisma.product.createMany({
    data: products,
  })

  console.log(`Seeded ${products.length} products.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

