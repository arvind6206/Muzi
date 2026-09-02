"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "../../components/ui/button";

export function Appbar() {
  const session = useSession();
  return (
    <div className="border-b border-purple-500/20 bg-slate-950/50 backdrop-blur">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Muzi
        </div>
        <div>
          {session.data?.user ? (
            <Button
              variant="outline"
              className="border-purple-500 text-purple-300 hover:bg-purple-500/10"
              onClick={() => signOut()}
            >
              Logout
            </Button>
          ) : (
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => signIn()}
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
