export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const includeProducts = searchParams.get('products') !== 'false'

  const collabs = await prisma.collab.findMany({
    where: { active: true },
    include: {
      products: includeProducts ? {
        where: { active: true },
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          images: true,
          colorHexCodes: true,
          colors: true,
          fabricWeight: true,
          category: { select: { name: true, slug: true } },
        },
        orderBy: { createdAt: 'desc' },
      } : false,
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(collabs)
}

export async function POST(req: NextRequest) {
  const key = new URL(req.url).searchParams.get('key')
  if (key !== process.env.ADMIN_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const collab = await prisma.collab.create({
    data: {
      brandName: body.brandName,
      slug: body.slug,
      description: body.description,
      logo: body.logo,
      coverImage: body.coverImage,
      featured: body.featured || false,
    },
  })

  return NextResponse.json(collab)
}
