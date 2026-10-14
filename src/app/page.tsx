'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Sparkles, Loader2, Film, Youtube, Music2, Wand2, Send, ChevronDown,
  Lightbulb, Compass, Rocket, Brain, TrendingUp, Copy, Check,
  Hash, Zap, Clock, Eye, Heart, MessageCircle, Share2, Download,
  Settings, History, Trash2, RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ───────────────────────────────────────────────

interface Scene {
  type: string
  title: string
  durationSec: number
  background: string
  content: any
  voiceover?: string
  imagePrompt?: string
}

interface GenerateResult {
  title: string
  hook: string
  whyViral?: string
  hashtagSuggestions?: string[]
  scenes: Scene[]
}

interface HistoryItem {
  id: string
  topic: string
  result: GenerateResult
  createdAt: number
}

// ─── Content Modes (pills) ───────────────────────────────

const CONTENT_MODES = [
  { id: 'auto', label: '🤖 Auto', desc: 'AI chooses the best format', color: 'bg-white/10' },
  { id: 'quiz', label: '❓ Quiz', desc: 'Timed trivia with answer reveal', color: 'bg-rose-500/10 text-rose-400' },
  { id: 'facts', label: '💡 Facts', desc: '5-6 amazing facts, each its own scene', color: 'bg-amber-500/10 text-amber-400' },
  { id: 'guinness', label: '🏆 Guinness', desc: 'World records with record-breaking stats', color: 'bg-violet-500/10 text-violet-400' },
  { id: 'travel', label: '🌍 Travel', desc: 'World travel with maps + landmarks', color: 'bg-cyan-500/10 text-cyan-400' },
  { id: 'natgeo', label: '🦁 NatGeo', desc: 'Nature documentary style', color: 'bg-emerald-500/10 text-emerald-400' },
  { id: 'science', label: '🔬 Science', desc: 'Scientific explanations + data', color: 'bg-cyan-500/10 text-cyan-400' },
  { id: 'history', label: '📜 History', desc: 'Historical events + timeline', color: 'bg-amber-500/10 text-amber-400' },
  { id: 'health', label: '💪 Health', desc: 'Health tips, nutrition, fitness', color: 'bg-rose-500/10 text-rose-400' },
  { id: 'tech', label: '💻 Tech', desc: 'Technology explainers + gadgets', color: 'bg-violet-500/10 text-violet-400' },
  { id: 'sports', label: '⚽ Sports', desc: 'Sports records + athlete facts', color: 'bg-emerald-500/10 text-emerald-400' },
  { id: 'food', label: '🍽️ Food', desc: 'Food science + cultural cuisine', color: 'bg-orange-500/10 text-orange-400' },
  { id: 'art', label: '🎨 Art', desc: 'Art history + famous artworks', color: 'bg-rose-500/10 text-rose-400' },
  { id: 'space', label: '🚀 Space', desc: 'Space exploration + astronomy', color: 'bg-violet-500/10 text-violet-400' },
  { id: 'math', label: '📐 Math', desc: 'Math problems solved step-by-step', color: 'bg-amber-500/10 text-amber-400' },
  { id: 'music', label: '🎵 Music', desc: 'Music theory + famous composers', color: 'bg-cyan-500/10 text-cyan-400' },
] as const

// ─── Languages ──────────────────────────────────────────

const LANGUAGES = [
  { code: 'en', flag: '🇬🇧', name: 'English' },
  { code: 'am', flag: '🇪🇹', name: 'Amharic' },
  { code: 'es', flag: '🇪🇸', name: 'Spanish' },
  { code: 'fr', flag: '🇫🇷', name: 'French' },
  { code: 'zh', flag: '🇨🇳', name: 'Chinese' },
  { code: 'ar', flag: '🇸🇦', name: 'Arabic' },
  { code: 'hi', flag: '🇮🇳', name: 'Hindi' },
  { code: 'pt', flag: '🇧🇷', name: 'Portuguese' },
] as const

// ─── Resolutions ────────────────────────────────────────

const RESOLUTIONS = [
  { id: '480p', label: '480p · Fast', desc: '480×854 · smallest file' },
  { id: '720p', label: '720p · HD', desc: '720×1280 · recommended' },
  { id: '1080p', label: '1080p · Full HD', desc: '1080×1920 · best quality' },
  { id: '1440p', label: '1440p · QHD', desc: '1440×2560 · maximum' },
] as const

// ─── Tones ──────────────────────────────────────────────

const TONES = [
  { id: 'funny', label: '😄 Funny', desc: 'Light, humorous, casual' },
  { id: 'dramatic', label: '🎭 Dramatic', desc: 'Intense, suspenseful build' },
  { id: 'educational', label: '📚 Educational', desc: 'Clear, informative, neutral' },
  { id: 'inspiring', label: '✨ Inspiring', desc: 'Uplifting, motivational' },
  { id: 'shocking', label: '😱 Shocking', desc: 'Mind-blowing surprises' },
] as const

// ─── Main Component ────────────────────────────────────

export default function Home() {
  const [topic, setTopic] = useState('')
  const [mode, setMode] = useState<string>('auto')
  const [language, setLanguage] = useState<string>('en')
  const [resolution, setResolution] = useState<string>('720p')
  const [tone, setTone] = useState<string>('educational')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<GenerateResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [copiedField, setCopiedField] = useState<string | null>(null)

  // Load history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('wud-history')
      if (stored) setHistory(JSON.parse(stored))
    } catch {}
  }, [])

  // Save history to localStorage
  function saveHistory(items: HistoryItem[]) {
    setHistory(items)
    try {
      localStorage.setItem('wud-history', JSON.stringify(items.slice(0, 20)))
    } catch {}
  }

  async function generate() {
    if (!topic.trim()) return
    setLoading(true)
    setProgress(0)
    setError(null)
    setResult(null)

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + Math.random() * 15, 90))
    }, 500)

    try {
      const modeInfo = CONTENT_MODES.find((m) => m.id === mode)
      const toneInfo = TONES.find((t) => t.id === tone)

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          contentMode: mode,
          language,
          tone: toneInfo?.label?.split(' ')[1] || 'educational',
          resolution: resolution,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')

      setResult(data)
      setProgress(100)

      // Add to history
      const item: HistoryItem = {
        id: `h-${Date.now()}`,
        topic: topic.trim(),
        result: data,
        createdAt: Date.now(),
      }
      saveHistory([item, ...history].slice(0, 20))
    } catch (e: any) {
      setError(e.message)
    } finally {
      clearInterval(progressInterval)
      setLoading(false)
      setTimeout(() => setProgress(0), 1000)
    }
  }

  function copyToClipboard(text: string, field: string) {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    toast.success('Copied!')
    setTimeout(() => setCopiedField(null), 2000)
  }

  function clearHistory() {
    saveHistory([])
    toast.success('History cleared')
  }

  function loadFromHistory(item: HistoryItem) {
    setTopic(item.topic)
    setResult(item.result)
    toast.success(`Loaded: ${item.result.title}`)
  }

  function deleteHistoryItem(id: string) {
    saveHistory(history.filter((h) => h.id !== id))
  }

  const selectedMode = CONTENT_MODES.find((m) => m.id === mode)
  const selectedLang = LANGUAGES.find((l) => l.code === language)
  const selectedRes = RESOLUTIONS.find((r) => r.id === resolution)
  const selectedTone = TONES.find((t) => t.id === tone)
  const totalDuration = result?.scenes?.reduce((a, s) => a + s.durationSec, 0) || 0

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ═══ Header ═══ */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 via-rose-400 to-violet-500 shadow-lg">
              <Wand2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Wud Animation Studio</h1>
              <p className="text-xs text-muted-foreground">Autonomous video generator · YouTube + TikTok</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* History Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <History className="h-4 w-4" />
                  <span className="hidden sm:inline">History</span>
                  {history.length > 0 && (
                    <Badge variant="secondary" className="ml-0.5 h-5 px-1.5 text-xs">
                      {history.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Recent Generations</span>
                  {history.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearHistory} className="h-7 text-xs text-destructive hover:text-destructive">
                      <Trash2 className="h-3 w-3 mr-1" /> Clear
                    </Button>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {history.length === 0 ? (
                  <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                    No history yet
                  </div>
                ) : (
                  <ScrollArea className="h-72">
                    {history.map((h) => (
                      <div key={h.id} className="flex items-start gap-2 px-2 py-1.5 hover:bg-accent rounded-md group">
                        <button
                          onClick={() => loadFromHistory(h)}
                          className="flex-1 text-left min-w-0"
                        >
                          <div className="text-sm font-semibold truncate">{h.result.title}</div>
                          <div className="text-xs text-muted-foreground truncate">{h.topic}</div>
                        </button>
                        <button
                          onClick={() => deleteHistoryItem(h.id)}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity shrink-0"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </ScrollArea>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Settings Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Settings</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Video Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* Language Selector */}
                <div className="px-2 py-1.5">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Language</label>
                  <div className="grid grid-cols-2 gap-1">
                    {LANGUAGES.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => setLanguage(l.code)}
                        className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                          language === l.code ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                        }`}
                      >
                        <span>{l.flag}</span>
                        {l.name}
                      </button>
                    ))}
                  </div>
                </div>

                <DropdownMenuSeparator />

                {/* Resolution Selector */}
                <div className="px-2 py-1.5">
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Resolution</label>
                  <div className="space-y-1">
                    {RESOLUTIONS.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => setResolution(r.id)}
                        className={`w-full flex items-center justify-between rounded-md px-2 py-1.5 text-xs transition-colors ${
                          resolution === r.id ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                        }`}
                      >
                        <span className="font-medium">{r.label}</span>
                        <span className={resolution === r.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}>{r.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Post Button */}
            <Button size="sm" className="gap-1.5 bg-gradient-to-r from-amber-500 via-rose-400 to-violet-500 text-white">
              <Send className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Post</span>
            </Button>
          </div>
        </div>
      </header>

      {/* ═══ Main ═══ */}
      <main className="flex-1 container mx-auto px-4 py-6 max-w-4xl">
        <div className="space-y-6">
          {/* ─── Hero ─── */}
          <div className="text-center space-y-2 pt-2">
            <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-amber-500 via-rose-400 to-violet-500 bg-clip-text text-transparent">
              Generate Videos From One Topic
            </h2>
            <p className="text-muted-foreground text-sm">
              Type a topic, pick your mode, and let AI do the rest — script, images, voice, captions.
            </p>
          </div>

          {/* ─── Content Mode Pills ─── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Content Mode</label>
              {selectedMode && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="text-xs cursor-help">{selectedMode.label}</Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">{selectedMode.desc}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CONTENT_MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all border ${
                    mode === m.id
                      ? `border-primary bg-primary/10 ${m.color}`
                      : 'border-transparent bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* ─── Tone Pills ─── */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Tone</label>
            <div className="flex flex-wrap gap-1.5">
              {TONES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTone(t.id)}
                  className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all border ${
                    tone === t.id
                      ? 'border-primary bg-primary/10'
                      : 'border-transparent bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* ─── Topic Input + Generate ─── */}
          <div className="space-y-3">
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && generate()}
              placeholder="Type your topic... e.g. '5 amazing facts about Ethiopia' or 'Why is the sky blue?'"
              className="h-14 text-base"
            />
            <Button
              onClick={generate}
              disabled={loading || !topic.trim()}
              className="w-full h-14 text-base font-bold bg-gradient-to-r from-amber-500 via-rose-400 to-violet-500 text-white hover:opacity-90"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Generating... {progress > 0 && `${Math.round(progress)}%`}
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Generate Video (1 Click)
                </>
              )}
            </Button>
          </div>

          {/* ─── Progress Bar ─── */}
          {loading && (
            <div className="space-y-1">
              <Progress value={progress} className="h-1.5" />
              <p className="text-xs text-center text-muted-foreground">
                {progress < 30 ? 'Researching topic...' : progress < 60 ? 'Writing script...' : progress < 90 ? 'Generating scenes...' : 'Finalizing...'}
              </p>
            </div>
          )}

          {/* ─── Error ─── */}
          {error && (
            <Card className="p-4 border-destructive/30 bg-destructive/5">
              <div className="flex items-start gap-2">
                <span className="text-destructive text-sm">⚠️ {error}</span>
              </div>
            </Card>
          )}

          {/* ─── Result ─── */}
          {result && (
            <Tabs defaultValue="outline" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="outline" className="gap-1.5">
                  <Film className="h-3.5 w-3.5" /> Outline
                </TabsTrigger>
                <TabsTrigger value="script" className="gap-1.5">
                  <Brain className="h-3.5 w-3.5" /> Script
                </TabsTrigger>
                <TabsTrigger value="post" className="gap-1.5">
                  <Send className="h-3.5 w-3.5" /> Post
                </TabsTrigger>
              </TabsList>

              {/* ─── Tab: Outline ─── */}
              <TabsContent value="outline" className="space-y-4 mt-4">
                <Card className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold">{result.title}</h3>
                      {result.hook && (
                        <p className="text-sm italic text-amber-500 mt-1">"{result.hook}"</p>
                      )}
                      {result.whyViral && (
                        <p className="text-xs text-muted-foreground mt-2">Why viral: {result.whyViral}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {totalDuration}s
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Film className="h-3 w-3 mr-1" />
                        {result.scenes?.length || 0} scenes
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {selectedRes?.label}
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  {/* Scenes */}
                  <div className="space-y-2">
                    {result.scenes?.map((s, i) => (
                      <div key={i} className="flex items-start gap-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors">
                        <span className="font-mono text-sm text-muted-foreground min-w-6 pt-0.5">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="text-xs uppercase font-bold">
                              {s.type?.replace('-', ' ') || 'scene'}
                            </Badge>
                            <Badge variant="outline" className="text-xs">{s.background}</Badge>
                            <span className="text-xs text-muted-foreground">{s.durationSec}s</span>
                          </div>
                          <p className="text-sm font-medium truncate">{s.title}</p>
                          {s.voiceover && (
                            <p className="text-xs text-muted-foreground mt-1 italic">🎙️ {s.voiceover}</p>
                          )}
                        </div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => copyToClipboard(JSON.stringify(s, null, 2), `scene-${i}`)}
                                className="text-muted-foreground hover:text-foreground shrink-0 pt-0.5"
                              >
                                {copiedField === `scene-${i}` ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Copy scene JSON</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Hashtags */}
                  {result.hashtagSuggestions && result.hashtagSuggestions.length > 0 && (
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                        <Hash className="h-3 w-3" /> Hashtags
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {result.hashtagSuggestions.map((tag, i) => (
                          <button
                            key={i}
                            onClick={() => copyToClipboard(tag, `tag-${i}`)}
                            className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                          >
                            {copiedField === `tag-${i}` ? '✓ ' : ''}{tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(JSON.stringify(result, null, 2), 'json')}>
                      {copiedField === 'json' ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                      Copy JSON
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(result.title, 'title')}>
                      {copiedField === 'title' ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                      Copy Title
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(result.hook, 'hook')}>
                      {copiedField === 'hook' ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                      Copy Hook
                    </Button>
                  </div>
                </Card>
              </TabsContent>

              {/* ─── Tab: Script ─── */}
              <TabsContent value="script" className="mt-4">
                <Card className="p-6">
                  <h3 className="text-base font-bold mb-3">Voiceover Script</h3>
                  <ScrollArea className="h-96 rounded-lg border p-4">
                    <div className="space-y-4">
                      {result.scenes?.map((s, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, '0')}</span>
                            <Badge variant="secondary" className="text-xs">{s.type?.replace('-', ' ')}</Badge>
                            <span className="text-xs text-muted-foreground">{s.durationSec}s</span>
                          </div>
                          <p className="text-sm pl-8">
                            {s.voiceover || s.title}
                          </p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </Card>
              </TabsContent>

              {/* ─── Tab: Post ─── */}
              <TabsContent value="post" className="mt-4">
                <Card className="p-6 space-y-4">
                  <h3 className="text-base font-bold">Post to Platforms</h3>

                  {/* Title field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Title</label>
                    <Input value={result.title} readOnly className="text-sm" />
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Description</label>
                    <textarea
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm min-h-80px resize-y"
                      defaultValue={`${result.hook}\n\n${result.whyViral || ''}\n\n${result.hashtagSuggestions?.join(' ') || ''}`}
                    />
                  </div>

                  {/* Platform buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button className="bg-rose-500 hover:bg-rose-500/90 text-white">
                      <Youtube className="h-4 w-4 mr-2" />
                      Post to YouTube
                    </Button>
                    <Button className="bg-cyan-500 hover:bg-cyan-500/90 text-white">
                      <Music2 className="h-4 w-4 mr-2" />
                      Post to TikTok
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground text-center">
                    Connect your accounts in Settings to enable auto-posting.
                  </p>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          {/* ─── Features ─── */}
          {!result && !loading && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
              {[
                { icon: Sparkles, label: 'AI Script', desc: 'Auto-written from your topic' },
                { icon: Film, label: 'AI Images', desc: 'Generated per scene' },
                { icon: Youtube, label: 'AI Voice', desc: 'TTS narration in 8 languages' },
                { icon: TrendingUp, label: 'AI Hashtags', desc: 'Optimized for reach' },
              ].map((f, i) => (
                <Card key={i} className="p-4 text-center">
                  <f.icon className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <div className="text-sm font-semibold">{f.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{f.desc}</div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ═══ Footer ═══ */}
      <footer className="border-t bg-card/30 mt-auto">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>Wud Animation Studio · Powered by Z.ai</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span>{selectedLang?.flag}</span> {selectedLang?.name}
            </span>
            <span>{selectedRes?.label.split(' ')[0]}</span>
            <span className="capitalize">{selectedTone?.label.split(' ')[1]}</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
