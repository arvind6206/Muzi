import prismaClient from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest){
    try {
        const session = await getServerSession()

        const user = await prismaClient.user.findFirst({
            where: {
                email: session?.user?.email ?? ""
            }
        })

        if(!user){
            return NextResponse.json({
                msg: "Unauthenticated"
            }, {status: 403})
        }

        const mostUpvotedStream = await prismaClient.stream.findFirst({
            where: {
                userId: user.id,
                active: true
            },
            orderBy: {
                upvotes: {
                    _count: 'desc'
                }
            }
        })

        if (!mostUpvotedStream) {
            return NextResponse.json({
                msg: "No streams found"
            }, {status: 404})
        }

        await Promise.all([
            prismaClient.currentStream.upsert({
                where: {
                    userId: user.id
                },
                update: {
                    streamId: mostUpvotedStream.id
                },
                create: {
                    userId: user.id,
                    streamId: mostUpvotedStream.id
                }
            }), 
            prismaClient.stream.update({
                where: {
                    id: mostUpvotedStream.id
                },
                data: {
                    active: false
                }
            })
        ])

        return NextResponse.json({
            stream: mostUpvotedStream
        })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ msg: "Internal server error" }, { status: 500 })
    }
}