import imagekit from "@/config/imagekit";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Create a new store
export async function POST(request) {
  try {
    const { userId } = getAuth(request);

    // Get the data from the form
    const formData = await request.formData();

    const name = formData.get("name");
    const username = formData.get("username");
    const description = formData.get("description");
    const email = formData.get("email");
    const contact = formData.get("contact");
    const address = formData.get("address");
    const image = formData.get("image");

    if (
      !name ||
      !username ||
      !description ||
      !email ||
      !contact ||
      !address ||
      !image
    ) {
      return NextResponse.json(
        {
          error: "Missing store info",
        },
        { status: 400 }
      );
    }

    // Check if user already has a store
    const exisingStore = await prisma.store.findFirst({
      where: {
        userId,
      },
    });

    // If store is already registered then return the store status
    if (exisingStore) {
      return NextResponse.json({
        status: store.status,
      });
    }

    // Check if username is already taken
    const isUsernameTaken = await prisma.store.findUnique({
      where: {
        username: username.toLowerCase(),
      },
    });

    if (isUsernameTaken) {
      return NextResponse.json(
        { message: "Username already taken" },
        { status: 400 }
      );
    }

    // Image upload to ImageKit
    const buffer = Buffer.from(await image.arrayBuffer());
    const response = await imagekit.upload({
      file: buffer,
      fileName: image.name,
      folder: "logos",
    });

    const optimizedImage = imagekit.url({
      path: response.filePath,
      transformation: [
        {
          quality: "auto",
        },
        {
          format: "webp",
        },
        {
          width: "512",
        },
      ],
    });

    // create a new store
    const newStore = await prisma.store.create({
      data: {
        userId,
        name,
        description,
        username: username.toLowerCase(),
        email,
        contact,
        address,
        logo: optimizedImage,
      },
    });

    // link store to user
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        store: { connect: { id: newStore.id } },
      },
    });

    return NextResponse.json(
      {
        message: "Applied, waiting for approval",
      },
      { status: 201 }
    );
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

// Check is user have a registered store if yes then send status of the store
export async function GET(request) {
  try {
    const { userId } = getAuth(request);

    // Check is user have already registered store
    const store = await prisma.store.findFirst({
      where: {
        userId,
      },
    });

    // If store is already registered then send the store status
    if (store) {
      return NextResponse.json({
        status: store.status,
      });
    }

    return NextResponse.json({ status: "not registered" });
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
