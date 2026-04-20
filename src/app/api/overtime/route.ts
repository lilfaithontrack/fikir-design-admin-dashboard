import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUserFromRequest } from '@/lib/session-user'

export async function GET(req: NextRequest) {
  const actor = await getCurrentUserFromRequest(req)
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId') ? Number(searchParams.get('userId')) : undefined
  const status = searchParams.get('status') || undefined

  const isAdmin = ['admin', 'manager'].includes(actor.role)
  const whereUserId = isAdmin ? userId : actor.id

  const logs = await prisma.overtimeLog.findMany({
    where: {
      ...(whereUserId ? { userId: whereUserId } : {}),
      ...(status ? { status: status as any } : {}),
    } as any,
    include: {
      user: { select: { id: true, firstName: true, lastName: true, role: true } },
      approvedBy: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { date: 'desc' },
    take: 100,
  })

  return NextResponse.json({ logs })
}

export async function POST(req: NextRequest) {
  const actor = await getCurrentUserFromRequest(req)
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { userId, date, hoursWorked, regularHours = 8, hourlyRate, note } = body as {
    userId?: number
    date: string
    hoursWorked: number
    regularHours?: number
    hourlyRate: number
    note?: string
  }

  const targetUserId = ['admin', 'manager'].includes(actor.role) ? (userId ?? actor.id) : actor.id
  const overtime = Math.max(0, hoursWorked - regularHours)
  const overtimePay = overtime * hourlyRate * 1.5

  const log = await prisma.overtimeLog.create({
    data: {
      userId: targetUserId,
      date: new Date(date),
      hoursWorked,
      regularHours,
      overtimeHours: overtime,
      hourlyRate,
      overtimePay,
      note,
    },
  })

  return NextResponse.json({ log }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const actor = await getCurrentUserFromRequest(req)
  if (!actor || !['admin', 'manager'].includes(actor.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { id, status } = body as { id: number; status: string }

  const log = await prisma.overtimeLog.update({
    where: { id },
    data: {
      status: status as any,
      approvedById: ['approved', 'paid'].includes(status) ? actor.id : undefined,
      approvedAt: ['approved', 'paid'].includes(status) ? new Date() : undefined,
    },
  })

  return NextResponse.json({ log })
}
