import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUserFromRequest } from '@/lib/session-user';

const INCOME_CATS = ['product_sale', 'service_fee', 'custom_order', 'delivery_fee', 'other_income'];
const EXPENSE_CATS = ['salary_payment', 'material_purchase', 'rent', 'utilities', 'equipment', 'transport', 'marketing', 'maintenance', 'tax_payment', 'other_expense'];

// GET /api/finance - List finance transactions + summary
export async function GET(req: NextRequest) {
  const actor = await getCurrentUserFromRequest(req);
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || undefined;
  const category = searchParams.get('category') || undefined;
  const from = searchParams.get('from') || undefined;
  const to = searchParams.get('to') || undefined;
  const page = Number(searchParams.get('page') ?? 1);
  const limit = Number(searchParams.get('limit') ?? 50);

  const where: any = {};
  if (type) where.type = type;
  if (category) where.category = category;
  if (from || to) {
    where.transactionDate = {};
    if (from) where.transactionDate.gte = new Date(from);
    if (to) where.transactionDate.lte = new Date(to + 'T23:59:59.999Z');
  }

  const [transactions, total] = await Promise.all([
    (prisma as any).financeTransaction.findMany({
      where,
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { transactionDate: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    (prisma as any).financeTransaction.count({ where }),
  ]);

  // Summary for the filtered period
  const allFiltered = await (prisma as any).financeTransaction.findMany({
    where,
    select: { type: true, category: true, amount: true },
  });

  const totalIncome = allFiltered
    .filter((t: any) => t.type === 'income')
    .reduce((s: number, t: any) => s + Number(t.amount), 0);
  const totalExpense = allFiltered
    .filter((t: any) => t.type === 'expense')
    .reduce((s: number, t: any) => s + Number(t.amount), 0);

  // Category breakdown
  const categoryBreakdown: Record<string, number> = {};
  allFiltered.forEach((t: any) => {
    categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + Number(t.amount);
  });

  return NextResponse.json({
    transactions,
    total,
    page,
    limit,
    summary: {
      totalIncome,
      totalExpense,
      netProfit: totalIncome - totalExpense,
      transactionCount: allFiltered.length,
      categoryBreakdown,
    },
  });
}

// POST /api/finance - Create finance transaction
export async function POST(req: NextRequest) {
  const actor = await getCurrentUserFromRequest(req);
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { type, category, amount, title, description, referenceId, referenceType, paymentMethod, paymentRef, transactionDate, attachments } = body;

    if (!type || !category || !amount || !title || !transactionDate) {
      return NextResponse.json({ error: 'type, category, amount, title, and transactionDate are required' }, { status: 400 });
    }

    // Validate type/category match
    if (type === 'income' && !INCOME_CATS.includes(category)) {
      return NextResponse.json({ error: `Invalid income category: ${category}` }, { status: 400 });
    }
    if (type === 'expense' && !EXPENSE_CATS.includes(category)) {
      return NextResponse.json({ error: `Invalid expense category: ${category}` }, { status: 400 });
    }

    const tx = await (prisma as any).financeTransaction.create({
      data: {
        type,
        category,
        amount: Number(amount),
        title: String(title).trim(),
        description: description || null,
        referenceId: referenceId || null,
        referenceType: referenceType || null,
        paymentMethod: paymentMethod || null,
        paymentRef: paymentRef || null,
        transactionDate: new Date(transactionDate),
        attachments: attachments || undefined,
        createdById: actor.id,
      },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return NextResponse.json(tx, { status: 201 });
  } catch (error) {
    console.error('Error creating finance transaction:', error);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}

// DELETE /api/finance?id=X - Delete transaction
export async function DELETE(req: NextRequest) {
  const actor = await getCurrentUserFromRequest(req);
  if (!actor || !['admin', 'manager'].includes(actor.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = Number(searchParams.get('id'));
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  try {
    await (prisma as any).financeTransaction.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting finance transaction:', error);
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
  }
}
