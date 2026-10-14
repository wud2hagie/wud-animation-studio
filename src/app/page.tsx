'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sparkles, Loader2, Film, Youtube, Music2, Wand2, Send } from 'lucide-react'

export default function Home() {
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  async function generate() {
    if (!topic.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setResult(data)
    } catch (e: any) {
      setResult({ error: e.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 via-rose-400 to-violet-500">
              <Wand2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Wud Animation Studio</h1>
              <p className="text-xs text-muted-foreground">Autonomous video generator</p>
            </div>
          </div>
          <Button size="sm" variant="outline" className="gap-1.5">
            <Send className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Post</span>
          </Button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl space-y-8">
          {/* Hero */}
          <div className="text-center space-y-3">
            <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-amber-500 via-rose-400 to-violet-500 bg-clip-text text-transparent">
              Generate Videos From One Topic
            </h2>
            <p className="text-muted-foreground">
              Type a topic. Get a fully-rendered educational video with AI script, voiceover, images, and captions.
            </p>
          </div>

          {/* Input */}
          <div className="space-y-3">
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && generate()}
              placeholder="e.g. 5 amazing facts about Ethiopia"
              className="h-14 text-base"
            />
            <Button
              onClick={generate}
              disabled={loading || !topic.trim()}
              className="w-full h-14 text-base font-bold bg-gradient-to-r from-amber-500 via-rose-400 to-violet-500 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Generate Video
                </>
              )}
            </Button>
          </div>

          {/* Error */}
          {result?.error && (
            <Card className="p-4 border-destructive/30 bg-destructive/5">
              <p className="text-sm text-destructive">{result.error}</p>
            </Card>
          )}

          {/* Result */}
          {result?.title && (
            <Card className="p-6 space-y-4">
              <div>
                <h3 className="text-xl font-bold">{result.title}</h3>
                {result.hook && (
                  <p className="text-sm italic text-amber-500 mt-1">"{result.hook}"</p>
                )}
              </div>
              {result.scenes && result.scenes.length > 0 && (
                <div className="space-y-2">
                  {result.scenes.map((s: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
                      <span className="font-mono text-sm text-muted-foreground w-6">{String(i + 1).padStart(2, '0')}</span>
                      <span className="text-xs font-bold uppercase text-violet-500 w-20">{s.type?.replace('-', ' ') || 'scene'}</span>
                      <span className="text-sm flex-1 truncate">{s.title}</span>
                      <span className="text-xs text-muted-foreground">{s.durationSec}s</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 pt-4">
            {[
              { icon: Film, title: 'AI Script', desc: 'Auto-written' },
              { icon: Sparkles, title: 'AI Images', desc: 'Per scene' },
              { icon: Youtube, title: 'AI Voice', desc: 'TTS narration' },
            ].map((f, i) => (
              <Card key={i} className="p-4 text-center">
                <f.icon className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <div className="text-sm font-semibold">{f.title}</div>
                <div className="text-xs text-muted-foreground">{f.desc}</div>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
