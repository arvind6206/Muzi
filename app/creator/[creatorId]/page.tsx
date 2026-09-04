"use client";

import { useParams } from "next/navigation";
import StreamView from "@/app/components/StreamView";

export default function CreatorPage() {
  const params = useParams<{ creatorId: string }>();
  const creatorId = decodeURIComponent(params.creatorId);

  return <StreamView creatorId={creatorId} isCreator={false} />;
}
