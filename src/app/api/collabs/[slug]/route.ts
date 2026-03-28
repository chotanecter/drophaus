export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const collab = await prisma.collab.findUnique({
    where: { slug: params.slug },
    include: {
      products: {
        select: { id: true, name: true, slug: true, price: true, images: true, colorHexCodes: true, colors: true },
      },
    },
  })

  if (!collab) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(collab)
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
  const collab = await prisma.collab.update({
    where: { slug: params.slug },
    data: body,
  })

  return NextResponse.json(collab)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const key = new URL(req.url).searchParams.get('key')
  if (key !== process.env.ADMIN_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await prisma.collab.delete({ where: { slug: params.slug } })
  return NextResponse.json({ success: true })
}
