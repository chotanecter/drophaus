export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = { active: true }
  if (category) {
    where.category = { slug: category }
  }

  const products = await prisma.product.findMany({
    where,
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  })

  // Strip wholesale prices from public API response
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const publicProducts = products.map(({ wholesalePrice, ...rest }: { wholesalePrice: number | null; [key: string]: unknown }) => rest)

  return NextResponse.json(publicProducts)
}

export async function POST(req: NextRequest) {
  const key = new URL(req.url).searchParams.get('key')
  if (key !== process.env.ADMIN_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const product = await prisma.product.create({
    data: {
      name: body.name,
      slug: body.slug,
      description: body.description,
      price: body.price,
      wholesalePrice: body.wholesalePrice,
      categoryId: body.categoryId,
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
