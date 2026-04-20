import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUserFromRequest } from '@/lib/session-user';

// POST /api/fabric-cuts — allocate & deduct fabric for an order
export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['admin', 'manager', 'store_keeper', 'material_controller', 'sewer'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { orderId, rawMaterialId, garmentType, metersRequired, metersActualCut, wastePercent, notes, confirmCut } = body;

  if (!orderId || !rawMaterialId || !garmentType) {
    return NextResponse.json({ error: 'orderId, rawMaterialId and garmentType are required' }, { status: 400 });
  }

  const material = await (prisma as any).rawMaterial.findUnique({ where: { id: Number(rawMaterialId) } });
  if (!material) return NextResponse.json({ error: 'Raw material not found' }, { status: 404 });

  const metersToUse = Number(metersActualCut ?? metersRequired ?? 0);
  if (metersToUse <= 0) return NextResponse.json({ error: 'meters must be > 0' }, { status: 400 });

  if (Number(material.quantityInStock) < metersToUse) {
    return NextResponse.json({
      error: `Insufficient stock. Available: ${material.quantityInStock}m, Required: ${metersToUse}m`,
      available: Number(material.quantityInStock),
      required: metersToUse,
    }, { status: 422 });
  }

  // Create fabric cut record
  const fabricCut = await (prisma as any).fabricCut.create({
    data: {
      orderId: Number(orderId),
      rawMaterialId: Number(rawMaterialId),
      clothType: material.clothType,
      garmentType,
      metersRequired: Number(metersRequired ?? metersToUse),
      metersActualCut: metersToUse,
      wastePercent: Number(wastePercent ?? 10),
      notes: notes ?? null,
      cutById: confirmCut ? user.id : null,
      cutAt: confirmCut ? new Date() : null,
    },
  });

  // Deduct from raw material stock and record movement
  if (confirmCut) {
    const quantityBefore = Number(material.quantityInStock);
    const quantityAfter = quantityBefore - metersToUse;

    await (prisma as any).rawMaterial.update({
      where: { id: Number(rawMaterialId) },
      data: { quantityInStock: quantityAfter },
    });

    await (prisma as any).stockMovement.create({
      data: {
        rawMaterialId: Number(rawMaterialId),
        type: 'fabric_cut',
        direction: 'out',
        quantityChange: metersToUse,
        quantityBefore,
        quantityAfter,
        unitCost: Number(material.costPerMeter),
        totalCost: metersToUse * Number(material.costPerMeter),
        referenceOrderId: Number(orderId),
        note: `Cut for order #${orderId} — ${garmentType}${notes ? ': ' + notes : ''}`,
        createdById: user.id,
      },
    });
  }

  return NextResponse.json({ fabricCut, stockDeducted: confirmCut, remainingStock: confirmCut ? Number(material.quantityInStock) - metersToUse : Number(material.quantityInStock) }, { status: 201 });
}

// GET /api/fabric-cuts — list cuts (by order or material)
export async function GET(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sp = request.nextUrl.searchParams;
  const orderId = sp.get('orderId') ? parseInt(sp.get('orderId')!) : undefined;
  const rawMaterialId = sp.get('rawMaterialId') ? parseInt(sp.get('rawMaterialId')!) : undefined;

  const where: Record<string, unknown> = {};
  if (orderId) where.orderId = orderId;
  if (rawMaterialId) where.rawMaterialId = rawMaterialId;

  const cuts = await (prisma as any).fabricCut.findMany({
    where,
    include: {
      rawMaterial: { select: { id: true, name: true, clothType: true, colorOrPattern: true, costPerMeter: true } },
      order: { select: { id: true, orderNumber: true, customer: { select: { firstName: true, lastName: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ cuts });
}
