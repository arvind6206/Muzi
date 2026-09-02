"use client";

import { useEffect, useState } from "react";
import { ArrowUp, ArrowDown, Share2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
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

export default function Dashboard() {
  const { data: session } = useSession();
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [previewVideo, setPreviewVideo] = useState<Video | null>(null);
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [queue, setQueue] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  async function refreshStreams() {
    try {
      const res = await axios.get(`/api/streams/my`);
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
    } catch (error) {
      console.error("Error fetching streams:", error);
    }
  }

  useEffect(() => {
    if (session) {
      refreshStreams();
      const interval = setInterval(refreshStreams, REFRESH_INTERVAL_MS);
      return () => clearInterval(interval);
    }
  }, [session]);

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
      } catch (error) {
        console.error("Error adding stream:", error);
        alert("Failed to add video to queue");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleVote = async (videoId: string, shouldUpvote: boolean) => {
    if (!session?.user?.email) {
      alert("Please sign in to vote");
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
      alert(`Failed to vote: ${error.response?.data?.msg || error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950">
      <Appbar />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-white">Stream Dashboard</h1>
          <Button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert("Link copied to clipboard!");
            }}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Current Player & Input */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Video Player */}
            <Card className="bg-slate-900/50 border-purple-500/20 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                  Now Playing
                </CardTitle>
                <CardDescription className="text-slate-400">
                  {currentVideo ? currentVideo.title : "No video playing"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentVideo ? (
                  <div className="aspect-video rounded-lg overflow-hidden bg-black">
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
                  <div className="aspect-video rounded-lg bg-slate-800 flex items-center justify-center text-slate-500">
                    <p>Add a video to start the stream</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* YouTube Input & Preview */}
            <Card className="bg-slate-900/50 border-purple-500/20 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white">Add to Queue</CardTitle>
                <CardDescription className="text-slate-400">
                  Paste a YouTube link to suggest a song
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    className="bg-slate-800 border-purple-500/30 text-white placeholder:text-slate-500"
                  />
                  <Button
                    onClick={handlePreview}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Preview
                  </Button>
                </div>

                {previewVideo && (
                  <div className="space-y-4 p-4 bg-slate-800/50 rounded-lg border border-purple-500/20">
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
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      Add to Queue
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Queue */}
          <div className="space-y-6">
            <Card className="bg-slate-900/50 border-purple-500/20 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  Up Next
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                    {queue.length} songs
                  </Badge>
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Sorted by votes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {queue.map((video, index) => (
                  <div
                    key={video.id}
                    className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg border border-purple-500/10 hover:border-purple-500/30 transition-colors"
                  >
                    <div className="text-2xl font-bold text-purple-400 min-w-[2rem]">
                      #{index + 1}
                    </div>
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-24 h-16 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {video.title}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          size="sm"
                          variant={video.hasUpvoted ? "default" : "outline"}
                          className={`h-8 px-2 ${
                            video.hasUpvoted
                              ? "bg-green-600 hover:bg-green-700 border-green-600"
                              : "border-red-600/50 text-red-400 hover:bg-red-600/10"
                          }`}
                          onClick={() =>
                            handleVote(video.id, !video.hasUpvoted)
                          }
                        >
                          {video.hasUpvoted ? (
                            <ArrowUp className="w-4 h-4" />
                          ) : (
                            <ArrowDown className="w-4 h-4" />
                          )}
                        </Button>
                        <span className="text-white font-semibold min-w-[2rem]">
                          {video.votes}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {queue.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    No songs in queue yet. Add one!
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
