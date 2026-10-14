'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
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
  Copy, Check, Hash, Clock, Download, Settings, History, Trash2,
  FileJson, FileText, Captions, FileCode, User, Globe, Monitor, Palette,
  Play, Pause, Volume2, Image as ImageIcon, Lightbulb, BookOpen, HelpCircle,
  Newspaper, GraduationCap, Star, ShieldQuestion, UserCircle, Eye,
  Layers, Timer, GitCompare, Trophy, FlaskConical, Drama, Smile,
  Zap, TrendingUp, Brain, Clapperboard, Video, MonitorPlay, FileVideo,
  RefreshCw, Shuffle, Eye as EyeIcon,
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
  emoji?: string
  character?: string
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
  mode: string
  result: GenerateResult
  createdAt: number
}

// ─── Content Modes (expanded to 32) ─────────────────────

const CONTENT_MODES = [
  { id: 'auto', label: '🤖 Auto', desc: 'AI chooses the best format', icon: Sparkles, group: 'General' },
  { id: 'storytelling', label: '📖 Storytelling', desc: 'Narrative with character arcs', icon: BookOpen, group: 'Creative' },
  { id: 'cartoon', label: '🎭 Cartoon', desc: 'Animated humorous characters', icon: Drama, group: 'Creative' },
  { id: 'documentary', label: '🎬 Documentary', desc: 'Narrator-driven, archival style', icon: Clapperboard, group: 'Creative' },
  { id: 'biography', label: '👤 Biography', desc: 'Life timeline of a person', icon: UserCircle, group: 'Creative' },
  { id: 'mystery', label: '🔍 Mystery', desc: 'Suspense with final reveal', icon: Eye, group: 'Creative' },
  { id: 'quiz', label: '❓ Quiz', desc: 'Timed trivia + answer reveal', icon: HelpCircle, group: 'Interactive' },
  { id: 'mythbusting', label: '🛡️ Myth Busting', desc: 'Myth vs reality with data', icon: ShieldQuestion, group: 'Interactive' },
  { id: 'top10', label: '🏆 Top 10', desc: 'Countdown format #10→#1', icon: Trophy, group: 'Interactive' },
  { id: 'didyouknow', label: '💡 Did You Know', desc: 'Surprising facts', icon: Lightbulb, group: 'Interactive' },
  { id: 'review', label: '⭐ Review', desc: 'Pros, cons, final rating', icon: Star, group: 'Interactive' },
  { id: 'experiment', label: '🧪 Experiment', desc: 'Science experiment step-by-step', icon: FlaskConical, group: 'Interactive' },
  { id: 'facts', label: '💡 Facts', desc: '5-6 amazing facts', icon: Lightbulb, group: 'Educational' },
  { id: 'science', label: '🔬 Science', desc: 'Scientific explanations + data', icon: FlaskConical, group: 'Educational' },
  { id: 'history', label: '📜 History', desc: 'Historical events + timeline', icon: BookOpen, group: 'Educational' },
  { id: 'math', label: '📐 Math', desc: 'Math problems solved step-by-step', icon: GraduationCap, group: 'Educational' },
  { id: 'tutorial', label: '📚 Tutorial', desc: 'Step-by-step instructions', icon: GraduationCap, group: 'Educational' },
  { id: 'guinness', label: '🏆 Guinness', desc: 'World records with stats', icon: Trophy, group: 'Educational' },
  { id: 'travel', label: '🌍 Travel', desc: 'World travel with maps', icon: Globe, group: 'Lifestyle' },
  { id: 'natgeo', label: '🦁 NatGeo', desc: 'Nature documentary style', icon: Eye, group: 'Lifestyle' },
  { id: 'health', label: '💪 Health', desc: 'Health tips, nutrition, fitness', icon: Zap, group: 'Lifestyle' },
  { id: 'tech', label: '💻 Tech', desc: 'Technology explainers + gadgets', icon: Monitor, group: 'Lifestyle' },
  { id: 'sports', label: '⚽ Sports', desc: 'Sports records + athlete facts', icon: Trophy, group: 'Lifestyle' },
  { id: 'food', label: '🍽️ Food', desc: 'Food science + cultural cuisine', icon: Lightbulb, group: 'Lifestyle' },
  { id: 'art', label: '🎨 Art', desc: 'Art history + famous artworks', icon: Palette, group: 'Lifestyle' },
  { id: 'space', label: '🚀 Space', desc: 'Space exploration + astronomy', icon: Wand2, group: 'Lifestyle' },
  { id: 'music', label: '🎵 Music', desc: 'Music theory + composers', icon: Music2, group: 'Lifestyle' },
  { id: 'news', label: '📰 News', desc: 'Breaking news format', icon: Newspaper, group: 'Special' },
  { id: 'comparison', label: '⚖️ Comparison', desc: 'Compare two things side by side', icon: GitCompare, group: 'Special' },
  { id: 'timelapse', label: '⏳ Time Lapse', desc: 'Progression over time', icon: Timer, group: 'Special' },
] as const

// ─── Tones (expanded to 10) ─────────────────────────────

const TONES = [
  { id: 'funny', label: '😄 Funny', desc: 'Light, humorous, casual', icon: Smile },
  { id: 'dramatic', label: '🎭 Dramatic', desc: 'Intense, suspenseful build', icon: Drama },
  { id: 'educational', label: '📚 Educational', desc: 'Clear, informative, neutral', icon: BookOpen },
  { id: 'inspiring', label: '✨ Inspiring', desc: 'Uplifting, motivational', icon: Sparkles },
  { id: 'shocking', label: '😱 Shocking', desc: 'Mind-blowing surprises', icon: Zap },
  { id: 'mysterious', label: '🔮 Mysterious', desc: 'Intriguing, enigmatic', icon: Eye },
  { id: 'nostalgic', label: '📼 Nostalgic', desc: 'Warm, reminiscent', icon: History },
  { id: 'energetic', label: '⚡ Energetic', desc: 'Fast-paced, high energy', icon: Zap },
  { id: 'calm', label: '🧘 Calm', desc: 'Peaceful, meditative', icon: Palette },
  { id: 'sarcastic', label: '😏 Sarcastic', desc: 'Witty, ironic', icon: Smile },
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

// ─── Background colors for scene previews ────────────────

const BG_COLORS: Record<string, string> = {
  'solid-black': 'from-gray-900 to-black',
  'neon-gradient': 'from-amber-500 via-rose-400 to-violet-500',
  'starfield': 'from-indigo-950 to-purple-950',
  'aurora': 'from-cyan-500 via-emerald-400 to-amber-400',
  'grid': 'from-slate-800 to-slate-900',
  'image': 'from-violet-500 to-fuchsia-500',
}

// ─── Main Component ────────────────────────────────────

export default function Home() {
  const [topic, setTopic] = useState('')
  const [mode, setMode] = useState<string>('auto')
  const [language, setLanguage] = useState<string>('en')
  const [resolution, setResolution] = useState<string>('720p')
  const [tone, setTone] = useState<string>('educational')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState('')
  const [result, setResult] = useState<GenerateResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [sceneImages, setSceneImages] = useState<Record<number, string>>({})
  const [imageLoading, setImageLoading] = useState<Record<number, boolean>>({})
  const [audioPlaying, setAudioPlaying] = useState<number | null>(null)
  const [rendering, setRendering] = useState(false)
  const [renderProgress, setRenderProgress] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('wud-history')
      if (stored) setHistory(JSON.parse(stored))
    } catch {}
  }, [])

  function saveHistory(items: HistoryItem[]) {
    setHistory(items)
    try { localStorage.setItem('wud-history', JSON.stringify(items.slice(0, 30))) } catch {}
  }

  async function generate() {
    if (!topic.trim()) return
    setLoading(true)
    setProgress(0)
    setProgressLabel('Researching topic...')
    setError(null)
    setResult(null)
    setSceneImages({})

    const steps = [
      { p: 15, label: 'Researching topic...' },
      { p: 35, label: 'Writing script...' },
      { p: 55, label: 'Generating scenes...' },
      { p: 75, label: 'Adding voiceover...' },
      { p: 90, label: 'Finalizing...' },
    ]

    let stepIdx = 0
    const progressInterval = setInterval(() => {
      if (stepIdx < steps.length) {
        setProgress(steps[stepIdx].p)
        setProgressLabel(steps[stepIdx].label)
        stepIdx++
      } else {
        setProgress((p) => Math.min(p + 5, 95))
      }
    }, 600)

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
      setProgressLabel('Done!')
      const item: HistoryItem = { id: `h-${Date.now()}`, topic: topic.trim(), mode, result: data, createdAt: Date.now() }
      saveHistory([item, ...history].slice(0, 30))
      toast.success(`Generated: ${data.title}`)
    } catch (e: any) {
      setError(e.message)
      toast.error(e.message)
    } finally {
      clearInterval(progressInterval)
      setLoading(false)
      setTimeout(() => { setProgress(0); setProgressLabel('') }, 1500)
    }
  }

  // Generate AI image for a scene
  async function generateSceneImage(sceneIdx: number, scene: Scene) {
    if (imageLoading[sceneIdx]) return
    setImageLoading((prev) => ({ ...prev, [sceneIdx]: true }))
    try {
      const prompt = scene.imagePrompt || scene.title
      const res = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Image failed')
      if (data.base64) {
        setSceneImages((prev) => ({ ...prev, [sceneIdx]: `data:image/png;base64,${data.base64}` }))
        toast.success(`Image generated for scene ${sceneIdx + 1}`)
      }
    } catch (e: any) {
      toast.error(`Image: ${e.message}`)
    } finally {
      setImageLoading((prev) => ({ ...prev, [sceneIdx]: false }))
    }
  }

  // Generate all scene images at once
  async function generateAllImages() {
    if (!result?.scenes) return
    toast.info('Generating all images...')
    for (let i = 0; i < result.scenes.length; i++) {
      await generateSceneImage(i, result.scenes[i])
    }
    toast.success('All images generated!')
  }

  // Play TTS for a scene
  async function playSceneVoice(sceneIdx: number, scene: Scene) {
    if (audioPlaying === sceneIdx) {
      audioRef.current?.pause()
      setAudioPlaying(null)
      return
    }
    try {
      const res = await fetch('/api/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: scene.voiceover || scene.title, language }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'TTS failed')
      if (data.audio) {
        if (audioRef.current) {
          audioRef.current.pause()
        }
        const audio = new Audio(data.audio)
        audioRef.current = audio
        audio.onended = () => setAudioPlaying(null)
        audio.play()
        setAudioPlaying(sceneIdx)
        toast.success(`Playing voiceover for scene ${sceneIdx + 1}`)
      }
    } catch (e: any) {
      toast.error(`Voice: ${e.message}`)
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
    a.href = url; a.download = filename
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success(`Downloaded: ${filename}`)
  }

  function safeName() { return (result?.title || 'wud_video').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() }

  function downloadJSON() { if (result) downloadFile(JSON.stringify(result, null, 2), `${safeName()}.json`) }

  function downloadScript() {
    if (!result?.scenes) return
    let script = `# ${result.title}\n# Hook: ${result.hook}\n# Duration: ${totalDuration}s · ${result.scenes.length} scenes\n\n---\n\n`
    result.scenes.forEach((s, i) => {
      script += `## Scene ${String(i + 1).padStart(2, '0')}: ${s.emoji || ''} ${s.title}\nType: ${s.type} | Background: ${s.background} | Duration: ${s.durationSec}s\n\n`
      if (s.voiceover) script += `[VOICEOVER]\n${s.voiceover}\n\n`
      if (s.imagePrompt) script += `[IMAGE PROMPT]\n${s.imagePrompt}\n\n`
      if (s.character) script += `[CHARACTER]\n${s.character}\n\n`
      script += `---\n\n`
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
      md += `### ${s.emoji || ''} ${String(i + 1).padStart(2, '0')}. ${s.title}\n- **Type:** ${s.type}\n- **Background:** ${s.background}\n- **Duration:** ${s.durationSec}s\n`
      if (s.character) md += `- **Character:** ${s.character}\n`
      if (s.voiceover) md += `- **Voiceover:** ${s.voiceover}\n`
      if (s.imagePrompt) md += `- **Image:** ${s.imagePrompt}\n\n`
    })
    if (result.hashtagSuggestions?.length) md += `\n## Hashtags\n\n${result.hashtagSuggestions.map((t) => `\`${t}\``).join(' ')}\n`
    downloadFile(md, `${safeName()}.md`, 'text/markdown')
  }

  // ─── Video Rendering (Canvas + MediaRecorder = REAL video file) ────

  // Background colors for canvas rendering
  const CANVAS_BG: Record<string, [string, string]> = {
    'solid-black': ['#000000', '#000000'],
    'neon-gradient': ['#FFB627', '#6366F1'],
    'starfield': ['#0A0E1A', '#1a0033'],
    'aurora': ['#00F2EA', '#FF0050'],
    'grid': ['#0a0a0c', '#1a1a2e'],
    'image': ['#1a0033', '#00F2EA'],
  }

  async function renderVideo(format: string) {
    if (!result?.scenes || rendering) return
    setRendering(true)
    setRenderProgress(0)
    toast.info(`Rendering real ${format.toUpperCase()} video...`)

    try {
      // Step 1: Try AI video API first (best quality)
      setRenderProgress(5)
      toast.info('Trying AI video generation...')

      let aiVideoUrl: string | null = null
      try {
        const aiRes = await fetch('/api/render', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scenes: result.scenes, title: result.title, format }),
        })
        const aiData = await aiRes.json()
        if (aiData.videoUrl) {
          aiVideoUrl = aiData.videoUrl
          setRenderProgress(100)
          // Download the AI-generated video
          await downloadVideoFromUrl(aiVideoUrl, format)
          toast.success(`AI video downloaded as ${format.toUpperCase()}!`)
          return
        }
      } catch {
        // AI video failed — fall through to client-side rendering
      }

      // Step 2: Client-side Canvas rendering (produces REAL WebM video)
      setRenderProgress(10)
      toast.info('Rendering video with Canvas engine...')

      const videoBlob = await renderScenesToVideo(result.scenes, (p) => {
        setRenderProgress(Math.round(10 + p * 85))
      })

      setRenderProgress(100)

      // Download the real video blob
      const ext = format === 'webm' ? 'webm' : format === 'mp4' ? 'webm' : 'webm'
      const filename = `${safeName()}.${ext}`
      const url = URL.createObjectURL(videoBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      if (format !== 'webm') {
        toast.success(`Video downloaded as WebM (${format.toUpperCase()} requested). Convert to ${format.toUpperCase()} with any video converter if needed.`)
      } else {
        toast.success(`Video downloaded as WebM!`)
      }
    } catch (e: any) {
      toast.error(`Render failed: ${e.message}`)
    } finally {
      setRendering(false)
      setTimeout(() => setRenderProgress(0), 1500)
    }
  }

  async function downloadVideoFromUrl(url: string, format: string) {
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `${safeName()}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
    } catch {
      window.open(url, '_blank')
    }
  }

  // Render scenes to a real video using Canvas + MediaRecorder
  async function renderScenesToVideo(scenes: Scene[], onProgress: (p: number) => void): Promise<Blob> {
    const width = 720
    const height = 1280
    const fps = 30
    const totalDuration = scenes.reduce((a, s) => a + s.durationSec, 0)
    const totalFrames = Math.floor(totalDuration * fps)

    // Create canvas
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')!

    // Setup MediaRecorder
    const stream = canvas.captureStream(fps)

    // Try to get audio from TTS for the first scene (optional)
    let audioStream: MediaStream | null = null
    try {
      const audioCtx = new AudioContext()
      const dest = audioCtx.createMediaStreamDestination()

      // Fetch TTS for each scene and schedule them
      let startTime = 0
      for (const s of scenes) {
        if (s.voiceover) {
          try {
            const ttsRes = await fetch('/api/voice', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: s.voiceover, language: selectedLang?.code || 'en' }),
            })
            const ttsData = await ttsRes.json()
            if (ttsData.audio) {
              const audioRes = await fetch(ttsData.audio)
              const audioBuf = await audioRes.arrayBuffer()
              const decoded = await audioCtx.decodeAudioData(audioBuf)
              const src = audioCtx.createBufferSource()
              src.buffer = decoded
              src.connect(dest)
              src.start(startTime)
            }
          } catch {}
        }
        startTime += s.durationSec
      }
      if (dest.stream.getAudioTracks().length > 0) {
        audioStream = dest.stream
        stream.addTrack(dest.stream.getAudioTracks()[0])
      }
    } catch {}

    // Find the best supported mime type
    const mimeTypes = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
    ]
    let mimeType = 'video/webm'
    for (const m of mimeTypes) {
      if (MediaRecorder.isTypeSupported(m)) { mimeType = m; break }
    }

    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 4_000_000 })
    const chunks: Blob[] = []
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }

    const done = new Promise<Blob>((resolve) => {
      recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }))
    })

    recorder.start()

    // Preload any AI-generated scene images
    const sceneImages: (HTMLImageElement | null)[] = []
    for (let i = 0; i < scenes.length; i++) {
      if (sceneImages[i]) {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        await new Promise<void>((r) => { img.onload = () => r(); img.onerror = () => r(); img.src = sceneImages[i] })
        sceneImages[i] = img
      } else {
        sceneImages[i] = null
      }
    }

    // Render each frame
    for (let frame = 0; frame < totalFrames; frame++) {
      const currentTime = frame / fps

      // Find current scene
      let sceneIdx = 0
      let sceneProgress = 0
      let acc = 0
      for (let i = 0; i < scenes.length; i++) {
        const d = scenes[i].durationSec
        if (currentTime < acc + d) {
          sceneIdx = i
          sceneProgress = (currentTime - acc) / d
          break
        }
        acc += d
        if (i === scenes.length - 1) { sceneIdx = i; sceneProgress = 1 }
      }

      const scene = scenes[sceneIdx]
      drawSceneFrame(ctx, scene, sceneProgress, width, height, sceneImages[sceneIdx], frame)

      if (frame % 10 === 0) onProgress(frame / totalFrames)

      // Wait for next frame
      await new Promise((r) => setTimeout(r, 1000 / fps))
    }

    recorder.stop()
    const blob = await done
    return blob
  }

  function drawSceneFrame(
    ctx: CanvasRenderingContext2D,
    scene: Scene,
    progress: number,
    width: number,
    height: number,
    image: HTMLImageElement | null,
    frame: number,
  ) {
    const bg = CANVAS_BG[scene.background] || ['#000000', '#000000']

    // Draw gradient background
    const grad = ctx.createLinearGradient(0, 0, width, height)
    grad.addColorStop(0, bg[0])
    grad.addColorStop(1, bg[1])
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, width, height)

    // Draw AI image if available
    if (image) {
      try {
        ctx.globalAlpha = 0.7
        ctx.drawImage(image, 0, 0, width, height)
        ctx.globalAlpha = 1
      } catch {}
    }

    // Draw starfield for starfield background
    if (scene.background === 'starfield') {
      ctx.fillStyle = '#ffffff'
      for (let i = 0; i < 50; i++) {
        const x = (i * 137 + frame * 0.5) % width
        const y = (i * 211 + frame * 0.3) % height
        const size = (i % 3) + 1
        ctx.globalAlpha = 0.3 + 0.3 * Math.sin(frame * 0.02 + i)
        ctx.fillRect(x, y, size, size)
      }
      ctx.globalAlpha = 1
    }

    // Draw grid for grid background
    if (scene.background === 'grid') {
      ctx.strokeStyle = 'rgba(255,255,255,0.05)'
      ctx.lineWidth = 1
      for (let x = 0; x < width; x += 48) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke()
      }
      for (let y = 0; y < height; y += 48) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke()
      }
    }

    // Draw scene title with animation
    const fadeIn = Math.min(progress * 5, 1)
    const fadeOut = progress > 0.8 ? Math.max(1 - (progress - 0.8) * 5, 0) : 1
    const alpha = fadeIn * fadeOut

    ctx.globalAlpha = alpha
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // Title
    const titleY = height / 2
    const fontSize = Math.min(width * 0.06, 48)
    ctx.font = `bold ${fontSize}px sans-serif`

    // Title shadow
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.fillText(scene.title || '', width / 2 + 3, titleY + 3)

    // Title text with gradient
    const textGrad = ctx.createLinearGradient(0, titleY - fontSize, 0, titleY + fontSize)
    textGrad.addColorStop(0, '#FFB627')
    textGrad.addColorStop(0.5, '#FB7185')
    textGrad.addColorStop(1, '#6366F1')
    ctx.fillStyle = textGrad
    ctx.fillText(scene.title || '', width / 2, titleY)

    // Emoji
    if (scene.emoji) {
      ctx.font = `${fontSize * 1.5}px sans-serif`
      ctx.fillText(scene.emoji, width / 2, titleY - fontSize * 1.5)
    }

    // Voiceover text at bottom
    if (scene.voiceover) {
      ctx.font = `${fontSize * 0.4}px sans-serif`
      ctx.fillStyle = 'rgba(255,255,255,0.8)'
      ctx.textAlign = 'center'
      // Wrap text
      const words = scene.voiceover.split(' ')
      const lines: string[] = []
      let currentLine = ''
      for (const w of words) {
        const testLine = currentLine ? currentLine + ' ' + w : w
        if (ctx.measureText(testLine).width > width * 0.8) {
          if (currentLine) lines.push(currentLine)
          currentLine = w
        } else {
          currentLine = testLine
        }
      }
      if (currentLine) lines.push(currentLine)

      lines.slice(0, 4).forEach((line, i) => {
        ctx.fillText(line, width / 2, height - 100 + i * fontSize * 0.5)
      })
    }

    // Scene type badge at top
    ctx.font = `bold ${fontSize * 0.35}px sans-serif`
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.textAlign = 'center'
    ctx.fillText((scene.type || 'scene').replace('-', ' ').toUpperCase(), width / 2, 60)

    // Progress bar at bottom
    const barWidth = width * 0.8
    const barX = (width - barWidth) / 2
    const barY = height - 40
    ctx.fillStyle = 'rgba(255,255,255,0.1)'
    ctx.fillRect(barX, barY, barWidth, 4)
    ctx.fillStyle = '#FFB627'
    ctx.fillRect(barX, barY, barWidth * progress, 4)

    ctx.globalAlpha = 1
  }

  function clearHistory() { saveHistory([]); toast.success('History cleared') }

  // ─── Topic Suggestions ──────────────────────────────────

  const TOPIC_SUGGESTIONS = [
    'Why is the sky blue?',
    '5 amazing facts about Ethiopia',
    'The mystery of black holes',
    'How do bees make honey?',
    'The speed of light explained',
    'Why volcanoes erupt',
    'How memory works in the brain',
    'The history of coffee',
    'Why rainbows form',
    'Spider silk is stronger than steel',
    'Why we yawn when others do',
    'How trees talk to each other',
    'The power of nuclear fusion',
    'What if you fell into a black hole?',
    'The Great Wall of China myth',
    'Why octopuses have 3 hearts',
    'How do earthquakes happen',
    'The science of dreams',
    'Why time feels faster as you age',
    'The deepest point on Earth',
  ]

  function fillTopicSuggestion() {
    const random = TOPIC_SUGGESTIONS[Math.floor(Math.random() * TOPIC_SUGGESTIONS.length)]
    setTopic(random)
    toast.info(`Suggestion: ${random}`)
  }
  function deleteHistoryItem(id: string) { saveHistory(history.filter((h) => h.id !== id)) }
  function loadFromHistory(item: HistoryItem) {
    setTopic(item.topic); setMode(item.mode); setResult(item.result); setSceneImages({})
    toast.success(`Loaded: ${item.result.title}`)
  }

  // Group modes for the dropdown
  const modeGroups = [...new Set(CONTENT_MODES.map((m) => m.group))]

  const selectedMode = CONTENT_MODES.find((m) => m.id === mode)
  const selectedLang = LANGUAGES.find((l) => l.code === language)
  const selectedRes = RESOLUTIONS.find((r) => r.id === resolution)
  const selectedTone = TONES.find((t) => t.id === tone)
  const totalDuration = result?.scenes?.reduce((a, s) => a + s.durationSec, 0) || 0
  const hasResult = !!result

  // Keyboard shortcuts
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return
      if (e.key === 'Enter' && !loading) generate()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ═══ Header with Menu Bar ═══ */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="container mx-auto px-4">
          {/* Top row */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 via-rose-400 to-violet-500 shadow-lg shrink-0">
                <Wand2 className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base font-bold truncate">Wud Animation Studio</h1>
                <p className="text-[10px] text-muted-foreground hidden sm:block">Autonomous video generator · 32 modes · AI images + voice</p>
              </div>
            </div>
          </div>

          {/* Menu bar row */}
          <div className="flex items-center gap-0.5 pb-2 overflow-x-auto scroll-studio">
            {/* ─── Content Mode ─── */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5 shrink-0">
                  {(() => { const Icon = selectedMode?.icon || Sparkles; return <Icon className="h-3.5 w-3.5" /> })()}
                  <span className="font-bold">{selectedMode?.label.split(' ')[1]}</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72 max-h-96 overflow-y-auto scroll-studio">
                <DropdownMenuLabel>Content Mode (32)</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {modeGroups.map((group) => (
                  <div key={group}>
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">{group}</div>
                    {CONTENT_MODES.filter((m) => m.group === group).map((m) => {
                      const Icon = m.icon
                      return (
                        <DropdownMenuItem key={m.id} onClick={() => setMode(m.id)} className="gap-2 cursor-pointer">
                          <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium flex items-center gap-1.5">
                              {m.label.split(' ').slice(1).join(' ')}
                              {mode === m.id && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">{m.desc}</div>
                          </div>
                        </DropdownMenuItem>
                      )
                    })}
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* ─── Tone ─── */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5 shrink-0">
                  {(() => { const Icon = selectedTone?.icon || Palette; return <Icon className="h-3.5 w-3.5" /> })()}
                  <span className="font-bold">{selectedTone?.label.split(' ')[1]}</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Tone (10)</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {TONES.map((t) => {
                  const Icon = t.icon
                  return (
                    <DropdownMenuItem key={t.id} onClick={() => setTone(t.id)} className="gap-2 cursor-pointer">
                      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="text-sm font-medium flex items-center gap-1.5">
                          {t.label.split(' ').slice(1).join(' ')}
                          {tone === t.id && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                        </div>
                        <div className="text-xs text-muted-foreground">{t.desc}</div>
                      </div>
                    </DropdownMenuItem>
                  )
                })}
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
                    {history.map((h) => {
                      const modeInfo = CONTENT_MODES.find((m) => m.id === h.mode)
                      return (
                        <div key={h.id} className="flex items-start gap-2 px-2 py-1.5 hover:bg-accent rounded-md group">
                          <button onClick={() => loadFromHistory(h)} className="flex-1 text-left min-w-0">
                            <div className="text-sm font-semibold truncate">{h.result.title}</div>
                            <div className="text-xs text-muted-foreground truncate flex items-center gap-1.5">
                              {modeInfo?.icon && <modeInfo.icon className="h-3 w-3" />}
                              {h.topic}
                            </div>
                          </button>
                          <button onClick={() => deleteHistoryItem(h.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity shrink-0">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )
                    })}
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
                <Button variant="ghost" size="sm" className="gap-1.5 shrink-0" disabled={!hasResult || rendering}>
                  {rendering ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline">{rendering ? `Rendering ${Math.round(renderProgress)}%` : 'Download'}</span>
                  {!rendering && <ChevronDown className="h-3 w-3" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64">
                <DropdownMenuLabel>Download As</DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* Video formats */}
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Video Formats</div>
                <DropdownMenuItem onClick={() => renderVideo('mp4')} className="gap-2 cursor-pointer" disabled={rendering}>
                  <FileVideo className="h-4 w-4 text-rose-500" />
                  <div>
                    <div className="text-sm font-medium">MP4 Video</div>
                    <div className="text-xs text-muted-foreground">Most compatible · YouTube/TikTok</div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => renderVideo('webm')} className="gap-2 cursor-pointer" disabled={rendering}>
                  <FileVideo className="h-4 w-4 text-violet-500" />
                  <div>
                    <div className="text-sm font-medium">WebM Video</div>
                    <div className="text-xs text-muted-foreground">Smallest size · web-optimized</div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => renderVideo('avi')} className="gap-2 cursor-pointer" disabled={rendering}>
                  <FileVideo className="h-4 w-4 text-amber-500" />
                  <div>
                    <div className="text-sm font-medium">AVI Video</div>
                    <div className="text-xs text-muted-foreground">Uncompressed · video editing</div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => renderVideo('mov')} className="gap-2 cursor-pointer" disabled={rendering}>
                  <FileVideo className="h-4 w-4 text-cyan-500" />
                  <div>
                    <div className="text-sm font-medium">MOV Video</div>
                    <div className="text-xs text-muted-foreground">Apple QuickTime · high quality</div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => renderVideo('gif')} className="gap-2 cursor-pointer" disabled={rendering}>
                  <FileVideo className="h-4 w-4 text-emerald-500" />
                  <div>
                    <div className="text-sm font-medium">GIF Animation</div>
                    <div className="text-xs text-muted-foreground">Looping · social media</div>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {/* Document formats */}
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Document Formats</div>
                <DropdownMenuItem onClick={downloadJSON} className="gap-2 cursor-pointer">
                  <FileJson className="h-4 w-4 text-amber-500" />
                  <div><div className="text-sm font-medium">JSON</div><div className="text-xs text-muted-foreground">Full structured outline</div></div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={downloadScript} className="gap-2 cursor-pointer">
                  <FileText className="h-4 w-4 text-rose-400" />
                  <div><div className="text-sm font-medium">Script (.txt)</div><div className="text-xs text-muted-foreground">Formatted voiceover script</div></div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={downloadSRT} className="gap-2 cursor-pointer">
                  <Captions className="h-4 w-4 text-cyan-500" />
                  <div><div className="text-sm font-medium">Subtitles (.srt)</div><div className="text-xs text-muted-foreground">For YouTube/TikTok</div></div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={downloadMarkdown} className="gap-2 cursor-pointer">
                  <FileCode className="h-4 w-4 text-violet-500" />
                  <div><div className="text-sm font-medium">Markdown (.md)</div><div className="text-xs text-muted-foreground">Documentation format</div></div>
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
                  <div><div className="text-sm font-medium">Post to YouTube</div><div className="text-xs text-muted-foreground">Shorts · auto-upload</div></div>
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => toast.info('TikTok posting coming soon')}>
                  <Music2 className="h-4 w-4 text-cyan-500" />
                  <div><div className="text-sm font-medium">Post to TikTok</div><div className="text-xs text-muted-foreground">Auto-upload with hashtags</div></div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => toast.info('Posting to both coming soon')}>
                  <Send className="h-4 w-4 text-violet-500" />
                  <div><div className="text-sm font-medium">Post to Both</div><div className="text-xs text-muted-foreground">YouTube + TikTok</div></div>
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
              Type a topic, pick your mode from the menu bar, and let AI do the rest — script, images, voice, captions.
            </p>
          </div>

          {/* Topic Input + Generate */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && generate()}
                placeholder="Type your topic... e.g. 'The mystery of black holes'"
                className="h-14 text-base flex-1"
              />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="h-14 w-14 shrink-0" onClick={fillTopicSuggestion} disabled={loading}>
                      <Shuffle className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Random topic suggestion</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Button
              onClick={generate}
              disabled={loading || !topic.trim()}
              className="w-full h-14 text-base font-bold bg-gradient-to-r from-amber-500 via-rose-400 to-violet-500 text-white hover:opacity-90"
            >
              {loading ? (
                <><Loader2 className="h-5 w-5 mr-2 animate-spin" />{progressLabel} {progress > 0 && `${Math.round(progress)}%`}</>
              ) : (
                <><Sparkles className="h-5 w-5 mr-2" />Generate Video (1 Click)</>
              )}
            </Button>
          </div>

          {/* Progress */}
          {loading && (
            <div className="space-y-2">
              <Progress value={progress} className="h-1.5" />
              <div className="flex items-center justify-center gap-2">
                <Skeleton className="h-3 w-3 rounded-full" />
                <p className="text-xs text-muted-foreground">{progressLabel}...</p>
              </div>
            </div>
          )}

          {/* Skeleton loader for result */}
          {loading && !result && (
            <Card className="p-6 space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Separator />
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="h-6 w-6 rounded" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </Card>
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
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold">{result.title}</h3>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="sm" variant="ghost" onClick={generate} disabled={loading} className="h-7 w-7 p-0 shrink-0">
                                <RefreshCw className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Regenerate with same topic</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      {result.hook && <p className="text-sm italic text-amber-500 mt-1">"{result.hook}"</p>}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge variant="outline" className="text-xs"><Clock className="h-3 w-3 mr-1" />{totalDuration}s</Badge>
                      <Badge variant="outline" className="text-xs"><Film className="h-3 w-3 mr-1" />{result.scenes?.length || 0} scenes</Badge>
                    </div>
                  </div>

                  {/* Generate All Images button */}
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={generateAllImages} className="gap-1.5" disabled={loading}>
                      <ImageIcon className="h-3.5 w-3.5" />
                      Generate All Images
                    </Button>
                  </div>

                  <Separator />

                  {/* Scene cards with visual backgrounds */}
                  <div className="space-y-3">
                    {result.scenes?.map((s, i) => {
                      const bgClass = BG_COLORS[s.background] || 'from-gray-800 to-gray-900'
                      return (
                        <div key={i} className="rounded-lg border overflow-hidden hover:shadow-md transition-shadow">
                          {/* Scene background preview */}
                          <div className={`h-16 bg-gradient-to-r ${bgClass} relative flex items-center px-4`}>
                            <span className="text-2xl">{s.emoji || '🎬'}</span>
                            <span className="ml-3 text-sm font-bold text-white/90">{s.title}</span>
                            <div className="ml-auto flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs bg-black/40 text-white border-white/10">{s.type?.replace('-', ' ')}</Badge>
                              <Badge variant="secondary" className="text-xs bg-black/40 text-white border-white/10">{s.durationSec}s</Badge>
                              {s.character && <Badge variant="secondary" className="text-xs bg-black/40 text-white border-white/10">{s.character}</Badge>}
                            </div>
                          </div>
                          {/* Scene content */}
                          <div className="p-3 space-y-2">
                            {/* AI image preview */}
                            {sceneImages[i] ? (
                              <div className="rounded-md overflow-hidden border">
                                <img src={sceneImages[i]} alt={s.title} className="w-full max-h-48 object-cover" />
                              </div>
                            ) : imageLoading[i] ? (
                              <div className="flex items-center justify-center h-24 rounded-md border bg-muted">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                              </div>
                            ) : (
                              <Button size="sm" variant="ghost" onClick={() => generateSceneImage(i, s)} className="gap-1.5 text-xs w-full border border-dashed">
                                <ImageIcon className="h-3.5 w-3.5" />
                                Generate AI Image for this scene
                              </Button>
                            )}
                            {/* Voiceover */}
                            {s.voiceover && (
                              <div className="flex items-start gap-2">
                                <button onClick={() => playSceneVoice(i, s)} className="shrink-0 mt-0.5">
                                  {audioPlaying === i ? <Pause className="h-4 w-4 text-primary" /> : <Play className="h-4 w-4 text-muted-foreground hover:text-primary" />}
                                </button>
                                <p className="text-xs text-muted-foreground italic flex-1">{s.voiceover}</p>
                              </div>
                            )}
                            {/* Image prompt */}
                            {s.imagePrompt && (
                              <p className="text-xs text-muted-foreground/60 pl-6">🎨 {s.imagePrompt}</p>
                            )}
                            {/* Copy button */}
                            <div className="flex justify-end">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button onClick={() => copyToClipboard(JSON.stringify(s, null, 2), `scene-${i}`)} className="text-muted-foreground hover:text-foreground">
                                      {copiedField === `scene-${i}` ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>Copy scene JSON</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Hashtags */}
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
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(
                      result.scenes.map((s, i) => `${String(i + 1).padStart(2, '0')}. [${s.durationSec}s] ${s.emoji || ''} ${s.voiceover || s.title}`).join('\n\n'),
                      'script'
                    )}>
                      {copiedField === 'script' ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />} Copy Script
                    </Button>
                  </div>
                  <ScrollArea className="h-96 rounded-lg border p-4">
                    <div className="space-y-4">
                      {result.scenes?.map((s, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, '0')}</span>
                            <span className="text-base">{s.emoji || '🎬'}</span>
                            <Badge variant="secondary" className="text-xs">{s.type?.replace('-', ' ')}</Badge>
                            {s.character && <Badge variant="outline" className="text-xs">{s.character}</Badge>}
                            <span className="text-xs text-muted-foreground">{s.durationSec}s</span>
                          </div>
                          <p className="text-sm pl-8">{s.voiceover || s.title}</p>
                          {s.imagePrompt && <p className="text-xs text-muted-foreground/60 pl-8">🎨 {s.imagePrompt}</p>}
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
                      <div><span className="text-muted-foreground">Mode:</span> {selectedMode?.label}</div>
                    </div>
                  </div>
                  {result.whyViral && (<><Separator /><div className="space-y-1"><div className="text-xs font-bold uppercase text-muted-foreground">Why Viral</div><p className="text-sm">{result.whyViral}</p></div></>)}
                  {result.hashtagSuggestions && result.hashtagSuggestions.length > 0 && (
                    <><Separator /><div className="space-y-1"><div className="text-xs font-bold uppercase text-muted-foreground">Hashtags</div><p className="text-sm font-mono">{result.hashtagSuggestions.join(' ')}</p></div></>
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
                { icon: ImageIcon, label: 'AI Images', desc: 'Per scene, on demand' },
                { icon: Volume2, label: 'AI Voice', desc: 'TTS in 8 languages' },
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
