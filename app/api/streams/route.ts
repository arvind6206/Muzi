import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prismaClient from "@/lib/db";
import youtubesearchapi from 'youtube-search-api'

const YT_REGEX =
  /^(?:(?:https?:)?\/\/)?(?:www\.)?(?:m\.)?(?:youtu(?:be)?\.com\/(?:v\/|embed\/|watch(?:\/|\?v=))|youtu\.be\/)((?:\w|-){11})(?:\S+)?$/;

const CreateStreamSchema = z.object({
  creatorId: z.string(),
  url: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const data = CreateStreamSchema.parse(await req.json());

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

    const stream = await prismaClient.stream.create({
      data: {
        userId: data.creatorId,
        url: data.url,
        extractedId,
        type: "Youtube",
        title: res.title ?? "Can't find",
        smallImg: (thumbnails.length > 1 ? thumbnails[thumbnails.length - 2].url : thumbnails[thumbnails.length - 1].url) ?? "https://imgs.search.brave.com/gLH5Au-TgJmgV1wUTDMsxAE1QN72OVStsJhB4gbGdj8/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9jZG4u/cGl4YWJheS5jb20v/cGhvdG8vMjAxNC8w/NS8wNy8wNi80NC9j/YXQtMzM5NDAwXzY0/MC5qcGc",
        bigImg: thumbnails[thumbnails.length - 1].url ?? "https://imgs.search.brave.com/gLH5Au-TgJmgV1wUTDMsxAE1QN72OVStsJhB4gbGdj8/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9jZG4u/cGl4YWJheS5jb20v/cGhvdG8vMjAxNC8w/NS8wNy8wNi80NC9j/YXQtMzM5NDAwXzY0/MC5qcGc"
      },
    });

    return NextResponse.json({
      msg: "Added stream",
      id: stream.id,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        msg: "Error while adding a stream",
      },
      { status: 411 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const creatorId = req.nextUrl.searchParams.get("creatorId");

    const streams = await prismaClient.stream.findMany({
      where: {
        userId: creatorId ?? "",
      },
    });

    return NextResponse.json({
      streams,
    });
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

