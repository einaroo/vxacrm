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

interface Presentation {
  id: string
  title: string
  description: string | null
  slide_count: number
  created_at: string
  updated_at: string
}

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
    const { data, error } = await supabase
      .from('presentations')
      .insert({
        title: formData.title || 'Untitled Presentation',
        description: formData.description || null,
        slide_count: 0,
      })
      .select()
      .single()

    if (data && !error) {
      // Create a default title slide
      await supabase.from('presentation_slides').insert({
        presentation_id: data.id,
        slide_order: 0,
        template: 'title',
        content: {
          title: formData.title || 'Untitled Presentation',
          subtitle: '',
        },
      })
      
      // Update slide count
      await supabase
        .from('presentations')
        .update({ slide_count: 1 })
        .eq('id', data.id)
    }

    setDialogOpen(false)
    fetchPresentations()
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
        // Duplicate slides
        const newSlides = slides.map((slide) => ({
          presentation_id: newPres.id,
          slide_order: slide.slide_order,
          template: slide.template,
          content: slide.content,
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
      // Call API to parse script
      const response = await fetch('/api/presentations/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script: scriptInput }),
      })
      
      if (!response.ok) throw new Error('Failed to generate')
      
      const { slides } = await response.json()
      
      // Extract title from first slide or script
      const firstSlide = slides[0]
      const title = firstSlide?.content?.title || 'Generated Presentation'
      
      // Create presentation
      const { data: pres, error } = await supabase
        .from('presentations')
        .insert({
          title,
          description: 'Generated from script',
          slide_count: slides.length,
        })
        .select()
        .single()
      
      if (pres && !error) {
        // Insert all slides
        const slideInserts = slides.map((slide: { template: string; content: Record<string, unknown> }, index: number) => ({
          presentation_id: pres.id,
          slide_order: index,
          template: slide.template,
          content: slide.content,
        }))
        
        await supabase.from('presentation_slides').insert(slideInserts)
        
        // Navigate to editor
        setScriptDialogOpen(false)
        setScriptInput('')
        router.push(`/presentations/${pres.id}`)
      }
    } catch (error) {
      console.error('Error generating presentation:', error)
      alert('Failed to generate presentation. Please try again.')
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
              <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative">
                <LayoutGrid className="w-12 h-12 text-gray-300" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
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
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Generate from Script</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-500 mb-4">
              Paste your presentation script or outline. Use headings like &quot;Slide 1: Title&quot; or bullet points. AI will parse it into slides.
            </p>
            <Textarea
              placeholder={`*VXA Sales Deck*

*Slide 1: Title*
Company Name × Partner
Your tagline here

*Slide 2: The Problem*
• Point one
• Point two
• Point three

*Slide 3: Our Solution*
Description of what you do...`}
              value={scriptInput}
              onChange={(e) => setScriptInput(e.target.value)}
              rows={15}
              className="font-mono text-sm"
            />
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
