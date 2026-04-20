import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUserFromRequest } from '@/lib/session-user'

export async function GET(req: NextRequest) {
  const actor = await getCurrentUserFromRequest(req)
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId') ? Number(searchParams.get('userId')) : undefined
  const status = searchParams.get('status') || undefined
  const page = Number(searchParams.get('page') ?? 1)
  const limit = Number(searchParams.get('limit') ?? 20)

  const isAdmin = ['admin', 'manager'].includes(actor.role)
  const whereUserId = isAdmin ? userId : actor.id

  const where: any = {
    ...(whereUserId ? { userId: whereUserId } : {}),
    ...(status ? { status } : {}),
  }

  const [reports, total] = await Promise.all([
    prisma.salesActivityReport.findMany({
      where,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, role: true } },
        reviewedBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { reportDate: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.salesActivityReport.count({ where }),
  ])

  return NextResponse.json({ reports, total, page, limit })
}

export async function POST(req: NextRequest) {
  const actor = await getCurrentUserFromRequest(req)
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isSalesOrAbove = ['sales', 'admin', 'manager'].includes(actor.role)
  if (!isSalesOrAbove) {
    return NextResponse.json({ error: 'Only sales staff can submit reports' }, { status: 403 })
  }

  const body = await req.json()
  const {
    reportDate,
    activityType,
    title,
    description,
    evidenceUrl,
    platform,
    reach,
    leads,
    conversions,
  } = body as {
    reportDate: string
    activityType: string
    title: string
    description?: string
    evidenceUrl?: string
    platform?: string
    reach?: number
    leads?: number
    conversions?: number
  }

  if (!reportDate || !activityType || !title) {
    return NextResponse.json({ error: 'reportDate, activityType, and title are required' }, { status: 400 })
  }

  const report = await prisma.salesActivityReport.create({
    data: {
      userId: actor.id,
      reportDate: new Date(reportDate),
      activityType: activityType as never,
      title,
      description,
      evidenceUrl,
      platform,
      reach,
      leads,
      conversions,
    },
  })

  return NextResponse.json({ report }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const actor = await getCurrentUserFromRequest(req)
  if (!actor || !['admin', 'manager'].includes(actor.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { id, status, reviewNote, pointsAwarded } = body as {
    id: number
    status: string
    reviewNote?: string
    pointsAwarded?: number
  }

  const report = await prisma.salesActivityReport.update({
    where: { id },
    data: {
      status: status as never,
      reviewNote,
      pointsAwarded,
      reviewedById: actor.id,
      reviewedAt: new Date(),
    },
  })

  return NextResponse.json({ report })
}
