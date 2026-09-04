"use client";

import { useEffect, useState } from "react";
import { ArrowUp, Share2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Input } from "../../components/ui/input";
import { Appbar } from "../components/Appbar";
import { useSession } from "next-auth/react";
import axios from "axios";

interface Video {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  votes: number;
  userVote: number; // 1 for upvote, -1 for downvote, 0 for none
  hasUpvoted: boolean;
}

const REFRESH_INTERVAL_MS = 10 * 1000;

export default function StreamView({
    creatorId,
    isCreator = false
}: {
    creatorId: string,
    isCreator?: boolean
}) {
  const { data: session } = useSession();
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [previewVideo, setPreviewVideo] = useState<Video | null>(null);
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [queue, setQueue] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function refreshStreams() {
    try {
      // Use /api/streams/my for dashboard (creator view) and /api/streams for fan view
      const endpoint = isCreator ? `/api/streams/my` : `/api/streams/?creatorId=${creatorId}`;
      console.log("Fetching from endpoint:", endpoint, "creatorId:", creatorId, "isCreator:", isCreator);
      
      const res = await axios.get(endpoint);
      const streams = res.data.streams || [];

      console.log("Fetched streams:", streams);

      // Get current user ID from streams
      if (streams.length > 0 && !currentUserId) {
        setCurrentUserId(streams[0].userId);
      }

      // Map backend streams to Video interface
      const videos: Video[] = streams.map((stream: any) => {
        // Convert YouTube URL to embed URL
        const videoId = stream.extractedId;
        const embedUrl = `https://www.youtube.com/embed/${videoId}`;

        // Backend now provides hasUpvoted directly
        const hasUpvoted = stream.hasUpvoted;

        console.log(
          `Stream ${stream.id} hasUpvoted:`,
          hasUpvoted,
          "votes:",
          stream.upvotes,
        );

        return {
          id: stream.id,
          title: stream.title,
          url: embedUrl,
          thumbnail: stream.smallImg || stream.bigImg,
          votes: stream.upvotes || 0,
          userVote: hasUpvoted ? 1 : 0,
          hasUpvoted: hasUpvoted,
        };
      });

      console.log("Mapped videos:", videos);

      // Sort by votes and set queue
      setQueue(videos.sort((a, b) => b.votes - a.votes));

      // Set first video as current if none exists
      if (videos.length > 0 && !currentVideo) {
        setCurrentVideo(videos[0]);
      }
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching streams:", error);
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // Always refresh streams for fan view, only for creator view if logged in
    if (isCreator) {
      if (session) {
        refreshStreams();
        const interval = setInterval(refreshStreams, REFRESH_INTERVAL_MS);
        return () => clearInterval(interval);
      }
    } else {
      // Fan view: always fetch streams regardless of auth
      refreshStreams();
      const interval = setInterval(refreshStreams, REFRESH_INTERVAL_MS);
      return () => clearInterval(interval);
    }
  }, [session, isCreator]);

  const extractVideoId = (url: string): string | null => {
    const regex =
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const handlePreview = async () => {
    if (!youtubeUrl) {
      alert("Please enter a YouTube URL");
      return;
    }

    try {
      const res = await axios.post(`/api/streams`, { url: youtubeUrl });
      const { title, thumbnail, extractedId } = res.data;
      
      setPreviewVideo({
        id: extractedId,
        title: title,
        url: `https://www.youtube.com/embed/${extractedId}`,
        thumbnail: thumbnail,
        votes: 0,
        userVote: 0,
        hasUpvoted: false,
      });
    } catch (error: any) {
      console.error("Error previewing video:", error);
      alert(`Failed to preview video: ${error.response?.data?.msg || error.message}`);
    }
  };

  const handleAddToQueue = async () => {
    if (!session?.user?.email) {
      alert("Please sign in to add videos");
      return;
    }

    if (previewVideo) {
      try {
        setLoading(true);

        // Add stream via backend (backend will handle user ID from session)
        await axios.post(`/api/streams`, {
          creatorId: currentUserId || session.user.email,
          url: youtubeUrl,
        });

        // Refresh streams after adding
        await refreshStreams();

        setPreviewVideo(null);
        setYoutubeUrl("");
        toast.success("Added to queue!");
      } catch (error) {
        console.error("Error adding stream:", error);
        toast.error("Failed to add video to queue");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleVote = async (videoId: string, shouldUpvote: boolean) => {
    if (!session?.user?.email) {
      toast.error("Please sign in to vote");
      return;
    }

    try {
      console.log("Voting:", { videoId, shouldUpvote });
      if (shouldUpvote) {
        const res = await axios.post(`/api/streams/upvote`, {
          streamId: videoId,
        });
        console.log("Upvote response:", res.data);
      } else {
        const res = await axios.post(`/api/streams/downvote`, {
          streamId: videoId,
        });
        console.log("Downvote response:", res.data);
      }

      await refreshStreams();
    } catch (error: any) {
      console.error("Error voting:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }
      toast.error(`Failed to vote: ${error.response?.data?.msg || error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950">
      <Appbar />

      <div className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="text-center text-white py-20">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Left Column - Upcoming Songs Queue */}
            <div className="lg:col-span-3 space-y-4">
              <h2 className="text-2xl font-bold text-white italic">
                Upcoming Songs
              </h2>

              <div className="space-y-3">
                {queue.map((video) => (
                  <div
                    key={video.id}
                    className="flex items-center gap-3 p-3 bg-slate-900/70 rounded-lg border border-slate-700/50 hover:border-purple-500/40 transition-colors"
                  >
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-16 h-12 object-cover rounded flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {video.title}
                      </p>
                      <button
                        onClick={() =>
                          handleVote(video.id, !video.hasUpvoted)
                        }
                        className={`flex items-center gap-1 mt-1 text-xs ${
                          video.hasUpvoted
                            ? "text-purple-400"
                            : "text-slate-400 hover:text-purple-400"
                        } transition-colors`}
                      >
                        <ArrowUp className="w-3 h-3" />
                        <span>{video.votes}</span>
                      </button>
                    </div>
                  </div>
                ))}

                {queue.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    No songs in queue yet. Add one!
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Add Song + Now Playing */}
            <div className="lg:col-span-2 space-y-6">
              {/* Add a song + Share */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">
                    Add a song
                  </h2>
                  {isCreator && (
                    <Button
                      size="sm"
                      onClick={() => {
                        const shareableLink = `${window.location.origin}/creator/${encodeURIComponent(creatorId)}`;
                        navigator.clipboard.writeText(shareableLink);
                        toast.success("Link copied to clipboard!");
                      }}
                      className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-1 h-7"
                    >
                      <Share2 className="w-3 h-3 mr-1" />
                      Share
                    </Button>
                  )}
                </div>
                <Input
                  placeholder="Paste YouTube link here"
                  value={youtubeUrl}
                  onChange={(e) => {
                    setYoutubeUrl(e.target.value);
                    if (previewVideo) setPreviewVideo(null);
                  }}
                  className="bg-slate-900/70 border-slate-700/50 text-white placeholder:text-slate-500 text-sm h-9"
                />

                {!previewVideo ? (
                  <Button
                    onClick={handlePreview}
                    disabled={!youtubeUrl || loading}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm h-9"
                  >
                    Preview
                  </Button>
                ) : (
                  <div className="space-y-3 p-3 bg-slate-800/50 rounded-lg border border-purple-500/20">
                    <div className="aspect-video rounded-lg overflow-hidden bg-black">
                      <iframe
                        className="w-full h-full"
                        src={previewVideo.url}
                        title="Video preview"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                    <Button
                      onClick={handleAddToQueue}
                      disabled={loading}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm h-9"
                    >
                      Add to Queue
                    </Button>
                  </div>
                )}
              </div>

              {/* Now Playing */}
              <div className="space-y-3">
                <h2 className="text-lg font-bold text-white italic">
                  Now Playing
                </h2>
                <div className="rounded-lg overflow-hidden bg-slate-900/70 border border-slate-700/50">
                  {currentVideo ? (
                    <div className="aspect-video">
                      <iframe
                        className="w-full h-full"
                        src={currentVideo.url}
                        title="Video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div className="aspect-video flex items-center justify-center text-slate-500 text-sm">
                      No video playing
                    </div>
                  )}
                </div>
                {isCreator && (
                  <Button
                    onClick={async () => {
                      try {
                        const res = await axios.get('/api/streams/next');
                        if (res.data.stream) {
                          // The endpoint returns the stream with smallImg/bigImg which might need mapping
                          const nextStream = res.data.stream;
                          setCurrentVideo({
                            id: nextStream.id,
                            title: nextStream.title,
                            url: `https://www.youtube.com/embed/${nextStream.extractedId}`,
                            thumbnail: nextStream.smallImg || nextStream.bigImg,
                            votes: 0,
                            userVote: 0,
                            hasUpvoted: false
                          });
                          toast.success("Playing next song!");
                          await refreshStreams();
                        } else {
                          toast.info("No more songs in queue");
                        }
                      } catch (error) {
                        console.error("Error playing next:", error);
                        toast.error("Failed to play next song");
                      }
                    }}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm h-9"
                  >
                    ▶ Play Next
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      <ToastContainer />
    </div>
  );
}
