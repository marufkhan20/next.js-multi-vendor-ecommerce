import imagekit from "@/config/imagekit";
import authSeller from "@/middlewares/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Create new product
export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const storeId = await authSeller(userId);

    if (!storeId) {
      return NextResponse.json(
        {
          error: "not authorized",
        },
        { status: 401 }
      );
    }

    // Get the data from the request
    const formData = await request.formData();
    const name = formData.get("name");
    const description = formData.get("description");
    const mrp = Number(formData.get("mrp"));
    const price = Number(formData.get("price"));
    const category = formData.get("category");
    const images = formData.getAll("images");

    if (
      !name ||
      !description ||
      !mrp ||
      !price ||
      !category ||
      images.length === 0
    ) {
      return NextResponse.json(
        {
          error: "Missing product details",
        },
        { status: 400 }
      );
    }

    // Upload images to ImageKit
    const imagesUrls = await Promise.all(
      images.map(async (image) => {
        const buffer = Buffer.from(await image.arrayBuffer());

        const response = await imagekit.upload({
          file: buffer,
          fileName: `${Date.now()}-${image.name}`,
          folder: "/products",
        });

        const url = imagekit.url({
          path: response.filePath,
          transformation: [
            { quality: "auto" },
            { format: "webp" },
            { width: "1024" },
          ],
        });

        return url;
      })
    );

    // Insert product into the database
    await prisma.product.create({
      data: {
        name,
        description,
        mrp,
        price,
        category,
        images: imagesUrls,
        storeId,
      },
    });

    return NextResponse.json(
      {
        message: "Product created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error: error.code || error.message,
      },
      { status: 500 }
    );
  }
}

// Get all products of a seller
export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    const storeId = await authSeller(userId);

    if (!storeId) {
      return NextResponse.json(
        {
          error: "not authorized",
        },
        { status: 401 }
      );
    }

    const products = await prisma.product.findMany({
      where: {
        storeId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ products }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error: error.code || error.message,
      },
      { status: 500 }
    );
  }
}
