'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  Plus,
  Trash2,
  Play,
  ChevronUp,
  ChevronDown,
  MoreVertical,
  Wand2,
  FileText,
  Sparkles,
  Code,
  Eye,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import dynamic from 'next/dynamic'
import { SlideRenderer, DEFAULT_SLIDE_CODE, BRAND_TEMPLATES } from '@/components/presentations/SlideRenderer'

// Dynamic import Monaco to avoid SSR issues
const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then(mod => mod.default),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-full text-slate-400">Loading editor...</div> }
)

interface Slide {
  id: string
  presentation_id: string
  slide_order: number
  code: string // JSX code - the actual slide content
  created_at: string
}

interface Presentation {
  id: string
  title: string
  description: string | null
  slide_count: number
}

type BrandStyle = 'professional' | 'bold' | 'creative' | 'minimal' | 'tech'

const BRAND_STYLES: { id: BrandStyle; label: string; description: string }[] = [
  { id: 'professional', label: 'Professional', description: 'Clean, corporate, trustworthy' },
  { id: 'bold', label: 'Bold', description: 'High contrast, impactful, energetic' },
  { id: 'creative', label: 'Creative', description: 'Playful gradients, expressive' },
  { id: 'minimal', label: 'Minimal', description: 'White space, elegant, refined' },
  { id: 'tech', label: 'Tech', description: 'Cyber, grid patterns, monospace' },
]

export default function PresentationEditorPage() {
  const params = useParams()
  const router = useRouter()
  const presentationId = params.id as string

  const [presentation, setPresentation] = useState<Presentation | null>(null)
  const [slides, setSlides] = useState<Slide[]>([])
  const [selectedSlideIndex, setSelectedSlideIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [viewMode, setViewMode] = useState<'preview' | 'code' | 'split'>('split')
  
  // Script generation state
  const [scriptDialogOpen, setScriptDialogOpen] = useState(false)
  const [script, setScript] = useState('')
  const [brandStyle, setBrandStyle] = useState<BrandStyle>('professional')
  const [generating, setGenerating] = useState(false)

  const fetchData = useCallback(async () => {
    const [presRes, slidesRes] = await Promise.all([
      supabase.from('presentations').select('*').eq('id', presentationId).single(),
      supabase
        .from('presentation_slides')
        .select('*')
        .eq('presentation_id', presentationId)
        .order('slide_order', { ascending: true }),
    ])

    if (presRes.data) setPresentation(presRes.data)
    if (slidesRes.data) {
      // Migration: convert old template/content to code if needed
      const migratedSlides = slidesRes.data.map((slide) => ({
        id: slide.id as string,
        presentation_id: slide.presentation_id as string,
        slide_order: slide.slide_order as number,
        code: (slide.code as string) || DEFAULT_SLIDE_CODE,
        created_at: slide.created_at as string,
      }))
      setSlides(migratedSlides)
    }
    setLoading(false)
  }, [presentationId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const selectedSlide = slides[selectedSlideIndex]

  const updateSlideCode = async (newCode: string) => {
    if (!selectedSlide) return
    setSaving(true)

    const newSlides = [...slides]
    newSlides[selectedSlideIndex] = { ...selectedSlide, code: newCode }
    setSlides(newSlides)

    await supabase
      .from('presentation_slides')
      .update({ code: newCode })
      .eq('id', selectedSlide.id)

    await supabase
      .from('presentations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', presentationId)

    setSaving(false)
  }

  const addSlide = async (style?: BrandStyle) => {
    const newOrder = slides.length
    const code = style ? BRAND_TEMPLATES[style] : DEFAULT_SLIDE_CODE

    const { data } = await supabase
      .from('presentation_slides')
      .insert({
        presentation_id: presentationId,
        slide_order: newOrder,
        code,
      })
      .select()
      .single()

    if (data) {
      setSlides([...slides, data])
      setSelectedSlideIndex(slides.length)

      await supabase
        .from('presentations')
        .update({ slide_count: slides.length + 1, updated_at: new Date().toISOString() })
        .eq('id', presentationId)
    }
  }

  const deleteSlide = async (index: number) => {
    if (slides.length <= 1) return

    const slideToDelete = slides[index]
    const newSlides = slides.filter((_, i) => i !== index)

    const reorderedSlides = newSlides.map((s, i) => ({ ...s, slide_order: i }))
    setSlides(reorderedSlides)

    if (selectedSlideIndex >= newSlides.length) {
      setSelectedSlideIndex(newSlides.length - 1)
    }

    await supabase.from('presentation_slides').delete().eq('id', slideToDelete.id)

    for (const slide of reorderedSlides) {
      await supabase
        .from('presentation_slides')
        .update({ slide_order: slide.slide_order })
        .eq('id', slide.id)
    }

    await supabase
      .from('presentations')
      .update({ slide_count: newSlides.length, updated_at: new Date().toISOString() })
      .eq('id', presentationId)
  }

  const moveSlide = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= slides.length) return

    const newSlides = [...slides]
    const temp = newSlides[index]
    newSlides[index] = newSlides[newIndex]
    newSlides[newIndex] = temp

    newSlides.forEach((s, i) => (s.slide_order = i))
    setSlides(newSlides)
    setSelectedSlideIndex(newIndex)

    for (const slide of newSlides) {
      await supabase
        .from('presentation_slides')
        .update({ slide_order: slide.slide_order })
        .eq('id', slide.id)
    }
  }

  const generateFromScript = async () => {
    if (!script.trim()) return
    
    setGenerating(true)
    try {
      console.log('[Generate] Starting generation with brandStyle:', brandStyle)
      
      const response = await fetch('/api/presentations/generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script, brandStyle }),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('[Generate] API error:', errorText)
        throw new Error('Generation failed')
      }
      
      const result = await response.json()
      console.log('[Generate] API response:', result)
      
      const generatedSlides = result.slides
      if (!generatedSlides || generatedSlides.length === 0) {
        throw new Error('No slides generated')
      }
      
      console.log('[Generate] Generated', generatedSlides.length, 'slides')
      console.log('[Generate] First slide code:', generatedSlides[0]?.code?.substring(0, 200))
      
      // Delete existing slides
      const deleteResult = await supabase
        .from('presentation_slides')
        .delete()
        .eq('presentation_id', presentationId)
      console.log('[Generate] Delete result:', deleteResult)
      
      // Insert new slides
      const newSlides: Slide[] = []
      for (let i = 0; i < generatedSlides.length; i++) {
        const slideCode = generatedSlides[i].code
        console.log(`[Generate] Inserting slide ${i + 1}, code length:`, slideCode?.length)
        
        const { data, error } = await supabase
          .from('presentation_slides')
          .insert({
            presentation_id: presentationId,
            slide_order: i,
            code: slideCode,
          })
          .select()
          .single()
        
        if (error) {
          console.error(`[Generate] Insert error for slide ${i + 1}:`, error)
        }
        
        if (data) {
          console.log(`[Generate] Inserted slide ${i + 1}, returned code length:`, data.code?.length)
          newSlides.push(data)
        }
      }
      
      console.log('[Generate] Total slides inserted:', newSlides.length)
      setSlides(newSlides)
      setSelectedSlideIndex(0)
      
      await supabase
        .from('presentations')
        .update({ 
          slide_count: newSlides.length, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', presentationId)
      
      setScriptDialogOpen(false)
      setScript('')
    } catch (error) {
      console.error('[Generate] Error:', error)
      alert('Failed to generate slides. Check console for details.')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    )
  }

  if (!presentation) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950 text-white">
        Presentation not found
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.push('/presentations')}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="font-semibold text-white">{presentation.title}</h1>
            <p className="text-xs text-slate-500">
              {slides.length} slides {saving && '· Saving...'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex bg-slate-800 rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'px-3 h-7',
                viewMode === 'preview' && 'bg-slate-700 text-white'
              )}
              onClick={() => setViewMode('preview')}
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'px-3 h-7',
                viewMode === 'split' && 'bg-slate-700 text-white'
              )}
              onClick={() => setViewMode('split')}
            >
              <span className="text-xs">Split</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'px-3 h-7',
                viewMode === 'code' && 'bg-slate-700 text-white'
              )}
              onClick={() => setViewMode('code')}
            >
              <Code className="w-4 h-4" />
            </Button>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setScriptDialogOpen(true)}
            className="border-slate-700 text-slate-300 hover:text-white"
          >
            <Wand2 className="w-4 h-4 mr-2" />
            From Script
          </Button>
          
          <Link href={`/presentations/${presentationId}/present`}>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Play className="w-4 h-4 mr-2" />
              Present
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Slide Sidebar */}
        <div className="w-56 bg-slate-900 border-r border-slate-800 overflow-y-auto p-3 space-y-2">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={cn(
                'group relative rounded-lg border-2 cursor-pointer transition-all',
                selectedSlideIndex === index
                  ? 'border-blue-500 shadow-lg shadow-blue-500/20'
                  : 'border-slate-700 hover:border-slate-600'
              )}
              onClick={() => setSelectedSlideIndex(index)}
            >
              <div className="aspect-video bg-slate-950 rounded-md overflow-hidden">
                <div className="w-full h-full scale-[0.2] origin-top-left" style={{ width: '500%', height: '500%' }}>
                  <SlideRenderer code={slide.code} />
                </div>
              </div>
              <div className="absolute top-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded font-mono">
                {index + 1}
              </div>
              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="icon" className="h-6 w-6 bg-slate-800">
                      <MoreVertical className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                    <DropdownMenuItem
                      onClick={(e) => { e.stopPropagation(); moveSlide(index, 'up') }}
                      disabled={index === 0}
                    >
                      <ChevronUp className="w-4 h-4 mr-2" />
                      Move up
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => { e.stopPropagation(); moveSlide(index, 'down') }}
                      disabled={index === slides.length - 1}
                    >
                      <ChevronDown className="w-4 h-4 mr-2" />
                      Move down
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-slate-700" />
                    <DropdownMenuItem
                      onClick={(e) => { e.stopPropagation(); deleteSlide(index) }}
                      disabled={slides.length <= 1}
                      className="text-red-400 focus:text-red-400"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}

          {/* Add Slide */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full border-slate-700 text-slate-400 hover:text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Slide
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-48 bg-slate-800 border-slate-700">
              <DropdownMenuItem onClick={() => addSlide()}>
                <FileText className="w-4 h-4 mr-2" />
                Blank Slide
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-700" />
              {BRAND_STYLES.map((style) => (
                <DropdownMenuItem key={style.id} onClick={() => addSlide(style.id)}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {style.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Preview Panel */}
          {(viewMode === 'preview' || viewMode === 'split') && (
            <div className={cn(
              'flex items-center justify-center p-8 bg-slate-950',
              viewMode === 'split' ? 'w-1/2' : 'flex-1'
            )}>
              <div className="w-full max-w-4xl">
                <div className="aspect-video rounded-lg shadow-2xl overflow-hidden ring-1 ring-slate-800">
                  {selectedSlide && <SlideRenderer code={selectedSlide.code} />}
                </div>
              </div>
            </div>
          )}

          {/* Code Editor Panel */}
          {(viewMode === 'code' || viewMode === 'split') && selectedSlide && (
            <div className={cn(
              'bg-slate-900 border-l border-slate-800 flex flex-col',
              viewMode === 'split' ? 'w-1/2' : 'flex-1'
            )}>
              <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                <span className="text-sm text-slate-400 font-mono">Slide {selectedSlideIndex + 1} — JSX + Tailwind + Motion</span>
              </div>
              <div className="flex-1">
                <MonacoEditor
                  height="100%"
                  language="javascript"
                  theme="vs-dark"
                  value={selectedSlide.code}
                  onChange={(value) => value && updateSlideCode(value)}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                    tabSize: 2,
                    padding: { top: 16 },
                    fontFamily: 'JetBrains Mono, Menlo, Monaco, monospace',
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Script Generation Dialog */}
      <Dialog open={scriptDialogOpen} onOpenChange={setScriptDialogOpen}>
        <DialogContent className="sm:max-w-2xl bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-blue-400" />
              Generate from Script
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Paste your script or outline. AI will generate React slides with animations.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">Brand Style</Label>
              <Select value={brandStyle} onValueChange={(v) => setBrandStyle(v as BrandStyle)}>
                <SelectTrigger className="mt-1 bg-slate-800 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {BRAND_STYLES.map((style) => (
                    <SelectItem key={style.id} value={style.id}>
                      <div>
                        <div className="font-medium">{style.label}</div>
                        <div className="text-xs text-slate-400">{style.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-slate-300">Script / Outline</Label>
              <Textarea
                value={script}
                onChange={(e) => setScript(e.target.value)}
                placeholder="Paste your presentation script here...

Example:
Slide 1: Introduction - Welcome to our company
Slide 2: The Problem - Current market challenges
Slide 3: Our Solution - How we solve it
..."
                className="mt-1 h-64 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setScriptDialogOpen(false)}
                className="border-slate-700"
              >
                Cancel
              </Button>
              <Button
                onClick={generateFromScript}
                disabled={!script.trim() || generating}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Slides
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
