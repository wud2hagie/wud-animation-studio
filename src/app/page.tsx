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
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
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
  Settings, History, Trash2, RefreshCw, FileJson, FileText, Captions,
  FileCode, User, Globe, Monitor, Palette, CheckCircle2,
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

// ─── Content Modes ───────────────────────────────────────

const CONTENT_MODES = [
  { id: 'auto', label: '🤖 Auto', desc: 'AI chooses the best format' },
  { id: 'quiz', label: '❓ Quiz', desc: 'Timed trivia with answer reveal' },
  { id: 'facts', label: '💡 Facts', desc: '5-6 amazing facts, each its own scene' },
  { id: 'guinness', label: '🏆 Guinness', desc: 'World records with record-breaking stats' },
  { id: 'travel', label: '🌍 Travel', desc: 'World travel with maps + landmarks' },
  { id: 'natgeo', label: '🦁 NatGeo', desc: 'Nature documentary style' },
  { id: 'science', label: '🔬 Science', desc: 'Scientific explanations + data' },
  { id: 'history', label: '📜 History', desc: 'Historical events + timeline' },
  { id: 'health', label: '💪 Health', desc: 'Health tips, nutrition, fitness' },
  { id: 'tech', label: '💻 Tech', desc: 'Technology explainers + gadgets' },
  { id: 'sports', label: '⚽ Sports', desc: 'Sports records + athlete facts' },
  { id: 'food', label: '🍽️ Food', desc: 'Food science + cultural cuisine' },
  { id: 'art', label: '🎨 Art', desc: 'Art history + famous artworks' },
  { id: 'space', label: '🚀 Space', desc: 'Space exploration + astronomy' },
  { id: 'math', label: '📐 Math', desc: 'Math problems solved step-by-step' },
  { id: 'music', label: '🎵 Music', desc: 'Music theory + famous composers' },
] as const

// ─── Tones ──────────────────────────────────────────────

const TONES = [
  { id: 'funny', label: '😄 Funny', desc: 'Light, humorous, casual' },
  { id: 'dramatic', label: '🎭 Dramatic', desc: 'Intense, suspenseful build' },
  { id: 'educational', label: '📚 Educational', desc: 'Clear, informative, neutral' },
  { id: 'inspiring', label: '✨ Inspiring', desc: 'Uplifting, motivational' },
  { id: 'shocking', label: '😱 Shocking', desc: 'Mind-blowing surprises' },
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

  useEffect(() => {
    try {
      const stored = localStorage.getItem('wud-history')
      if (stored) setHistory(JSON.parse(stored))
    } catch {}
  }, [])

  function saveHistory(items: HistoryItem[]) {
    setHistory(items)
    try { localStorage.setItem('wud-history', JSON.stringify(items.slice(0, 20))) } catch {}
  }

  async function generate() {
    if (!topic.trim()) return
    setLoading(true)
    setProgress(0)
    setError(null)
    setResult(null)
    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + Math.random() * 15, 90))
    }, 500)
    try {
      const toneInfo = TONES.find((t) => t.id === tone)
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(), contentMode: mode, language,
          tone: toneInfo?.label?.split(' ')[1] || 'educational', resolution,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setResult(data)
      setProgress(100)
      const item: HistoryItem = { id: `h-${Date.now()}`, topic: topic.trim(), result: data, createdAt: Date.now() }
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

  function downloadFile(content: string, filename: string, mimeType = 'application/json') {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success(`Downloaded: ${filename}`)
  }

  function safeName() { return (result?.title || 'wud_video').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() }

  function downloadJSON() {
    if (!result) return
    downloadFile(JSON.stringify(result, null, 2), `${safeName()}.json`)
  }

  function downloadScript() {
    if (!result?.scenes) return
    let script = `# ${result.title}\n# Hook: ${result.hook}\n# Duration: ${totalDuration}s · ${result.scenes.length} scenes\n\n---\n\n`
    result.scenes.forEach((s, i) => {
      script += `## Scene ${String(i + 1).padStart(2, '0')}: ${s.title}\nType: ${s.type} | Background: ${s.background} | Duration: ${s.durationSec}s\n\n`
      if (s.voiceover) script += `[VOICEOVER]\n${s.voiceover}\n\n`
      if (s.imagePrompt) script += `[IMAGE PROMPT]\n${s.imagePrompt}\n\n---\n\n`
    })
    if (result.hashtagSuggestions?.length) script += `## Hashtags\n${result.hashtagSuggestions.join(' ')}\n\n`
    if (result.whyViral) script += `## Why Viral\n${result.whyViral}\n`
    downloadFile(script, `${safeName()}_script.txt`, 'text/plain')
  }

  function downloadSRT() {
    if (!result?.scenes) return
    let srt = ''
    let offset = 0
    result.scenes.forEach((s, i) => {
      const fmt = (t: number) => {
        const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), sec = Math.floor(t % 60), ms = Math.floor((t % 1) * 1000)
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')},${String(ms).padStart(3, '0')}`
      }
      srt += `${i + 1}\n${fmt(offset)} --> ${fmt(offset + s.durationSec)}\n${s.voiceover || s.title}\n\n`
      offset += s.durationSec
    })
    downloadFile(srt, `${safeName()}.srt`, 'text/plain')
  }

  function downloadMarkdown() {
    if (!result) return
    let md = `# ${result.title}\n\n> ${result.hook}\n\n`
    if (result.whyViral) md += `**Why viral:** ${result.whyViral}\n\n`
    md += `## Scenes (${totalDuration}s · ${result.scenes.length} scenes)\n\n`
    result.scenes.forEach((s, i) => {
      md += `### ${String(i + 1).padStart(2, '0')}. ${s.title}\n- **Type:** ${s.type}\n- **Background:** ${s.background}\n- **Duration:** ${s.durationSec}s\n`
      if (s.voiceover) md += `- **Voiceover:** ${s.voiceover}\n`
      if (s.imagePrompt) md += `- **Image:** ${s.imagePrompt}\n\n`
    })
    if (result.hashtagSuggestions?.length) md += `\n## Hashtags\n\n${result.hashtagSuggestions.map((t) => `\`${t}\``).join(' ')}\n`
    downloadFile(md, `${safeName()}.md`, 'text/markdown')
  }

  function clearHistory() { saveHistory([]); toast.success('History cleared') }
  function deleteHistoryItem(id: string) { saveHistory(history.filter((h) => h.id !== id)) }
  function loadFromHistory(item: HistoryItem) { setTopic(item.topic); setResult(item.result); toast.success(`Loaded: ${item.result.title}`) }

  const selectedMode = CONTENT_MODES.find((m) => m.id === mode)
  const selectedLang = LANGUAGES.find((l) => l.code === language)
  const selectedRes = RESOLUTIONS.find((r) => r.id === resolution)
  const selectedTone = TONES.find((t) => t.id === tone)
  const totalDuration = result?.scenes?.reduce((a, s) => a + s.durationSec, 0) || 0
  const hasResult = !!result

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ═══ Header with Menu Bar ═══ */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="container mx-auto px-4">
          {/* Top row: Logo + Post */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 via-rose-400 to-violet-500 shadow-lg">
                <Wand2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-bold">Wud Animation Studio</h1>
                <p className="text-[10px] text-muted-foreground">Autonomous video generator</p>
              </div>
            </div>
          </div>

          {/* Menu bar row */}
          <div className="flex items-center gap-1 pb-2 overflow-x-auto">
            {/* ─── Content Mode ─── */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5 shrink-0">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Mode:</span>
                  <span className="font-bold">{selectedMode?.label.split(' ')[1]}</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64">
                <DropdownMenuLabel>Content Mode</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {CONTENT_MODES.map((m) => (
                  <DropdownMenuItem key={m.id} onClick={() => setMode(m.id)} className="gap-2 cursor-pointer">
                    <span className="text-base">{m.label.split(' ')[0]}</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium flex items-center gap-1.5">
                        {m.label.split(' ')[1]}
                        {mode === m.id && <Check className="h-3.5 w-3.5 text-primary" />}
                      </div>
                      <div className="text-xs text-muted-foreground">{m.desc}</div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* ─── Tone ─── */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5 shrink-0">
                  <Palette className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Tone:</span>
                  <span className="font-bold">{selectedTone?.label.split(' ')[1]}</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Tone</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {TONES.map((t) => (
                  <DropdownMenuItem key={t.id} onClick={() => setTone(t.id)} className="gap-2 cursor-pointer">
                    <span className="text-base">{t.label.split(' ')[0]}</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium flex items-center gap-1.5">
                        {t.label.split(' ')[1]}
                        {tone === t.id && <Check className="h-3.5 w-3.5 text-primary" />}
                      </div>
                      <div className="text-xs text-muted-foreground">{t.desc}</div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* ─── History ─── */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5 shrink-0">
                  <History className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">History</span>
                  {history.length > 0 && <Badge variant="secondary" className="h-4 px-1 text-[10px]">{history.length}</Badge>}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Recent Generations</span>
                  {history.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearHistory} className="h-6 text-xs text-destructive hover:text-destructive">
                      <Trash2 className="h-3 w-3 mr-1" /> Clear All
                    </Button>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {history.length === 0 ? (
                  <div className="px-2 py-4 text-center text-sm text-muted-foreground">No history yet</div>
                ) : (
                  <ScrollArea className="h-72">
                    {history.map((h) => (
                      <div key={h.id} className="flex items-start gap-2 px-2 py-1.5 hover:bg-accent rounded-md group">
                        <button onClick={() => loadFromHistory(h)} className="flex-1 text-left min-w-0">
                          <div className="text-sm font-semibold truncate">{h.result.title}</div>
                          <div className="text-xs text-muted-foreground truncate">{h.topic}</div>
                        </button>
                        <button onClick={() => deleteHistoryItem(h.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity shrink-0">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </ScrollArea>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* ─── Settings ─── */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5 shrink-0">
                  <Settings className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Settings</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72">
                <DropdownMenuLabel>Account & Preferences</DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* Profile section */}
                <div className="px-2 py-1.5">
                  <div className="flex items-center gap-2 rounded-md border p-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 via-rose-400 to-violet-500">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">Admin User</div>
                      <div className="text-xs text-muted-foreground">admin@wud.studio</div>
                    </div>
                  </div>
                </div>

                <DropdownMenuSeparator />

                {/* Language */}
                <div className="px-2 py-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-muted-foreground mb-1.5">
                    <Globe className="h-3 w-3" /> Language
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {LANGUAGES.map((l) => (
                      <button key={l.code} onClick={() => setLanguage(l.code)}
                        className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${language === l.code ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}>
                        <span>{l.flag}</span> {l.name}
                        {language === l.code && <Check className="h-3 w-3 ml-auto" />}
                      </button>
                    ))}
                  </div>
                </div>

                <DropdownMenuSeparator />

                {/* Resolution */}
                <div className="px-2 py-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-muted-foreground mb-1.5">
                    <Monitor className="h-3 w-3" /> Resolution
                  </div>
                  <div className="space-y-1">
                    {RESOLUTIONS.map((r) => (
                      <button key={r.id} onClick={() => setResolution(r.id)}
                        className={`w-full flex items-center justify-between rounded-md px-2 py-1.5 text-xs transition-colors ${resolution === r.id ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}>
                        <span className="font-medium">{r.label}</span>
                        {resolution === r.id && <Check className="h-3 w-3" />}
                      </button>
                    ))}
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* ─── Download ─── */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5 shrink-0" disabled={!hasResult}>
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Download</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Download As</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={downloadJSON} className="gap-2 cursor-pointer">
                  <FileJson className="h-4 w-4 text-amber-500" />
                  <div>
                    <div className="text-sm font-medium">JSON</div>
                    <div className="text-xs text-muted-foreground">Full structured outline</div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={downloadScript} className="gap-2 cursor-pointer">
                  <FileText className="h-4 w-4 text-rose-400" />
                  <div>
                    <div className="text-sm font-medium">Script (.txt)</div>
                    <div className="text-xs text-muted-foreground">Formatted voiceover script</div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={downloadSRT} className="gap-2 cursor-pointer">
                  <Captions className="h-4 w-4 text-cyan-500" />
                  <div>
                    <div className="text-sm font-medium">Subtitles (.srt)</div>
                    <div className="text-xs text-muted-foreground">For YouTube/TikTok upload</div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={downloadMarkdown} className="gap-2 cursor-pointer">
                  <FileCode className="h-4 w-4 text-violet-500" />
                  <div>
                    <div className="text-sm font-medium">Markdown (.md)</div>
                    <div className="text-xs text-muted-foreground">Documentation format</div>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* ─── Post ─── */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="gap-1.5 shrink-0 bg-gradient-to-r from-amber-500 via-rose-400 to-violet-500 text-white" disabled={!hasResult}>
                  <Send className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Post</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Post to Platform</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => toast.info('YouTube posting coming soon')}>
                  <Youtube className="h-4 w-4 text-rose-500" />
                  <div>
                    <div className="text-sm font-medium">Post to YouTube</div>
                    <div className="text-xs text-muted-foreground">Shorts · auto-upload with title + description</div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => toast.info('TikTok posting coming soon')}>
                  <Music2 className="h-4 w-4 text-cyan-500" />
                  <div>
                    <div className="text-sm font-medium">Post to TikTok</div>
                    <div className="text-xs text-muted-foreground">Auto-upload with caption + hashtags</div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => toast.info('Posting to both platforms coming soon')}>
                  <Send className="h-4 w-4 text-violet-500" />
                  <div>
                    <div className="text-sm font-medium">Post to Both</div>
                    <div className="text-xs text-muted-foreground">YouTube + TikTok simultaneously</div>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          </div>
        </div>
      </header>

      {/* ═══ Main ═══ */}
      <main className="flex-1 container mx-auto px-4 py-6 max-w-4xl">
        <div className="space-y-6">
          {/* Hero */}
          <div className="text-center space-y-2 pt-2">
            <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-amber-500 via-rose-400 to-violet-500 bg-clip-text text-transparent">
              Generate Videos From One Topic
            </h2>
            <p className="text-muted-foreground text-sm">
              Type a topic, pick your mode from the menu bar, and let AI do the rest.
            </p>
          </div>

          {/* Topic Input + Generate */}
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
                <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Generating... {progress > 0 && `${Math.round(progress)}%`}</>
              ) : (
                <><Sparkles className="h-5 w-5 mr-2" />Generate Video (1 Click)</>
              )}
            </Button>
          </div>

          {/* Progress */}
          {loading && (
            <div className="space-y-1">
              <Progress value={progress} className="h-1.5" />
              <p className="text-xs text-center text-muted-foreground">
                {progress < 30 ? 'Researching topic...' : progress < 60 ? 'Writing script...' : progress < 90 ? 'Generating scenes...' : 'Finalizing...'}
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <Card className="p-4 border-destructive/30 bg-destructive/5">
              <span className="text-destructive text-sm">⚠️ {error}</span>
            </Card>
          )}

          {/* Result */}
          {result && (
            <Tabs defaultValue="outline" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="outline" className="gap-1.5"><Film className="h-3.5 w-3.5" /> Outline</TabsTrigger>
                <TabsTrigger value="script" className="gap-1.5"><Brain className="h-3.5 w-3.5" /> Script</TabsTrigger>
                <TabsTrigger value="info" className="gap-1.5"><TrendingUp className="h-3.5 w-3.5" /> Info</TabsTrigger>
              </TabsList>

              {/* Outline Tab */}
              <TabsContent value="outline" className="space-y-4 mt-4">
                <Card className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold">{result.title}</h3>
                      {result.hook && <p className="text-sm italic text-amber-500 mt-1">"{result.hook}"</p>}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge variant="outline" className="text-xs"><Clock className="h-3 w-3 mr-1" />{totalDuration}s</Badge>
                      <Badge variant="outline" className="text-xs"><Film className="h-3 w-3 mr-1" />{result.scenes?.length || 0} scenes</Badge>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    {result.scenes?.map((s, i) => (
                      <div key={i} className="flex items-start gap-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors">
                        <span className="font-mono text-sm text-muted-foreground min-w-6 pt-0.5">{String(i + 1).padStart(2, '0')}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="text-xs uppercase font-bold">{s.type?.replace('-', ' ') || 'scene'}</Badge>
                            <Badge variant="outline" className="text-xs">{s.background}</Badge>
                            <span className="text-xs text-muted-foreground">{s.durationSec}s</span>
                          </div>
                          <p className="text-sm font-medium truncate">{s.title}</p>
                          {s.voiceover && <p className="text-xs text-muted-foreground mt-1 italic">🎙️ {s.voiceover}</p>}
                        </div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button onClick={() => copyToClipboard(JSON.stringify(s, null, 2), `scene-${i}`)} className="text-muted-foreground hover:text-foreground shrink-0 pt-0.5">
                                {copiedField === `scene-${i}` ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Copy scene JSON</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    ))}
                  </div>
                  {result.hashtagSuggestions && result.hashtagSuggestions.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                          <Hash className="h-3 w-3" /> Hashtags (click to copy)
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {result.hashtagSuggestions.map((tag, i) => (
                            <button key={i} onClick={() => copyToClipboard(tag, `tag-${i}`)} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors">
                              {copiedField === `tag-${i}` ? '✓ ' : ''}{tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                  <Separator />
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(JSON.stringify(result, null, 2), 'json')}>
                      {copiedField === 'json' ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />} Copy JSON
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(result.title, 'title')}>
                      {copiedField === 'title' ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />} Copy Title
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(result.hook, 'hook')}>
                      {copiedField === 'hook' ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />} Copy Hook
                    </Button>
                  </div>
                </Card>
              </TabsContent>

              {/* Script Tab */}
              <TabsContent value="script" className="mt-4">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-bold">Voiceover Script</h3>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => copyToClipboard(result.scenes.map((s, i) => `${String(i + 1).padStart(2, '0')}. [${s.durationSec}s] ${s.voiceover || s.title}`).join('\n\n'), 'script')}>
                        {copiedField === 'script' ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />} Copy
                      </Button>
                    </div>
                  </div>
                  <ScrollArea className="h-96 rounded-lg border p-4">
                    <div className="space-y-4">
                      {result.scenes?.map((s, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, '0')}</span>
                            <Badge variant="secondary" className="text-xs">{s.type?.replace('-', ' ')}</Badge>
                            <span className="text-xs text-muted-foreground">{s.durationSec}s</span>
                          </div>
                          <p className="text-sm pl-8">{s.voiceover || s.title}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </Card>
              </TabsContent>

              {/* Info Tab */}
              <TabsContent value="info" className="mt-4">
                <Card className="p-6 space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-base font-bold">Video Details</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-muted-foreground">Title:</span> {result.title}</div>
                      <div><span className="text-muted-foreground">Duration:</span> {totalDuration}s</div>
                      <div><span className="text-muted-foreground">Scenes:</span> {result.scenes?.length || 0}</div>
                      <div><span className="text-muted-foreground">Resolution:</span> {selectedRes?.label}</div>
                      <div><span className="text-muted-foreground">Language:</span> {selectedLang?.flag} {selectedLang?.name}</div>
                      <div><span className="text-muted-foreground">Tone:</span> {selectedTone?.label}</div>
                    </div>
                  </div>
                  {result.whyViral && (
                    <>
                      <Separator />
                      <div className="space-y-1">
                        <div className="text-xs font-bold uppercase text-muted-foreground">Why Viral</div>
                        <p className="text-sm">{result.whyViral}</p>
                      </div>
                    </>
                  )}
                  {result.hashtagSuggestions && result.hashtagSuggestions.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-1">
                        <div className="text-xs font-bold uppercase text-muted-foreground">Hashtags</div>
                        <p className="text-sm font-mono">{result.hashtagSuggestions.join(' ')}</p>
                      </div>
                    </>
                  )}
                </Card>
              </TabsContent>
            </Tabs>
          )}

          {/* Features */}
          {!result && !loading && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
              {[
                { icon: Sparkles, label: 'AI Script', desc: 'Auto-written from your topic' },
                { icon: Film, label: 'AI Images', desc: 'Generated per scene' },
                { icon: Youtube, label: 'AI Voice', desc: 'TTS in 8 languages' },
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

      {/* Footer */}
      <footer className="border-t bg-card/30 mt-auto">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>Wud Animation Studio · Powered by Z.ai</span>
          <div className="flex items-center gap-3">
            <span>{selectedLang?.flag} {selectedLang?.name}</span>
            <span>{selectedRes?.label.split(' ')[0]}</span>
            <span className="capitalize">{selectedTone?.label.split(' ')[1]}</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
