import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUserFromRequest } from '@/lib/session-user'

export async function GET(req: NextRequest) {
  const actor = await getCurrentUserFromRequest(req)
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId') ? Number(searchParams.get('userId')) : undefined

  const isAdmin = ['admin', 'manager'].includes(actor.role)
  if (!isAdmin && userId && userId !== actor.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (userId) {
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, role: true } },
        transactions: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
    })
    return NextResponse.json({ wallet })
  }

  const wallets = await prisma.wallet.findMany({
    include: {
      user: { select: { id: true, firstName: true, lastName: true, role: true, isActive: true } },
      transactions: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
    orderBy: { updatedAt: 'desc' },
  })
  return NextResponse.json({ wallets })
}

export async function POST(req: NextRequest) {
  const actor = await getCurrentUserFromRequest(req)
  if (!actor || !['admin', 'manager'].includes(actor.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { userId, type, reason, amount, note } = body as {
    userId: number
    type: 'credit' | 'debit' | 'adjustment'
    reason: string
    amount: number
    note?: string
  }

  if (!userId || !type || !reason || !amount) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  let wallet = await prisma.wallet.findUnique({ where: { userId } })
  if (!wallet) {
    wallet = await prisma.wallet.create({ data: { userId } })
  }

  const delta = type === 'debit' ? -Math.abs(amount) : Math.abs(amount)
  const newBalance = Number(wallet.balance) + delta

  const [updatedWallet, tx] = await prisma.$transaction([
    prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: newBalance,
        totalEarned: type === 'credit' ? { increment: amount } : undefined,
        totalPaid: type === 'debit' ? { increment: amount } : undefined,
      },
    }),
    prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type,
        reason: reason as never,
        amount,
        balanceAfter: newBalance,
        note,
        createdById: actor.id,
      },
    }),
  ])

  return NextResponse.json({ wallet: updatedWallet, transaction: tx })
}
