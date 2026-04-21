export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const tag = searchParams.get('tag')
  const includeTags = searchParams.get('tags') === 'true'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = { active: true, collabId: null }
  if (category) {
    where.category = { slug: category }
  }
  if (tag) {
    where.tags = { has: tag }
  }

  const products = await prisma.product.findMany({
    where,
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  })

  // If ?tags=true, also return all unique tags across active products
  if (includeTags) {
    const allProducts = await prisma.product.findMany({
      where: { active: true, collabId: null },
      select: { tags: true },
    })
    const tagSet = new Set<string>()
    for (const p of allProducts) {
      for (const t of p.tags) {
        tagSet.add(t)
      }
    }
    const allTags = Array.from(tagSet).sort()
    return NextResponse.json({ products, tags: allTags })
  }

  return NextResponse.json(products)
}

export async function POST(req: NextRequest) {
  const key = new URL(req.url).searchParams.get('key')
  if (key !== process.env.ADMIN_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()

  // Resolve categoryId from slug if not provided directly
  let categoryId = body.categoryId
  if (!categoryId && body.categorySlug) {
    const cat = await prisma.category.findUnique({ where: { slug: body.categorySlug } })
    if (!cat) return NextResponse.json({ error: 'Category not found' }, { status: 400 })
    categoryId = cat.id
  }

  const product = await prisma.product.create({
    data: {
      name: body.name,
      slug: body.slug,
      description: body.description,
      price: body.price,
      wholesalePrice: body.wholesalePrice,
      categoryId,
      sizes: body.sizes || [],
      colors: body.colors || [],
      colorHexCodes: body.colorHexCodes || [],
      fabricWeight: body.fabricWeight,
      fabricMaterial: body.fabricMaterial,
      images: body.images || [],
      featured: body.featured || false,
      active: body.active ?? true,
    },
    include: { category: true },
  })

  return NextResponse.json(product)
}
