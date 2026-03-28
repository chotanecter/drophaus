import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter } as any) // eslint-disable-line

async function main() {
  console.log('🌱 Seeding Drop Haus database...')

  // Categories
  const tees = await prisma.category.upsert({
    where: { slug: 'tees' },
    update: {},
    create: { name: 'T-Shirts', slug: 'tees', description: 'Premium heavyweight tees', sortOrder: 1 },
  })

  const hoodies = await prisma.category.upsert({
    where: { slug: 'hoodies' },
    update: {},
    create: { name: 'Hoodies', slug: 'hoodies', description: 'Heavyweight fleece hoodies', sortOrder: 2 },
  })

  const sweats = await prisma.category.upsert({
    where: { slug: 'sweats' },
    update: {},
    create: { name: 'Sweats', slug: 'sweats', description: 'Premium sweatpants and joggers', sortOrder: 3 },
  })

  const jackets = await prisma.category.upsert({
    where: { slug: 'jackets' },
    update: {},
    create: { name: 'Jackets', slug: 'jackets', description: 'Outerwear and jackets', sortOrder: 4 },
  })

  // Products
  const productData = [
    {
      name: 'Heavyweight Crew Tee',
      slug: 'heavyweight-crew-tee',
      description: 'Our signature heavyweight blank tee. 6.5oz ring-spun cotton with a relaxed fit and reinforced collar. Built to hold up to printing and daily wear.',
      price: 24.00,
      wholesalePrice: 12.00,
      categoryId: tees.id,
      sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL'],
      colors: ['Black', 'White', 'Navy', 'Charcoal', 'Sand', 'Forest Green'],
      colorHexCodes: ['#000000', '#FFFFFF', '#1B2A4A', '#36454F', '#C2B280', '#228B22'],
      fabricWeight: '6.5 oz',
      fabricMaterial: '100% Ring-Spun Cotton',
      featured: true,
    },
    {
      name: 'Max Weight Tee',
      slug: 'max-weight-tee',
      description: 'Our heaviest blank. 7.5oz garment-dyed cotton with a boxy, vintage silhouette. The foundation for premium streetwear.',
      price: 28.00,
      wholesalePrice: 14.00,
      categoryId: tees.id,
      sizes: ['S', 'M', 'L', 'XL', '2XL'],
      colors: ['Vintage Black', 'Washed White', 'Faded Navy', 'Pigment Olive'],
      colorHexCodes: ['#1A1A1A', '#F0EDE8', '#2C3E50', '#556B2F'],
      fabricWeight: '7.5 oz',
      fabricMaterial: '100% Cotton, Garment Dyed',
      featured: true,
    },
    {
      name: 'Essential Pullover Hoodie',
      slug: 'essential-pullover-hoodie',
      description: 'Premium 12oz fleece hoodie with double-lined hood, kangaroo pocket, and ribbed cuffs. Soft inside, structured outside.',
      price: 48.00,
      wholesalePrice: 24.00,
      categoryId: hoodies.id,
      sizes: ['S', 'M', 'L', 'XL', '2XL'],
      colors: ['Black', 'Heather Gray', 'Navy', 'Cream'],
      colorHexCodes: ['#000000', '#9E9E9E', '#1B2A4A', '#FFFDD0'],
      fabricWeight: '12 oz',
      fabricMaterial: '80% Cotton / 20% Polyester Fleece',
      featured: true,
    },
    {
      name: 'Zip-Up Fleece Hoodie',
      slug: 'zip-up-fleece-hoodie',
      description: 'Full-zip heavyweight fleece hoodie. YKK zipper, split kangaroo pockets, and a clean finish perfect for embroidery.',
      price: 52.00,
      wholesalePrice: 26.00,
      categoryId: hoodies.id,
      sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL'],
      colors: ['Black', 'Charcoal', 'Navy'],
      colorHexCodes: ['#000000', '#36454F', '#1B2A4A'],
      fabricWeight: '12 oz',
      fabricMaterial: '80% Cotton / 20% Polyester Fleece',
      featured: false,
    },
    {
      name: 'Classic Sweatpants',
      slug: 'classic-sweatpants',
      description: 'Relaxed fit fleece sweatpants with elastic waistband, drawstring, and side pockets. Matching set available with our hoodies.',
      price: 42.00,
      wholesalePrice: 21.00,
      categoryId: sweats.id,
      sizes: ['S', 'M', 'L', 'XL', '2XL'],
      colors: ['Black', 'Heather Gray', 'Navy'],
      colorHexCodes: ['#000000', '#9E9E9E', '#1B2A4A'],
      fabricWeight: '10 oz',
      fabricMaterial: '80% Cotton / 20% Polyester Fleece',
      featured: true,
    },
    {
      name: 'Heavyweight Joggers',
      slug: 'heavyweight-joggers',
      description: 'Tapered leg joggers in our heavyweight fleece. Zippered pockets, elastic cuffs, and a modern slim fit.',
      price: 46.00,
      wholesalePrice: 23.00,
      categoryId: sweats.id,
      sizes: ['S', 'M', 'L', 'XL', '2XL'],
      colors: ['Black', 'Charcoal', 'Olive'],
      colorHexCodes: ['#000000', '#36454F', '#556B2F'],
      fabricWeight: '12 oz',
      fabricMaterial: '80% Cotton / 20% Polyester Fleece',
      featured: false,
    },
    {
      name: 'Coach Jacket',
      slug: 'coach-jacket',
      description: 'Lightweight nylon coach jacket with snap front closure, lined interior, and elastic cuffs. Classic streetwear essential.',
      price: 56.00,
      wholesalePrice: 28.00,
      categoryId: jackets.id,
      sizes: ['S', 'M', 'L', 'XL', '2XL'],
      colors: ['Black', 'Navy', 'Forest Green'],
      colorHexCodes: ['#000000', '#1B2A4A', '#228B22'],
      fabricWeight: '4 oz',
      fabricMaterial: '100% Nylon, Polyester Lined',
      featured: false,
    },
    {
      name: 'Varsity Jacket',
      slug: 'varsity-jacket',
      description: 'Wool-blend body with faux leather sleeves. Snap front, ribbed collar/cuffs/hem. Premium blank for custom patches and embroidery.',
      price: 78.00,
      wholesalePrice: 39.00,
      categoryId: jackets.id,
      sizes: ['S', 'M', 'L', 'XL', '2XL'],
      colors: ['Black/Black', 'Navy/Cream', 'Forest/Cream'],
      colorHexCodes: ['#000000', '#1B2A4A', '#228B22'],
      fabricWeight: '16 oz',
      fabricMaterial: 'Wool Blend Body / Faux Leather Sleeves',
      featured: true,
    },
  ]

  for (const p of productData) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        ...p,
        images: [],
        active: true,
      },
    })
  }

  // Collabs
  await prisma.collab.upsert({
    where: { slug: 'midnight-studio' },
    update: {},
    create: {
      brandName: 'Midnight Studio',
      slug: 'midnight-studio',
      description: 'A limited capsule collection with Midnight Studio exploring monochrome streetwear. Premium heavyweight blanks with custom washes and treatments.',
      featured: true,
      active: true,
    },
  })

  await prisma.collab.upsert({
    where: { slug: 'raw-athletics' },
    update: {},
    create: {
      brandName: 'Raw Athletics',
      slug: 'raw-athletics',
      description: 'Performance meets streetwear. A collaboration bringing athletic-grade construction to our signature heavyweight silhouettes.',
      featured: true,
      active: true,
    },
  })

  console.log('✅ Seed complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
