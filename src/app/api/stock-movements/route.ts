import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUserFromRequest } from '@/lib/session-user';

// GET /api/stock-movements — income/expense ledger
export async function GET(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sp = request.nextUrl.searchParams;
  const rawMaterialId = sp.get('rawMaterialId') ? parseInt(sp.get('rawMaterialId')!) : undefined;
  const type = sp.get('type') ?? undefined;
  const direction = sp.get('direction') ?? undefined;
  const page = parseInt(sp.get('page') ?? '1');
  const limit = parseInt(sp.get('limit') ?? '50');

  const where: Record<string, unknown> = {};
  if (rawMaterialId) where.rawMaterialId = rawMaterialId;
  if (type) where.type = type;
  if (direction) where.direction = direction;

  const [movements, total] = await Promise.all([
    (prisma as any).stockMovement.findMany({
      where,
      include: {
        rawMaterial: { select: { id: true, name: true, clothType: true, colorOrPattern: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    (prisma as any).stockMovement.count({ where }),
  ]);

  // Compute income/expense summary
  const summary = await (prisma as any).stockMovement.groupBy({
    by: ['direction'],
    where,
    _sum: { totalCost: true, quantityChange: true },
  });

  const income = summary.find((s: any) => s.direction === 'in')?._sum?.totalCost ?? 0;
  const expense = summary.find((s: any) => s.direction === 'out')?._sum?.totalCost ?? 0;

  const serialized = movements.map((m: any) => ({
    ...m,
    quantityChange: m.quantityChange?.toString(),
    quantityBefore: m.quantityBefore?.toString(),
    quantityAfter: m.quantityAfter?.toString(),
    unitCost: m.unitCost?.toString() ?? null,
    totalCost: m.totalCost?.toString() ?? null,
  }));

  return NextResponse.json({
    movements: serialized,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    summary: {
      totalIncome: Number(income),
      totalExpense: Number(expense),
      net: Number(income) - Number(expense),
    },
  });
}

// POST /api/stock-movements — manual adjustment (purchase / return / adjustment / waste)
export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['admin', 'manager', 'store_keeper', 'material_controller'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { rawMaterialId, type, direction, quantityChange, unitCost, supplier, invoiceNumber, note, referenceOrderId } = body;

  if (!rawMaterialId || !type || !direction || !quantityChange) {
    return NextResponse.json({ error: 'rawMaterialId, type, direction and quantityChange are required' }, { status: 400 });
  }

  const material = await (prisma as any).rawMaterial.findUnique({ where: { id: Number(rawMaterialId) } });
  if (!material) return NextResponse.json({ error: 'Raw material not found' }, { status: 404 });

  const qty = Number(quantityChange);
  const quantityBefore = Number(material.quantityInStock);
  const quantityAfter = direction === 'in' ? quantityBefore + qty : quantityBefore - qty;

  if (quantityAfter < 0) {
    return NextResponse.json({ error: `Cannot deduct ${qty}m — only ${quantityBefore}m in stock` }, { status: 422 });
  }

  const uc = unitCost ? Number(unitCost) : Number(material.costPerMeter);
  const totalCost = uc * qty;

  const movement = await (prisma as any).stockMovement.create({
    data: {
      rawMaterialId: Number(rawMaterialId),
      type,
      direction,
      quantityChange: qty,
      quantityBefore,
      quantityAfter,
      unitCost: uc,
      totalCost,
      supplier: supplier ?? null,
      invoiceNumber: invoiceNumber ?? null,
      note: note ?? null,
      referenceOrderId: referenceOrderId ? Number(referenceOrderId) : null,
      createdById: user.id,
    },
  });

  await (prisma as any).rawMaterial.update({
    where: { id: Number(rawMaterialId) },
    data: { quantityInStock: quantityAfter },
  });

  return NextResponse.json({ movement }, { status: 201 });
}
