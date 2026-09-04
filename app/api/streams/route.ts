import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prismaClient from "@/lib/db";
import youtubesearchapi from 'youtube-search-api'
import { getServerSession } from "next-auth";

const YT_REGEX =
  /^(?:(?:https?:)?\/\/)?(?:www\.)?(?:m\.)?(?:youtu(?:be)?\.com\/(?:v\/|embed\/|watch(?:\/|\?v=))|youtu\.be\/)((?:\w|-){11})(?:\S+)?$/;

const CreateStreamSchema = z.object({
  creatorId: z.string(),
  url: z.string(),
});

const PreviewStreamSchema = z.object({
  url: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Check if this is a preview request (no creatorId)
    if (!body.creatorId && body.url) {
      const data = PreviewStreamSchema.parse(body);
      
      const isYt = data.url.match(YT_REGEX);

      if (!isYt) {
        return NextResponse.json(
          {
            msg: "Wrong URL format",
          },
          { status: 411 }
        );
      }

      // Extract YouTube video ID
      const extractedId = isYt[1];

      const res = await youtubesearchapi.GetVideoDetails(extractedId)

      const thumbnails = res.thumbnail.thumbnails
      thumbnails.sort((a: {width: number}, b: {width: number}) => a.width < b.width ? -1 : 1)

      return NextResponse.json({
        title: res.title ?? "Can't find",
        thumbnail: (thumbnails.length > 1 ? thumbnails[thumbnails.length - 2].url : thumbnails[thumbnails.length - 1].url) ?? "https://imgs.search.brave.com/gLH5Au-TgJmgV1wUTDMsxAE1QN72OVStsJhB4gbGdj8/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9jZG4u/cGl4YWJheS5jb20v/cGhvdG8vMjAxNC8w/NS8wNy8wNi80NC9j/YXQtMzM5NDAwXzY0/MC5qcGc",
        extractedId,
      });
    }

    // Otherwise, create stream
    const data = CreateStreamSchema.parse(body);

    const isYt = data.url.match(YT_REGEX);

    if (!isYt) {
      return NextResponse.json(
        {
          msg: "Wrong URL format",
        },
        { status: 411 }
      );
    }

    // Get user by email to get actual user ID
    const session = await getServerSession();
    const user = await prismaClient.user.findFirst({
      where: {
        email: session?.user?.email ?? ""
      }
    });

    if (!user) {
      return NextResponse.json(
        {
          msg: "User not found",
        },
        { status: 403 }
      );
    }

    // Extract YouTube video ID
    const extractedId = isYt[1];

    const res = await youtubesearchapi.GetVideoDetails(extractedId)

    const thumbnails = res.thumbnail.thumbnails
    thumbnails.sort((a: {width: number}, b: {width: number}) => a.width < b.width ? -1 : 1)

    const stream = await prismaClient.stream.create({
      data: {
        userId: user.id,
        url: data.url,
        extractedId,
        type: "Youtube",
        title: res.title ?? "Can't find",
        smallImg: (thumbnails.length > 1 ? thumbnails[thumbnails.length - 2].url : thumbnails[thumbnails.length - 1].url) ?? "https://imgs.search.brave.com/gLH5Au-TgJmgV1wUTDMsxAE1QN72OVStsJhB4gbGdj8/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9jZG4u/cGl4YWJheS5jb20v/cGhvdG8vMjAxNC8w/NS8wNy8wNi80NC9j/YXQtMzM5NDAwXzY0/MC5qcGc",
        bigImg: thumbnails[thumbnails.length - 1].url ?? "https://imgs.search.brave.com/gLH5Au-TgJmgV1wUTDMsxAE1QN72OVStsJhB4gbGdj8/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9jZG4u/cGl4YWJheS5jb20v/cGhvdG8vMjAxNC8w/NS8wNy8wNi80NC9j/YXQtMzM5NDAwXzY0/MC5qcGc"
      },
    })

    return NextResponse.json({
      msg: "Added stream",
      id: stream.id,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        msg: "Error while processing request",
      },
      { status: 411 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const creatorId = req.nextUrl.searchParams.get("creatorId");
    console.log("GET /api/streams with creatorId:", creatorId);
    
    if(!creatorId){
      return NextResponse.json({
        msg: "Error"
      }, {status: 411})
    }

    const session = await getServerSession();
    const user = await prismaClient.user.findFirst({
      where: {
        email: session?.user?.email ?? ""
      }
    });

    // Check if creatorId is an email, if so find the user by email
    let targetUserId = creatorId;
    if (creatorId.includes('@')) {
      const creator = await prismaClient.user.findFirst({
        where: {
          email: creatorId
        }
      });
      if (creator) {
        targetUserId = creator.id;
      }
    }

    console.log("User:", user?.id, "CreatorId:", creatorId, "TargetUserId:", targetUserId);

    const [streams, activeStream] = await Promise.all([await prismaClient.stream.findMany({
            where: {
                userId: targetUserId,
                active: true
            },
            include: {
                _count: {
                    select: {
                        upvotes: true
                    }
                },
                upvotes: user ? {
                    where: {
                        userId: user.id
                    }
                } : false
            }
        }), prismaClient.currentStream.findFirst({
          where: {
            userId: creatorId
          },
          include: {
            stream: true
          }
        })])
        console.log("Found streams:", streams.length);
        
        return NextResponse.json({
            streams: streams.map(({_count, upvotes, ...rest}) => ({
                ...rest,
                upvotes: _count.upvotes,
                hasUpvoted: user ? (upvotes?.length > 0 || false) : false
            })),
            activeStream
        })
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        msg: "Error while fetching streams",
      },
      { status: 500 }
    );
  }
}

