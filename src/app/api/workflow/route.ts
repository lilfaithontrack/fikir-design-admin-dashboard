import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUserFromRequest } from '@/lib/session-user';

export const WORKFLOW_STAGES = [
  'crm_data',
  'sales_staff',
  'designer',
  'sewer_production_team',
  'store_manager',
  'production',
  'quality_control',
  'delivery_team',
] as const;

type WorkflowStage = typeof WORKFLOW_STAGES[number];

// GET /api/workflow — stage counts + recent events
export async function GET(req: NextRequest) {
  const user = await getCurrentUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [orders, events] = await Promise.all([
    prisma.order.findMany({
      select: {
        id: true,
        orderNumber: true,
        status: true,
        currentStage: true,
        isHighPriority: true,
        createdAt: true,
        customer: { select: { id: true, firstName: true, lastName: true } },
        workflowEvents: {
          orderBy: { createdAt: 'desc' },
          take: 3,
          select: {
            id: true,
            fromStage: true,
            toStage: true,
            comment: true,
            createdAt: true,
            actor: { select: { id: true, firstName: true, lastName: true, role: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
    prisma.workflowStageEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        orderId: true,
        fromStage: true,
        toStage: true,
        actorUserId: true,
        actorRole: true,
        comment: true,
        createdAt: true,
        actor: { select: { id: true, firstName: true, lastName: true, role: true } },
        order: {
          select: {
            orderNumber: true,
            status: true,
            currentStage: true,
            customer: { select: { firstName: true, lastName: true } },
          },
        },
      },
    }),
  ]);

  const stageCounts = WORKFLOW_STAGES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = orders.filter((o) => o.currentStage === s).length;
    return acc;
  }, {});

  return NextResponse.json({ orders, events, stageCounts, stages: WORKFLOW_STAGES });
}

// POST /api/workflow — advance order to next (or specified) stage
export async function POST(req: NextRequest) {
  const user = await getCurrentUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { orderId, toStage, comment } = body;

  if (!orderId) return NextResponse.json({ error: 'orderId is required' }, { status: 400 });

  const order = await prisma.order.findUnique({
    where: { id: Number(orderId) },
    select: { id: true, currentStage: true, status: true },
  });
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  // If toStage not given, auto-advance to next
  let targetStage: WorkflowStage;
  if (toStage) {
    if (!(WORKFLOW_STAGES as readonly string[]).includes(toStage)) {
      return NextResponse.json({ error: `Invalid stage: ${toStage}. Valid: ${WORKFLOW_STAGES.join(', ')}` }, { status: 400 });
    }
    targetStage = toStage as WorkflowStage;
  } else {
    const currentIdx = WORKFLOW_STAGES.indexOf(order.currentStage as WorkflowStage);
    if (currentIdx === -1 || currentIdx >= WORKFLOW_STAGES.length - 1) {
      return NextResponse.json({ error: 'Order is already at final stage or stage is unknown' }, { status: 400 });
    }
    targetStage = WORKFLOW_STAGES[currentIdx + 1];
  }

  // Map stage → order status
  const STAGE_STATUS_MAP: Partial<Record<WorkflowStage, string>> = {
    crm_data: 'pending',
    sales_staff: 'pending',
    designer: 'design_in_progress',
    sewer_production_team: 'sewing_in_progress',
    store_manager: 'sewing_completed',
    production: 'sewing_in_progress',
    quality_control: 'quality_check',
    delivery_team: 'ready_for_delivery',
  };

  const [updatedOrder, event] = await prisma.$transaction([
    prisma.order.update({
      where: { id: Number(orderId) },
      data: {
        currentStage: targetStage as never,
        status: (STAGE_STATUS_MAP[targetStage] ?? order.status) as never,
      },
    }),
    prisma.workflowStageEvent.create({
      data: {
        orderId: Number(orderId),
        fromStage: order.currentStage as never,
        toStage: targetStage as never,
        actorUserId: user.id,
        actorRole: user.role,
        comment: comment || `Stage advanced to ${targetStage}`,
      },
    }),
  ]);

  return NextResponse.json({ order: updatedOrder, event }, { status: 201 });
}
