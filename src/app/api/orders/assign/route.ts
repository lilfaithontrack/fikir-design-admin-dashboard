import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUserFromRequest } from '@/lib/session-user';

// -----------------------------------------------------------------------
// Fabric-meter prediction helper (habesha & chiffon garment heuristics)
// -----------------------------------------------------------------------
function predictFabricMeters(measurements: Record<string, unknown>, garmentType: string): number {
  const height = Number(measurements?.height ?? 165); // cm
  const waist = Number(measurements?.waist ?? 70);    // cm
  const hips = Number(measurements?.hips ?? 95);      // cm

  const heightM = height / 100;
  const maxCircumference = Math.max(waist, hips) / 100; // meters

  switch (garmentType) {
    case 'full_dress': {
      // Full habesha dress: body length × 2 + allowance, 2 widths
      const bodyLength = heightM * 0.6;
      return Math.round((bodyLength * 2 + 0.5 + maxCircumference * 0.3) * 10) / 10;
    }
    case 'top': {
      const topLength = heightM * 0.35;
      return Math.round((topLength * 2 + 0.3 + maxCircumference * 0.15) * 10) / 10;
    }
    case 'skirt': {
      const skirtLength = heightM * 0.55;
      return Math.round((skirtLength * 1.5 + 0.4) * 10) / 10;
    }
    case 'kemis': {
      // Habesha kemis (long traditional dress) ~ 6–8 m typically
      return Math.round((heightM * 1.2 + maxCircumference * 0.5 + 0.8) * 10) / 10;
    }
    case 'habesha_set': {
      // Dress + netela combo
      return Math.round((heightM * 1.4 + maxCircumference * 0.6 + 1.2) * 10) / 10;
    }
    case 'chiffon_dress': {
      // Chiffon is flowy, needs more volume
      return Math.round((heightM * 1.1 + maxCircumference * 0.8 + 0.6) * 10) / 10;
    }
    default: {
      // Generic fallback: ~4 meters
      return 4.0;
    }
  }
}

// Auto-assign: pick the sewer with fewest active assignments
async function autoPickSewer(): Promise<number | null> {
  const sewers = await (prisma as any).user.findMany({
    where: { role: 'sewer', isActive: true },
    select: {
      id: true,
      _count: {
        select: {
          sewingAssignments: {
            where: { status: { in: ['pending', 'accepted', 'in_progress'] } },
          },
        },
      },
    },
    orderBy: { id: 'asc' },
  });

  if (!sewers.length) return null;
  sewers.sort((a: any, b: any) => a._count.sewingAssignments - b._count.sewingAssignments);
  return sewers[0].id;
}

// GET /api/orders/assign — list assignments (with filters)
export async function GET(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sp = request.nextUrl.searchParams;
  const sewerId = sp.get('sewerId') ? parseInt(sp.get('sewerId')!) : undefined;
  const status = sp.get('status') ?? undefined;
  const orderId = sp.get('orderId') ? parseInt(sp.get('orderId')!) : undefined;

  const where: Record<string, unknown> = {};
  if (user.role === 'sewer') where.sewerId = user.id;
  else if (sewerId) where.sewerId = sewerId;
  if (status) where.status = status;
  if (orderId) where.orderId = orderId;

  const assignments = await (prisma as any).orderAssignment.findMany({
    where,
    include: {
      order: { select: { id: true, orderNumber: true, status: true, currentStage: true, customer: { select: { id: true, firstName: true, lastName: true, phone: true, photos: true, bodyMeasurements: true } } } },
      sewer: { select: { id: true, firstName: true, lastName: true, phone: true } },
      assignedBy: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ assignments });
}

// POST /api/orders/assign — create assignment
export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['admin', 'manager'].includes(user.role)) {
    return NextResponse.json({ error: 'Only admin/manager can assign orders' }, { status: 403 });
  }

  const body = await request.json();
  const { orderId, sewerId: manualSewerId, method = 'manual', measurements, garmentType = 'full_dress', estimatedDoneAt } = body;

  if (!orderId) return NextResponse.json({ error: 'orderId is required' }, { status: 400 });

  const order = await prisma.order.findUnique({ where: { id: Number(orderId) } });
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  const existing = await (prisma as any).orderAssignment.findUnique({ where: { orderId: Number(orderId) } });
  if (existing && !['rejected'].includes(existing.status)) {
    return NextResponse.json({ error: 'Order already has an active assignment' }, { status: 409 });
  }

  let resolvedSewerId: number | null = null;
  if (method === 'automatic') {
    resolvedSewerId = await autoPickSewer();
    if (!resolvedSewerId) return NextResponse.json({ error: 'No available sewers found' }, { status: 422 });
  } else {
    if (!manualSewerId) return NextResponse.json({ error: 'sewerId is required for manual assignment' }, { status: 400 });
    resolvedSewerId = Number(manualSewerId);
  }

  // Predict fabric meters from measurements
  const mergedMeasurements: Record<string, unknown> = {
    ...(typeof order.customerId === 'number'
      ? ((await (prisma as any).customer.findUnique({ where: { id: order.customerId }, select: { bodyMeasurements: true } }))?.bodyMeasurements as Record<string, unknown> ?? {})
      : {}),
    ...(measurements ?? {}),
  };
  const fabricMeters = predictFabricMeters(mergedMeasurements, garmentType);

  const assignment = existing
    ? await (prisma as any).orderAssignment.update({
        where: { id: existing.id },
        data: {
          sewerId: resolvedSewerId,
          assignedById: user.id,
          method: method as 'manual' | 'automatic',
          status: 'pending',
          measurements: mergedMeasurements,
          fabricMetersRequired: fabricMeters,
          estimatedDoneAt: estimatedDoneAt ? new Date(estimatedDoneAt) : null,
          responseAt: null,
          rejectReason: null,
        },
      })
    : await (prisma as any).orderAssignment.create({
        data: {
          orderId: Number(orderId),
          sewerId: resolvedSewerId,
          assignedById: user.id,
          method: method as 'manual' | 'automatic',
          status: 'pending',
          measurements: mergedMeasurements,
          fabricMetersRequired: fabricMeters,
          estimatedDoneAt: estimatedDoneAt ? new Date(estimatedDoneAt) : null,
        },
      });

  // Advance order to sewer_production_team stage
  await prisma.order.update({
    where: { id: Number(orderId) },
    data: { status: 'assigned', currentStage: 'sewer_production_team' },
  });
  await prisma.workflowStageEvent.create({
    data: {
      orderId: Number(orderId),
      fromStage: order.currentStage,
      toStage: 'sewer_production_team',
      actorUserId: user.id,
      actorRole: user.role,
      comment: `Assigned to sewer (${method}). Fabric required: ${fabricMeters}m`,
    },
  });

  return NextResponse.json({ assignment, fabricMetersRequired: fabricMeters }, { status: 201 });
}

// PATCH /api/orders/assign — sewer accept / reject / update progress
export async function PATCH(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { assignmentId, action, rejectReason, sewerNotes, measurements } = body;

  if (!assignmentId || !action) {
    return NextResponse.json({ error: 'assignmentId and action are required' }, { status: 400 });
  }

  const assignment = await (prisma as any).orderAssignment.findUnique({ where: { id: Number(assignmentId) } });
  if (!assignment) return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });

  // Sewer can only update their own assignment
  if (user.role === 'sewer' && assignment.sewerId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const validActions = {
    accept: { status: 'accepted', startedAt: new Date(), responseAt: new Date() },
    reject: { status: 'rejected', responseAt: new Date(), rejectReason: rejectReason ?? 'No reason given' },
    start: { status: 'in_progress', startedAt: new Date() },
    complete: { status: 'completed', completedAt: new Date() },
    update_measurements: {},
    update_notes: {},
  } as Record<string, Record<string, unknown>>;

  if (!validActions[action]) {
    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }

  const updateData: Record<string, unknown> = { ...validActions[action] };
  if (sewerNotes !== undefined) updateData.sewerNotes = sewerNotes;
  if (measurements !== undefined) updateData.measurements = measurements;

  const updated = await (prisma as any).orderAssignment.update({
    where: { id: Number(assignmentId) },
    data: updateData,
  });

  // Sync order status on key transitions
  const orderStatusMap: Record<string, { status: string; stage?: string }> = {
    accept: { status: 'sewing_in_progress', stage: 'sewer_production_team' },
    reject: { status: 'pending' },
    start: { status: 'sewing_in_progress' },
    complete: { status: 'sewing_completed', stage: 'quality_control' },
  };

  if (orderStatusMap[action]) {
    const { status: oStatus, stage } = orderStatusMap[action];
    const currentOrder = await prisma.order.findUnique({ where: { id: assignment.orderId }, select: { currentStage: true } });
    await prisma.order.update({
      where: { id: assignment.orderId },
      data: { status: oStatus as never, ...(stage ? { currentStage: stage as never } : {}) },
    });
    if (stage && currentOrder) {
      await prisma.workflowStageEvent.create({
        data: {
          orderId: assignment.orderId,
          fromStage: currentOrder.currentStage,
          toStage: stage as never,
          actorUserId: user.id,
          actorRole: user.role,
          comment: `Sewer ${action}: ${sewerNotes ?? ''}`,
        },
      });
    }
  }

  return NextResponse.json({ assignment: updated });
}
