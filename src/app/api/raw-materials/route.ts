import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUserFromRequest } from '@/lib/session-user';

// GET /api/raw-materials
export async function GET(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sp = request.nextUrl.searchParams;
  const clothType = sp.get('clothType') ?? undefined;
  const lowStock = sp.get('lowStock') === '1';
  const isActive = sp.get('isActive') !== '0';

  const where: Record<string, unknown> = { isActive };
  if (clothType) where.clothType = clothType;

  const materials = await (prisma as any).rawMaterial.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { fabricCuts: true, stockMovements: true } },
    },
  });

  let serialized = materials.map((m: any) => ({
    ...m,
    quantityInStock: m.quantityInStock.toString(),
    lowStockAlert: m.lowStockAlert.toString(),
    costPerMeter: m.costPerMeter.toString(),
    widthCm: m.widthCm?.toString() ?? null,
    isLowStock: Number(m.quantityInStock) <= Number(m.lowStockAlert),
  }));

  if (lowStock) serialized = serialized.filter((m: any) => m.isLowStock);

  return NextResponse.json({ materials: serialized, total: serialized.length });
}

// POST /api/raw-materials — create
export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['admin', 'manager', 'store_keeper', 'material_controller'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { name, clothType, colorOrPattern, supplier, quantityInStock, lowStockAlert, costPerMeter, widthCm, notes } = body;

  if (!name || !clothType) {
    return NextResponse.json({ error: 'name and clothType are required' }, { status: 400 });
  }

  const material = await (prisma as any).rawMaterial.create({
    data: {
      name,
      clothType,
      colorOrPattern: colorOrPattern ?? null,
      supplier: supplier ?? null,
      quantityInStock: Number(quantityInStock ?? 0),
      lowStockAlert: Number(lowStockAlert ?? 5),
      costPerMeter: Number(costPerMeter ?? 0),
      widthCm: widthCm ? Number(widthCm) : null,
      notes: notes ?? null,
    },
  });

  // Record initial stock as a purchase movement if quantity > 0
  if (Number(quantityInStock) > 0) {
    await (prisma as any).stockMovement.create({
      data: {
        rawMaterialId: material.id,
        type: 'purchase',
        direction: 'in',
        quantityChange: Number(quantityInStock),
        quantityBefore: 0,
        quantityAfter: Number(quantityInStock),
        unitCost: Number(costPerMeter ?? 0),
        totalCost: Number(quantityInStock) * Number(costPerMeter ?? 0),
        note: 'Initial stock entry',
        createdById: user.id,
      },
    });
  }

  return NextResponse.json({ material }, { status: 201 });
}

// PATCH /api/raw-materials — update
export async function PATCH(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['admin', 'manager', 'store_keeper', 'material_controller'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const material = await (prisma as any).rawMaterial.update({
    where: { id: Number(id) },
    data: updates,
  });

  return NextResponse.json({ material });
}
