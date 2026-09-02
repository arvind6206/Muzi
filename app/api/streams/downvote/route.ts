import prismaClient from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const UpvoteSchema = z.object({
  streamId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        {
          msg: "Unauthenticated",
        },
        { status: 403 },
      );
    }
    const user = await prismaClient.user.findFirst({
      where: {
        email: session?.user?.email ?? "",
      },
    });

    if (!user) {
      return NextResponse.json({ msg: "User not found" }, { status: 404 });
    }

    const data = UpvoteSchema.parse(await req.json());
    
    // Check if already upvoted (we don't have downvote in schema, so we remove upvote)
    const existingUpvote = await prismaClient.upvote.findUnique({
      where: {
        userId_streamId: {
          userId: user.id,
          streamId: data.streamId,
        }
      }
    });

    if (existingUpvote) {
      // Remove upvote (acting as downvote toggle)
      await prismaClient.upvote.delete({
        where: {
          userId_streamId: {
            userId: user.id,
            streamId: data.streamId,
          }
        },
      });
      return NextResponse.json({ msg: "Downvoted" });
    } else {
      return NextResponse.json({ msg: "Already not upvoted" });
    }
  } catch (error) {
    return NextResponse.json(
      {
        msg: "Error while upvoting",
      },
      { status: 403 },
    );
  }
}

