import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUserFromRequest } from '@/lib/session-user';

// GET /api/orders - Get all orders
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};
    if (status) where.status = status;
    if (customerId) where.customerId = parseInt(customerId);

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        select: {
          id: true,
          orderNumber: true,
          referenceNumber: true,
          customerId: true,
          status: true,
          subtotal: true,
          tax: true,
          shipping: true,
          discount: true,
          total: true,
          currency: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          items: {
            select: {
              id: true,
              productId: true,
              quantity: true,
              price: true,
              total: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                },
              },
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ]);

    // Serialize Decimal fields to strings
    const serializedOrders = orders.map((order: any) => ({
      ...order,
      subtotal: order.subtotal?.toString(),
      tax: order.tax?.toString(),
      shipping: order.shipping?.toString(),
      discount: order.discount?.toString(),
      total: order.total?.toString(),
      items: order.items.map((item: any) => ({
        ...item,
        price: item.price?.toString(),
        total: item.total?.toString(),
      })),
    }));

    return NextResponse.json({
      orders: serializedOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// POST /api/orders - Create new order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, customerId, notes, status, shipping, discount, currency } = body;

    if (!customerId) {
      return NextResponse.json({ error: 'customerId is required' }, { status: 400 });
    }
    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'At least one item is required' }, { status: 400 });
    }

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => sum + (Number(item.price) * Number(item.quantity)), 0);
    const shippingAmt = Number(shipping) || 0;
    const discountAmt = Number(discount) || 0;
    const total = subtotal + shippingAmt - discountAmt;

    // Generate order number
    const orderCount = await prisma.order.count();
    const orderNumber = `ORD-${String(orderCount + 1).padStart(5, '0')}`;

    // Fetch product names for order items
    const productIds = items.map((i: any) => Number(i.productId))
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, sku: true },
    })
    const productMap = Object.fromEntries(products.map((p: any) => [p.id, p]))

    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId: Number(customerId),
        status: status || 'pending',
        notes: notes || null,
        subtotal,
        shipping: shippingAmt,
        discount: discountAmt,
        total,
        currency: currency || 'ETB',
        items: {
          create: items.map((item: any) => {
            const prod = productMap[Number(item.productId)] || {}
            return {
              productId: Number(item.productId),
              name: prod.name || item.name || 'Product',
              sku: prod.sku || item.sku || null,
              quantity: Number(item.quantity),
              price: Number(item.price),
              total: Number(item.price) * Number(item.quantity),
            }
          }),
        },
      },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order', details: (error as Error).message },
      { status: 500 }
    );
  }
}
