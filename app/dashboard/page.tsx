"use client";

import { useSession } from "next-auth/react";
import StreamView from "../components/StreamView";

export default function Dashboard() {
  const { data: session } = useSession();
  const creatorId = session?.user?.email || "";
  
  return <StreamView creatorId={creatorId} isCreator={true}/>
}
