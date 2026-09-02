import { Appbar } from "./components/Appbar";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Redirect } from "./components/Redirect";

export default function Home(){

  return(
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950">
      <Appbar/>
      <Redirect/>
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <Badge className="mb-4 bg-purple-500/20 text-purple-300 border-purple-500/30">
          🎵 Interactive Music Streaming
        </Badge>
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
          Let Your Fans<br/>Choose the Beat
        </h1>
        <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
          Connect with your audience like never before. Creators can let fans vote on what music plays during their streams in real-time.
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white px-8">
            Start as Creator
          </Button>
          <Button size="lg" variant="outline" className="border-purple-500 text-purple-300 hover:bg-purple-500/10 px-8">
            Join as Fan
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
          How It Works
        </h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="bg-slate-900/50 border-purple-500/20 backdrop-blur">
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
                <span className="text-2xl">🎤</span>
              </div>
              <CardTitle className="text-white">Create Your Stream</CardTitle>
              <CardDescription className="text-slate-400">
                Set up your stream and add music from YouTube or Spotify that your fans can vote on.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-slate-900/50 border-purple-500/20 backdrop-blur">
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
                <span className="text-2xl">🗳️</span>
              </div>
              <CardTitle className="text-white">Fans Vote Live</CardTitle>
              <CardDescription className="text-slate-400">
                Your audience upvotes their favorite tracks. The most voted songs get priority in the queue.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-slate-900/50 border-purple-500/20 backdrop-blur">
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
                <span className="text-2xl">🎧</span>
              </div>
              <CardTitle className="text-white">Stream Together</CardTitle>
              <CardDescription className="text-slate-400">
                Play the top-voted music during your stream. Real-time engagement like never before.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* For Creators Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-purple-500/30 backdrop-blur">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl text-white mb-2">For Creators</CardTitle>
              <CardDescription className="text-slate-300 text-lg">
                Boost engagement and give your community a voice
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-purple-400">✓</span>
                <p className="text-slate-300">Increase viewer engagement with interactive voting</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-purple-400">✓</span>
                <p className="text-slate-300">Discover what music your audience actually loves</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-purple-400">✓</span>
                <p className="text-slate-300">Build stronger community connections</p>
              </div>
              <div className="flex justify-center mt-6">
                <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white">
                  Get Started Free
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* For Fans Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-blue-500/30 backdrop-blur">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl text-white mb-2">For Fans</CardTitle>
              <CardDescription className="text-slate-300 text-lg">
                Influence the soundtrack of your favorite creators
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-blue-400">✓</span>
                <p className="text-slate-300">Vote on songs you want to hear live</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-400">✓</span>
                <p className="text-slate-300">Support your favorite creators</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-400">✓</span>
                <p className="text-slate-300">Be part of the stream experience</p>
              </div>
              <div className="flex justify-center mt-6">
                <Button size="lg" variant="outline" className="border-blue-500 text-blue-300 hover:bg-blue-500/10">
                  Find Creators
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-4xl font-bold text-white mb-4">
          Ready to Transform Your Streams?
        </h2>
        <p className="text-xl text-slate-300 mb-8">
          Join thousands of creators and fans already using Muzi
        </p>
        <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-12 text-lg">
          Sign Up Now
        </Button>
      </section>
    </div>
  )
}