import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { PaymentMethod } from "@prisma/client";
import { NextResponse } from "next/server";

// Create order for user
export async function POST(request) {
  try {
    const { userId, has } = getAuth(request);
    if (!userId) {
      return NextResponse.json(
        {
          error: "Not authorized.",
        },
        {
          status: 401,
        }
      );
    }

    const { addressId, items, couponCode, paymentMethod } =
      await request.json();

    // Check if all required field present
    if (
      !addressId ||
      !items ||
      !Array.isArray(items) ||
      items.length === 0 ||
      !paymentMethod
    ) {
      return NextResponse.json(
        {
          error: "Missing order details",
        },
        { status: 400 }
      );
    }

    let coupon = null;

    if (couponCode) {
      coupon = await prisma.coupon.findUnique({
        where: {
          code: couponCode.toUpperCase(),
        },
      });

      if (!coupon) {
        return NextResponse.json(
          {
            error: "Coupon not found.",
          },
          { status: 404 }
        );
      }
    }

    // Check if coupon is applicable for new users
    if (couponCode && coupon.forNewUser) {
      const userOrders = await prisma.order.findMany({
        where: {
          userId,
        },
      });

      if (userOrders?.length > 0) {
        return NextResponse.json(
          {
            error: "Coupon valid for new users.",
          },
          { status: 400 }
        );
      }
    }

    const isPlusMember = has({ plan: "plus" });

    // Check if coupon is applicable for members
    if (couponCode && coupon.forMember) {
      if (!isPlusMember) {
        return NextResponse.json(
          {
            error: "Coupon valid for members only.",
          },
          { status: 400 }
        );
      }
    }

    // Group orders by storeId using a map
    const ordersByStore = new Map();

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: {
          id: item.id,
        },
      });
      const storeId = product.storeId;

      if (!ordersByStore.has(storeId)) {
        ordersByStore.set(storeId, []);
      }

      ordersByStore.get(storeId).push({ ...item, price: product.price });
    }

    let orderIds = [];
    let fullAmount = 0;

    let isShippingFeeAdded = false;

    // Create orders for each seller
    for (const [storeId, sellerItems] of ordersByStore.entries()) {
      let total = sellerItems.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
      );

      if (couponCode) {
        total -= (total * coupon.discount) / 100;
      }

      if (!isPlusMember && !isShippingFeeAdded) {
        total += 5;
        isShippingFeeAdded = true;
      }

      fullAmount += parseFloat(total.toFixed(2));

      const order = await prisma.order.create({
        data: {
          userId,
          storeId,
          addressId,
          paymentMethod,
          total: parseFloat(total.toFixed(2)),
          isCouponUsed: coupon ? true : false,
          coupon: coupon ? coupon : {},
          orderItems: {
            create: sellerItems.map((item) => ({
              productId: item.id,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
      });

      orderIds.push(order.id);
    }

    // Clear the cart
    await prisma.user.update({
      where: { id: userId },
      data: {
        cart: {},
      },
    });

    return NextResponse.json({
      message: "Order Placed Successfully.",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error: error.code || error.message,
      },
      {
        status: 500,
      }
    );
  }
}

// Get all orders for user
export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    const orders = await prisma.order.findMany({
      where: {
        userId,
        OR: [
          {
            paymentMethod: PaymentMethod.COD,
          },
          {
            AND: [
              {
                paymentMethod: PaymentMethod.STRIPE,
              },
              {
                isPaid: true,
              },
            ],
          },
        ],
      },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
        address: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error: error.code || error.message,
      },
      {
        status: 500,
      }
    );
  }
}
