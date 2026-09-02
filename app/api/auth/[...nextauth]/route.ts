import prismaClient from "@/lib/db"
import NextAuth from "next-auth"
import GoogleProvider from 'next-auth/providers/google'
import { NextResponse } from "next/server"

const handler = NextAuth({
  providers: [
    GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID ?? "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET?? ""
    })
  ],
  secret: process.env.NEXTAUTH_SECRET ?? "secret",
  callbacks: {
    async signIn(params){
      if(!params.user.email){
        return false;
      }
      console.log(params)
      try {
        await prismaClient.user.create({
          data: {
            email: params.user.email,
            provider: "Google"
          }
      })
      } catch (error) {
        // User already exists, that's fine
        console.log("User already exists or error:", error)
      }
      return true
    }
  }
})

export { handler as GET, handler as POST }