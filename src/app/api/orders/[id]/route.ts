import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUserFromRequest } from '@/lib/session-user';

// GET /api/orders/[id] - Get single order
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const order = await prisma.order.findUnique({
      where: { id: parseInt(params.id) },
      include: {
        customer: true,
        items: { include: { product: true } },
        workflowEvents: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            fromStage: true,
            toStage: true,
            actorUserId: true,
            actorRole: true,
            comment: true,
            createdAt: true,
            actor: { select: { id: true, firstName: true, lastName: true, role: true } },
          },
        },
        assignment: {
          select: {
            id: true,
            sewerId: true,
            status: true,
            fabricMetersRequired: true,
            measurements: true,
            sewerNotes: true,
            sewer: { select: { id: true, firstName: true, lastName: true, role: true } },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}

// PATCH /api/orders/[id] - Update order
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    // Whitelist updatable fields to prevent mass-assignment
    const { status, notes, internalNotes, isHighPriority, shipping, discount } = body;
    const data: Record<string, unknown> = {};
    if (status !== undefined) data.status = status;
    if (notes !== undefined) data.notes = notes;
    if (internalNotes !== undefined) data.internalNotes = internalNotes;
    if (isHighPriority !== undefined) data.isHighPriority = Boolean(isHighPriority);
    if (shipping !== undefined) data.shipping = Number(shipping);
    if (discount !== undefined) data.discount = Number(discount);

    const order = await prisma.order.update({
      where: { id: parseInt(params.id) },
      data,
      include: { customer: true, items: true },
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}

// DELETE /api/orders/[id] - Delete order (admin / manager only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['admin', 'manager'].includes(user.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    await prisma.order.delete({ where: { id: parseInt(params.id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
  }
}
