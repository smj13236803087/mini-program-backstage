const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding Product table...')

  // 清空旧数据（仅开发环境使用）
  await prisma.product.deleteMany()

  const products = [
    {
      title: '曜石 8mm 手串珠',
      productType: 'obsidian',
      imageUrl: 'https://ht7h75x5-4000.asse.devtunnels.ms/obsidian-8mm.jpg',
      images: [
        { src: 'https://ht7h75x5-4000.asse.devtunnels.ms/obsidian-8mm.jpg' },
      ],
      price: '199.00',
      diameter: '8mm',
      weight: '1.65g',
    },
    {
      title: '紫水晶 8mm 手串珠',
      productType: 'amethyst',
      imageUrl: 'https://ht7h75x5-4000.asse.devtunnels.ms/amethyst-8mm.jpg',
      images: [
        { src: 'https://ht7h75x5-4000.asse.devtunnels.ms/amethyst-8mm.jpg' },
      ],
      price: '259.00',
      diameter: '8mm',
      weight: '1.80g',
    },
    {
      title: '月光石 8mm 手串珠',
      productType: 'moonstone',
      imageUrl: 'https://ht7h75x5-4000.asse.devtunnels.ms/moonstone-8mm.jpg',
      images: [
        { src: 'https://ht7h75x5-4000.asse.devtunnels.ms/moonstone-8mm.jpg' },
      ],
      price: '289.00',
      diameter: '8mm',
      weight: '1.70g',
    },
    {
      title: '金色隔断珠',
      productType: 'spacer',
      imageUrl: 'https://ht7h75x5-4000.asse.devtunnels.ms/spacer-gold.jpg',
      images: [
        { src: 'https://ht7h75x5-4000.asse.devtunnels.ms/spacer-gold.jpg' },
      ],
      price: '39.00',
      diameter: '6mm',
      weight: '0.50g',
    },
    {
      title: '双尖水晶吊坠',
      productType: 'double-pointed-crystal',
      imageUrl:
        'https://ht7h75x5-4000.asse.devtunnels.ms/double-pointed-crystal.jpg',
      images: [
        {
          src: 'https://ht7h75x5-4000.asse.devtunnels.ms/double-pointed-crystal.jpg',
        },
      ],
      price: '129.00',
      diameter: '10mm',
      weight: '2.50g',
    },
    {
      title: '银色跑环',
      productType: 'running-laps',
      imageUrl: 'https://ht7h75x5-4000.asse.devtunnels.ms/running-laps-silver.jpg',
      images: [
        {
          src: 'https://ht7h75x5-4000.asse.devtunnels.ms/running-laps-silver.jpg',
        },
      ],
      price: '59.00',
      diameter: '6mm',
      weight: '0.80g',
    },
    {
      title: '狐狸吊坠',
      productType: 'pendant',
      imageUrl: 'https://ht7h75x5-4000.asse.devtunnels.ms/pendant-fox.jpg',
      images: [
        { src: 'https://ht7h75x5-4000.asse.devtunnels.ms/pendant-fox.jpg' },
      ],
      price: '169.00',
      diameter: '12mm',
      weight: '3.20g',
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

