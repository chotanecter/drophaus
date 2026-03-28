export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  const collabs = await prisma.collab.findMany({
    where: { active: true },
    include: {
      products: {
        select: { id: true, name: true, slug: true, price: true, images: true, colorHexCodes: true, colors: true },
      },
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
