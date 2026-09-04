import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prismaClient from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { msg: "Unauthenticated" },
        { status: 403 }
      );
    }

    const user = await prismaClient.user.findFirst({
      where: {
        email: session.user.email
      }
    });

    if (!user) {
      return NextResponse.json(
        { msg: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      userId: user.id,
      email: user.email
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { msg: "Error fetching user" },
      { status: 500 }
    );
  }
}
