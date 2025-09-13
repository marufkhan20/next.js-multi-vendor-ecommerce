import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Update user cart
export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const { cart } = await request.json();

    // Save the cart to the user object
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        cart,
      },
    });

    return NextResponse.json({
      message: "Cart updated",
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

// Get User Cart
export async function GET(request) {
  try {
    const { userId } = getAuth(request);

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    return NextResponse.json({
      cart: user.cart,
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
