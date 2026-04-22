import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUserFromRequest } from '@/lib/session-user';

// GET /api/payroll - List payroll records
export async function GET(req: NextRequest) {
  const actor = await getCurrentUserFromRequest(req);
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId') ? Number(searchParams.get('userId')) : undefined;
  const status = searchParams.get('status') || undefined;
  const page = Number(searchParams.get('page') ?? 1);
  const limit = Number(searchParams.get('limit') ?? 50);

  const isAdmin = ['admin', 'manager'].includes(actor.role);
  const whereUserId = isAdmin ? userId : actor.id;

  const where: any = {
    ...(whereUserId ? { userId: whereUserId } : {}),
    ...(status ? { status } : {}),
  };

  const [records, total] = await Promise.all([
    (prisma as any).payroll.findMany({
      where,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, role: true, phone: true } },
        processedBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { periodStart: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    (prisma as any).payroll.count({ where }),
  ]);

  // Summary
  const allForSummary = await (prisma as any).payroll.findMany({
    where,
    select: { grossPay: true, totalDeductions: true, netPay: true, status: true },
  });

  const summary = {
    totalGross: allForSummary.reduce((s: number, r: any) => s + Number(r.grossPay), 0),
    totalDeductions: allForSummary.reduce((s: number, r: any) => s + Number(r.totalDeductions), 0),
    totalNet: allForSummary.reduce((s: number, r: any) => s + Number(r.netPay), 0),
    paidCount: allForSummary.filter((r: any) => r.status === 'paid').length,
    pendingCount: allForSummary.filter((r: any) => ['draft', 'pending_approval', 'approved'].includes(r.status)).length,
  };

  return NextResponse.json({ records, total, page, limit, summary });
}

// POST /api/payroll - Create payroll record
export async function POST(req: NextRequest) {
  const actor = await getCurrentUserFromRequest(req);
  if (!actor || !['admin', 'manager'].includes(actor.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      userId, periodType, periodStart, periodEnd,
      baseSalary, overtimePay, bonus, commission, allowances,
      taxDeduction, pensionDeduction, otherDeductions, deductionNotes,
      notes, paymentMethod,
    } = body;

    if (!userId || !periodStart || !periodEnd || baseSalary === undefined) {
      return NextResponse.json({ error: 'userId, periodStart, periodEnd, and baseSalary are required' }, { status: 400 });
    }

    const base = Number(baseSalary) || 0;
    const ot = Number(overtimePay) || 0;
    const bon = Number(bonus) || 0;
    const comm = Number(commission) || 0;
    const allow = Number(allowances) || 0;

    const tax = Number(taxDeduction) || 0;
    const pension = Number(pensionDeduction) || 0;
    const otherDed = Number(otherDeductions) || 0;

    const grossPay = base + ot + bon + comm + allow;
    const totalDeductions = tax + pension + otherDed;
    const netPay = grossPay - totalDeductions;

    const record = await (prisma as any).payroll.create({
      data: {
        userId: Number(userId),
        periodType: periodType || 'monthly',
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        baseSalary: base,
        overtimePay: ot,
        bonus: bon,
        commission: comm,
        allowances: allow,
        taxDeduction: tax,
        pensionDeduction: pension,
        otherDeductions: otherDed,
        deductionNotes: deductionNotes || null,
        grossPay,
        totalDeductions,
        netPay,
        notes: notes || null,
        paymentMethod: paymentMethod || null,
        status: 'draft',
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Error creating payroll:', error);
    return NextResponse.json({ error: 'Failed to create payroll record' }, { status: 500 });
  }
}

// PATCH /api/payroll - Update status (approve / pay / reject)
export async function PATCH(req: NextRequest) {
  const actor = await getCurrentUserFromRequest(req);
  if (!actor || !['admin', 'manager'].includes(actor.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, status, paymentRef } = body as { id: number; status: string; paymentRef?: string };

    const data: any = { status };
    if (status === 'approved' || status === 'paid') {
      data.processedById = actor.id;
      data.processedAt = new Date();
    }
    if (status === 'paid') {
      data.paidAt = new Date();
      if (paymentRef) data.paymentRef = paymentRef;
    }

    const record = await (prisma as any).payroll.update({
      where: { id: Number(id) },
      data,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
    });

    // Auto-create finance transaction when paid
    if (status === 'paid') {
      await (prisma as any).financeTransaction.create({
        data: {
          type: 'expense',
          category: 'salary_payment',
          amount: Number(record.netPay),
          title: `Salary: ${record.user.firstName} ${record.user.lastName}`,
          description: `Payroll #${record.id} for period ${new Date(record.periodStart).toLocaleDateString()} - ${new Date(record.periodEnd).toLocaleDateString()}`,
          referenceId: String(record.id),
          referenceType: 'payroll',
          transactionDate: new Date(),
          createdById: actor.id,
        },
      });
    }

    return NextResponse.json(record);
  } catch (error) {
    console.error('Error updating payroll:', error);
    return NextResponse.json({ error: 'Failed to update payroll' }, { status: 500 });
  }
}
