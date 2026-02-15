'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Search, Trash2, Play, Edit, Copy, LayoutGrid, FileText, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { DEFAULT_SLIDE_CODE } from '@/components/presentations/SlideRenderer'

interface Presentation {
  id: string
  title: string
  description: string | null
  slide_count: number
  created_at: string
  updated_at: string
}

// Default code for a title slide
const TITLE_SLIDE_CODE = (title: string) => `<motion.div 
  className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-16"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
>
  <motion.h1 
    className="text-6xl font-bold text-white mb-6 text-center"
    initial={{ y: 30, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ delay: 0.2 }}
  >
    ${title}
  </motion.h1>
  <motion.div 
    className="w-24 h-1 bg-blue-500"
    initial={{ scaleX: 0 }}
    animate={{ scaleX: 1 }}
    transition={{ delay: 0.4, duration: 0.6 }}
  />
</motion.div>`

export default function PresentationsPage() {
  const router = useRouter()
  const [presentations, setPresentations] = useState<Presentation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [scriptDialogOpen, setScriptDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedPresentation, setSelectedPresentation] = useState<Presentation | null>(null)
  const [generating, setGenerating] = useState(false)
  const [scriptInput, setScriptInput] = useState('')
  const [brandStyle, setBrandStyle] = useState('professional')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  })

  const fetchPresentations = useCallback(async () => {
    const { data } = await supabase
      .from('presentations')
      .select('*')
      .order('updated_at', { ascending: false })

    if (data) {
      setPresentations(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchPresentations()
  }, [fetchPresentations])

  const filteredPresentations = presentations.filter((p) => {
    const query = searchQuery.toLowerCase()
    return (
      p.title.toLowerCase().includes(query) ||
      p.description?.toLowerCase().includes(query)
    )
  })

  const openNewDialog = () => {
    setSelectedPresentation(null)
    setFormData({ title: '', description: '' })
    setDialogOpen(true)
  }

  const handleCreate = async () => {
    const title = formData.title || 'Untitled Presentation'
    
    const { data, error } = await supabase
      .from('presentations')
      .insert({
        title,
        description: formData.description || null,
        slide_count: 1,
      })
      .select()
      .single()

    if (data && !error) {
      // Create a default title slide with CODE
      const { error: slideError } = await supabase.from('presentation_slides').insert({
        presentation_id: data.id,
        slide_order: 0,
        code: TITLE_SLIDE_CODE(title),
      })
      
      if (slideError) {
        console.error('Error creating slide:', slideError)
      }
      
      // Navigate to editor
      router.push(`/presentations/${data.id}`)
    }

    setDialogOpen(false)
  }

  const handleDuplicate = async (presentation: Presentation) => {
    // Create new presentation
    const { data: newPres, error } = await supabase
      .from('presentations')
      .insert({
        title: `${presentation.title} (Copy)`,
        description: presentation.description,
        slide_count: presentation.slide_count,
      })
      .select()
      .single()

    if (newPres && !error) {
      // Fetch original slides
      const { data: slides } = await supabase
        .from('presentation_slides')
        .select('*')
        .eq('presentation_id', presentation.id)
        .order('slide_order', { ascending: true })

      if (slides) {
        // Duplicate slides with CODE field
        const newSlides = slides.map((slide) => ({
          presentation_id: newPres.id,
          slide_order: slide.slide_order,
          code: slide.code || DEFAULT_SLIDE_CODE,
        }))
        await supabase.from('presentation_slides').insert(newSlides)
      }
    }

    fetchPresentations()
  }

  const handleDelete = async () => {
    if (!selectedPresentation) return

    // Delete slides first
    await supabase
      .from('presentation_slides')
      .delete()
      .eq('presentation_id', selectedPresentation.id)

    // Delete presentation
    await supabase
      .from('presentations')
      .delete()
      .eq('id', selectedPresentation.id)

    setDeleteDialogOpen(false)
    setSelectedPresentation(null)
    fetchPresentations()
  }

  const handleGenerateFromScript = async () => {
    if (!scriptInput.trim()) return
    
    setGenerating(true)
    try {
      console.log('[FromScript] Calling generate-code API...')
      
      // Call the NEW code generation API
      const response = await fetch('/api/presentations/generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script: scriptInput, brandStyle }),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('[FromScript] API error:', errorText)
        throw new Error('Failed to generate')
      }
      
      const result = await response.json()
      console.log('[FromScript] API response:', result)
      
      const slides = result.slides
      if (!slides || slides.length === 0) {
        throw new Error('No slides generated')
      }
      
      // Extract title from first slide spec or script
      const firstLine = scriptInput.split('\n')[0]
      const title = result.slides[0]?.spec?.slide_title || 
                   firstLine.replace(/^(Slide \d+:|#|\*)/gi, '').trim().substring(0, 50) || 
                   'Generated Presentation'
      
      console.log('[FromScript] Creating presentation with', slides.length, 'slides')
      
      // Create presentation
      const { data: pres, error: presError } = await supabase
        .from('presentations')
        .insert({
          title,
          description: `Generated with ${brandStyle} style`,
          slide_count: slides.length,
        })
        .select()
        .single()
      
      if (presError || !pres) {
        console.error('[FromScript] Presentation insert error:', presError)
        throw new Error('Failed to create presentation')
      }
      
      console.log('[FromScript] Created presentation:', pres.id)
      
      // Insert all slides with CODE field
      for (let i = 0; i < slides.length; i++) {
        const slideCode = slides[i].code
        console.log(`[FromScript] Inserting slide ${i + 1}, code length:`, slideCode?.length)
        
        const { error: slideError } = await supabase
          .from('presentation_slides')
          .insert({
            presentation_id: pres.id,
            slide_order: i,
            code: slideCode,
          })
        
        if (slideError) {
          console.error(`[FromScript] Slide ${i + 1} insert error:`, slideError)
        }
      }
      
      console.log('[FromScript] All slides inserted, navigating to editor')
      
      // Navigate to editor
      setScriptDialogOpen(false)
      setScriptInput('')
      router.push(`/presentations/${pres.id}`)
      
    } catch (error) {
      console.error('[FromScript] Error:', error)
      alert('Failed to generate presentation. Check console for details.')
    } finally {
      setGenerating(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Presentations</h1>
          <p className="text-gray-600 text-sm mt-1">
            {presentations.length} presentation{presentations.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setScriptDialogOpen(true)}>
            <FileText className="w-4 h-4 mr-2" />
            From Script
          </Button>
          <Button onClick={openNewDialog}>
            <Plus className="w-4 h-4 mr-2" />
            New Presentation
          </Button>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search presentations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredPresentations.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            {searchQuery
              ? 'No presentations match your search'
              : 'No presentations yet. Create your first slide deck.'}
          </div>
        ) : (
          filteredPresentations.map((presentation) => (
            <Card
              key={presentation.id}
              className="overflow-hidden hover:shadow-md transition-shadow group"
            >
              {/* 16:9 Preview Thumbnail */}
              <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center relative">
                <LayoutGrid className="w-12 h-12 text-slate-600" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex gap-2">
                    <Link href={`/presentations/${presentation.id}`}>
                      <Button size="sm" variant="secondary">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </Link>
                    <Link href={`/presentations/${presentation.id}/present`}>
                      <Button size="sm">
                        <Play className="w-4 h-4 mr-1" />
                        Present
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
              
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium truncate">{presentation.title}</h3>
                    {presentation.description && (
                      <p className="text-sm text-gray-500 truncate mt-1">
                        {presentation.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      {presentation.slide_count} slide{presentation.slide_count !== 1 ? 's' : ''} · Updated {formatDate(presentation.updated_at)}
                    </p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDuplicate(presentation)
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedPresentation(presentation)
                        setDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Presentation</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Presentation title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                placeholder="Brief description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Presentation</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">
            Are you sure you want to delete &quot;{selectedPresentation?.title}&quot;? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate from Script Dialog */}
      <Dialog open={scriptDialogOpen} onOpenChange={setScriptDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate Presentation from Script</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-6">
            {/* Brand Style Selection */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Brand Style</Label>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { id: 'professional', label: 'Professional', colors: ['#0ea5e9', '#3b82f6', '#6366f1'] },
                  { id: 'bold', label: 'Bold', colors: ['#dc2626', '#ea580c', '#f59e0b'] },
                  { id: 'creative', label: 'Creative', colors: ['#8b5cf6', '#a855f7', '#d946ef'] },
                  { id: 'minimal', label: 'Minimal', colors: ['#18181b', '#71717a', '#a1a1aa'] },
                  { id: 'tech', label: 'Tech', colors: ['#06b6d4', '#0891b2', '#0e7490'] },
                ].map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setBrandStyle(style.id)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      brandStyle === style.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex gap-1 mb-2 justify-center">
                      {style.colors.map((color, i) => (
                        <div 
                          key={i} 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-medium">{style.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Script Input */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Presentation Script</Label>
              <p className="text-sm text-gray-500 mb-3">
                Paste your script or outline. AI will generate React slides with animations and consistent styling.
              </p>
              <Textarea
                placeholder={`Slide 1: Welcome to VXA Labs
Our AI-powered marketing platform

Slide 2: The Problem
Marketing content creation is slow and expensive
Creative testing burns budget before you learn

Slide 3: Our Solution  
AI-generated content validated through real distribution
Fast iteration, data-driven creative decisions

Slide 4: How It Works
1. Upload brand assets
2. AI generates on-brand content
3. Test across channels
4. Scale what works`}
                value={scriptInput}
                onChange={(e) => setScriptInput(e.target.value)}
                rows={12}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScriptDialogOpen(false)} disabled={generating}>
              Cancel
            </Button>
            <Button onClick={handleGenerateFromScript} disabled={generating || !scriptInput.trim()}>
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Slides
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
