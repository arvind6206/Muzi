import { NextRequest, NextResponse } from "next/server";
import {z} from 'zod'
import PrismaClient from '@/lib/db'
import prismaClient from "@/lib/db";
const YT_REGEX = new RegExp
  ("^https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}(&.*)?$");

const CreateStreamSchema = z.object({
    creatorId: z.string(),
    url: z.string()

})

export async function POST(req: NextRequest){
    try {
    const data = CreateStreamSchema.parse(await req.json())
    const isYt = YT_REGEX.test(data.url)
    if(!isYt){
        return NextResponse.json({
            msg: "Wrong URL fromat"
        }, {status: 411})
    }

    const extractedId = data.url.split("?v=")[1]


    await PrismaClient.stream.create({
      data: {
        userId: data.creatorId,
        url: data.url,
        extractedId, 
        type: "Youtube"
      }
    })
        
    } catch (error) {
        return NextResponse.json({
            msg: "Error while adding a stream"
        }, {status: 411})
    }

}


export async function GET(req: NextRequest){
    try {
        const creatorId = req.nextUrl.searchParams.get("creatorId")
        const streams = await prismaClient.stream.findMany({
            where: {
                userId: creatorId ?? ""
            }
        })

        return NextResponse.json({
            streams
        })
    } catch (error) {
        
    }
}