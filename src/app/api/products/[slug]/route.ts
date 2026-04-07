export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: { category: true },
  })

  if (!product) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(product)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const key = new URL(req.url).searchParams.get('key')
  if (key !== process.env.ADMIN_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()

  // Resolve categorySlug to categoryId if provided
  if (body.categorySlug) {
    const cat = await prisma.category.findUnique({ where: { slug: body.categorySlug } })
    if (cat) {
      body.categoryId = cat.id
    }
    delete body.categorySlug
  }

  const product = await prisma.product.update({
    where: { slug: params.slug },
    data: body,
    include: { category: true },
  })

  return NextResponse.json(product)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const key = new URL(req.url).searchParams.get('key')
  if (key !== process.env.ADMIN_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await prisma.product.delete({ where: { slug: params.slug } })
  return NextResponse.json({ success: true })
}
