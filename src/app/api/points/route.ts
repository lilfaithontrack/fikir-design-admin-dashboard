import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUserFromRequest } from '@/lib/session-user'

export async function GET(req: NextRequest) {
  const actor = await getCurrentUserFromRequest(req)
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId') ? Number(searchParams.get('userId')) : undefined

  const isAdmin = ['admin', 'manager'].includes(actor.role)
  const whereUserId = isAdmin ? userId : actor.id

  const entries = await prisma.pointLedger.findMany({
    where: whereUserId ? { userId: whereUserId } : {},
    include: {
      user: { select: { id: true, firstName: true, lastName: true, role: true } },
      awardedBy: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  // Build a summary of balances per user (admin view)
  if (isAdmin && !userId) {
    const summary = await prisma.pointLedger.groupBy({
      by: ['userId'],
      _sum: { points: true },
      orderBy: { _sum: { points: 'desc' } },
    })
    return NextResponse.json({ entries, summary })
  }

  return NextResponse.json({ entries })
}

export async function POST(req: NextRequest) {
  const actor = await getCurrentUserFromRequest(req)
  if (!actor || !['admin', 'manager'].includes(actor.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { userId, type, reason, points, note, referenceId } = body as {
    userId: number
    type: 'earn' | 'redeem' | 'expire' | 'adjustment'
    reason?: string
    points: number
    note?: string
    referenceId?: number
  }

  if (!userId || !type || !points) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Get current balance
  const last = await prisma.pointLedger.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: { balanceAfter: true },
  })
  const currentBalance = last?.balanceAfter ?? 0
  const delta = type === 'redeem' || type === 'expire' ? -Math.abs(points) : Math.abs(points)
  const newBalance = currentBalance + delta

  const entry = await prisma.pointLedger.create({
    data: {
      userId,
      type,
      reason: reason as never,
      points: delta,
      balanceAfter: newBalance,
      note,
      referenceId,
      awardedById: actor.id,
    },
  })

  return NextResponse.json({ entry }, { status: 201 })
}
