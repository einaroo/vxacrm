'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ArrowLeft,
  Plus,
  Trash2,
  Play,
  ChevronUp,
  ChevronDown,
  MoreVertical,
  Type,
  LayoutTemplate,
  Columns,
  Quote,
  ImageIcon,
  List,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Slide {
  id: string
  presentation_id: string
  slide_order: number
  template: string
  content: Record<string, unknown>
  created_at: string
}

interface Presentation {
  id: string
  title: string
  description: string | null
  slide_count: number
}

const TEMPLATES = [
  { id: 'title', label: 'Title Slide', icon: Type },
  { id: 'content', label: 'Title + Content', icon: LayoutTemplate },
  { id: 'two-column', label: 'Two Columns', icon: Columns },
  { id: 'bullets', label: 'Bullet Points', icon: List },
  { id: 'quote', label: 'Quote', icon: Quote },
  { id: 'image', label: 'Image + Caption', icon: ImageIcon },
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
    if (slidesRes.data) setSlides(slidesRes.data)
    setLoading(false)
  }, [presentationId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const selectedSlide = slides[selectedSlideIndex]

  const updateSlide = async (updates: Partial<Slide>) => {
    if (!selectedSlide) return
    setSaving(true)

    const newSlides = [...slides]
    newSlides[selectedSlideIndex] = { ...selectedSlide, ...updates }
    setSlides(newSlides)

    await supabase
      .from('presentation_slides')
      .update(updates)
      .eq('id', selectedSlide.id)

    await supabase
      .from('presentations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', presentationId)

    setSaving(false)
  }

  const updateContent = (key: string, value: unknown) => {
    if (!selectedSlide) return
    updateSlide({ content: { ...selectedSlide.content, [key]: value } })
  }

  const addSlide = async (template: string = 'content') => {
    const newOrder = slides.length
    const defaultContent = getDefaultContent(template)

    const { data } = await supabase
      .from('presentation_slides')
      .insert({
        presentation_id: presentationId,
        slide_order: newOrder,
        template,
        content: defaultContent,
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

    // Reorder remaining slides
    const reorderedSlides = newSlides.map((s, i) => ({ ...s, slide_order: i }))
    setSlides(reorderedSlides)

    if (selectedSlideIndex >= newSlides.length) {
      setSelectedSlideIndex(newSlides.length - 1)
    }

    await supabase.from('presentation_slides').delete().eq('id', slideToDelete.id)

    // Update order for remaining slides
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

    // Update orders
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

  const getDefaultContent = (template: string) => {
    switch (template) {
      case 'title':
        return { title: 'Slide Title', subtitle: '' }
      case 'content':
        return { title: 'Slide Title', body: 'Add your content here...' }
      case 'two-column':
        return { title: 'Slide Title', left: 'Left column content', right: 'Right column content' }
      case 'bullets':
        return { title: 'Slide Title', bullets: ['Point 1', 'Point 2', 'Point 3'] }
      case 'quote':
        return { quote: 'Your quote here...', author: 'Author Name' }
      case 'image':
        return { imageUrl: '', caption: 'Image caption' }
      default:
        return { title: 'Slide Title', body: '' }
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  if (!presentation) {
    return <div className="flex items-center justify-center h-screen">Presentation not found</div>
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/presentations')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="font-semibold">{presentation.title}</h1>
            <p className="text-xs text-gray-500">
              {slides.length} slides {saving && '· Saving...'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/presentations/${presentationId}/present`}>
            <Button>
              <Play className="w-4 h-4 mr-2" />
              Present
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Slide Sidebar */}
        <div className="w-64 bg-white border-r overflow-y-auto p-4 space-y-2">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={cn(
                'group relative rounded-lg border-2 cursor-pointer transition-all',
                selectedSlideIndex === index
                  ? 'border-blue-500 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300'
              )}
              onClick={() => setSelectedSlideIndex(index)}
            >
              <div className="aspect-video bg-white rounded-md overflow-hidden p-2">
                <SlidePreview slide={slide} />
              </div>
              <div className="absolute top-1 left-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                {index + 1}
              </div>
              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="icon" className="h-6 w-6">
                      <MoreVertical className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        moveSlide(index, 'up')
                      }}
                      disabled={index === 0}
                    >
                      <ChevronUp className="w-4 h-4 mr-2" />
                      Move up
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        moveSlide(index, 'down')
                      }}
                      disabled={index === slides.length - 1}
                    >
                      <ChevronDown className="w-4 h-4 mr-2" />
                      Move down
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteSlide(index)
                      }}
                      disabled={slides.length <= 1}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}

          {/* Add Slide Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Slide
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-48">
              {TEMPLATES.map((template) => {
                const Icon = template.icon
                return (
                  <DropdownMenuItem key={template.id} onClick={() => addSlide(template.id)}>
                    <Icon className="w-4 h-4 mr-2" />
                    {template.label}
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Main Editor + Properties Panel */}
        <div className="flex-1 flex overflow-hidden">
          {/* Canvas Area */}
          <div className="flex-1 flex items-center justify-center p-8 overflow-auto bg-gray-100">
            <div className="w-full max-w-4xl">
              <div className="aspect-video bg-white rounded-lg shadow-lg overflow-hidden">
                {selectedSlide && <SlideCanvas slide={selectedSlide} />}
              </div>
            </div>
          </div>

          {/* Properties Panel - Right Side */}
          {selectedSlide && (
            <div className="w-80 bg-white border-l overflow-y-auto p-4">
              <h3 className="font-semibold text-sm mb-4">Slide Properties</h3>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-gray-500 mb-1">Template</Label>
                  <Select
                    value={selectedSlide.template}
                    onValueChange={(value) => {
                      updateSlide({
                        template: value,
                        content: getDefaultContent(value),
                      })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TEMPLATES.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <SlideEditor
                  slide={selectedSlide}
                  onContentChange={updateContent}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('text-sm font-medium', className)}>{children}</div>
}

function SlidePreview({ slide }: { slide: Slide }) {
  const content = slide.content as Record<string, unknown>

  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-center p-1 overflow-hidden">
      {slide.template === 'title' && (
        <>
          <div className="text-[8px] font-bold truncate w-full">{String(content.title || '')}</div>
          {Boolean(content.subtitle) && (
            <div className="text-[6px] text-gray-500 truncate w-full">{String(content.subtitle)}</div>
          )}
        </>
      )}
      {slide.template === 'content' && (
        <>
          <div className="text-[7px] font-bold truncate w-full mb-0.5">{String(content.title || '')}</div>
          <div className="text-[5px] text-gray-500 truncate w-full">{String(content.body || '')}</div>
        </>
      )}
      {slide.template === 'two-column' && (
        <>
          <div className="text-[7px] font-bold truncate w-full mb-0.5">{String(content.title || '')}</div>
          <div className="flex gap-1 w-full">
            <div className="flex-1 bg-gray-100 rounded h-4" />
            <div className="flex-1 bg-gray-100 rounded h-4" />
          </div>
        </>
      )}
      {slide.template === 'bullets' && (
        <>
          <div className="text-[7px] font-bold truncate w-full mb-0.5">{String(content.title || '')}</div>
          <div className="space-y-0.5 w-full">
            {((content.bullets as string[]) || []).slice(0, 3).map((_, i) => (
              <div key={i} className="h-1 bg-gray-200 rounded w-full" />
            ))}
          </div>
        </>
      )}
      {slide.template === 'quote' && (
        <>
          <div className="text-[6px] italic truncate w-full">&ldquo;{String(content.quote || '')}&rdquo;</div>
        </>
      )}
      {slide.template === 'image' && (
        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
          <ImageIcon className="w-3 h-3 text-gray-300" />
        </div>
      )}
    </div>
  )
}

function SlideCanvas({ slide }: { slide: Slide }) {
  const content = slide.content as Record<string, unknown>

  const baseStyles = 'w-full h-full flex flex-col p-12'

  switch (slide.template) {
    case 'title':
      return (
        <div className={cn(baseStyles, 'items-center justify-center text-center')}>
          <h1 className="text-5xl font-bold mb-4">{String(content.title || 'Title')}</h1>
          {Boolean(content.subtitle) && (
            <p className="text-2xl text-gray-500">{String(content.subtitle)}</p>
          )}
        </div>
      )

    case 'content':
      return (
        <div className={baseStyles}>
          <h2 className="text-3xl font-bold mb-6">{String(content.title || 'Title')}</h2>
          <p className="text-xl text-gray-700 leading-relaxed whitespace-pre-wrap">
            {String(content.body || '')}
          </p>
        </div>
      )

    case 'two-column':
      return (
        <div className={baseStyles}>
          <h2 className="text-3xl font-bold mb-6">{String(content.title || 'Title')}</h2>
          <div className="flex-1 grid grid-cols-2 gap-8">
            <div className="text-lg text-gray-700 whitespace-pre-wrap">
              {String(content.left || '')}
            </div>
            <div className="text-lg text-gray-700 whitespace-pre-wrap">
              {String(content.right || '')}
            </div>
          </div>
        </div>
      )

    case 'bullets':
      return (
        <div className={baseStyles}>
          <h2 className="text-3xl font-bold mb-6">{String(content.title || 'Title')}</h2>
          <ul className="space-y-4">
            {((content.bullets as string[]) || []).map((bullet, i) => (
              <li key={i} className="text-xl text-gray-700 flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-blue-500 mt-2.5 flex-shrink-0" />
                {bullet}
              </li>
            ))}
          </ul>
        </div>
      )

    case 'quote':
      return (
        <div className={cn(baseStyles, 'items-center justify-center text-center')}>
          <blockquote className="text-3xl italic text-gray-700 max-w-3xl">
            &ldquo;{String(content.quote || '')}&rdquo;
          </blockquote>
          {Boolean(content.author) && (
            <p className="text-xl text-gray-500 mt-6">— {String(content.author)}</p>
          )}
        </div>
      )

    case 'image':
      return (
        <div className={cn(baseStyles, 'items-center justify-center')}>
          {content.imageUrl ? (
            <img
              src={String(content.imageUrl)}
              alt=""
              className="max-h-[70%] max-w-full object-contain rounded-lg"
            />
          ) : (
            <div className="w-64 h-40 bg-gray-100 rounded-lg flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-gray-300" />
            </div>
          )}
          {Boolean(content.caption) && (
            <p className="text-lg text-gray-500 mt-4">{String(content.caption)}</p>
          )}
        </div>
      )

    default:
      return (
        <div className={cn(baseStyles, 'items-center justify-center')}>
          <p className="text-gray-400">Unknown template</p>
        </div>
      )
  }
}

function SlideEditor({
  slide,
  onContentChange,
}: {
  slide: Slide
  onContentChange: (key: string, value: unknown) => void
}) {
  const content = slide.content as Record<string, unknown>

  switch (slide.template) {
    case 'title':
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label className="mb-1">Title</Label>
            <Input
              value={String(content.title || '')}
              onChange={(e) => onContentChange('title', e.target.value)}
              placeholder="Slide title"
            />
          </div>
          <div>
            <Label className="mb-1">Subtitle</Label>
            <Input
              value={String(content.subtitle || '')}
              onChange={(e) => onContentChange('subtitle', e.target.value)}
              placeholder="Optional subtitle"
            />
          </div>
        </div>
      )

    case 'content':
      return (
        <div className="grid gap-4">
          <div>
            <Label className="mb-1">Title</Label>
            <Input
              value={String(content.title || '')}
              onChange={(e) => onContentChange('title', e.target.value)}
              placeholder="Slide title"
            />
          </div>
          <div>
            <Label className="mb-1">Content</Label>
            <Textarea
              value={String(content.body || '')}
              onChange={(e) => onContentChange('body', e.target.value)}
              placeholder="Slide content..."
              rows={4}
            />
          </div>
        </div>
      )

    case 'two-column':
      return (
        <div className="grid gap-4">
          <div>
            <Label className="mb-1">Title</Label>
            <Input
              value={String(content.title || '')}
              onChange={(e) => onContentChange('title', e.target.value)}
              placeholder="Slide title"
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="mb-1">Left Column</Label>
              <Textarea
                value={String(content.left || '')}
                onChange={(e) => onContentChange('left', e.target.value)}
                placeholder="Left column content..."
                rows={3}
              />
            </div>
            <div>
              <Label className="mb-1">Right Column</Label>
              <Textarea
                value={String(content.right || '')}
                onChange={(e) => onContentChange('right', e.target.value)}
                placeholder="Right column content..."
                rows={3}
              />
            </div>
          </div>
        </div>
      )

    case 'bullets':
      const bullets = (content.bullets as string[]) || []
      return (
        <div className="grid gap-4">
          <div>
            <Label className="mb-1">Title</Label>
            <Input
              value={String(content.title || '')}
              onChange={(e) => onContentChange('title', e.target.value)}
              placeholder="Slide title"
            />
          </div>
          <div>
            <Label className="mb-1">Bullet Points</Label>
            <div className="space-y-2">
              {bullets.map((bullet, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={bullet}
                    onChange={(e) => {
                      const newBullets = [...bullets]
                      newBullets[i] = e.target.value
                      onContentChange('bullets', newBullets)
                    }}
                    placeholder={`Point ${i + 1}`}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const newBullets = bullets.filter((_, idx) => idx !== i)
                      onContentChange('bullets', newBullets)
                    }}
                    disabled={bullets.length <= 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onContentChange('bullets', [...bullets, ''])}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Point
              </Button>
            </div>
          </div>
        </div>
      )

    case 'quote':
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label className="mb-1">Quote</Label>
            <Textarea
              value={String(content.quote || '')}
              onChange={(e) => onContentChange('quote', e.target.value)}
              placeholder="Enter quote..."
              rows={3}
            />
          </div>
          <div>
            <Label className="mb-1">Author</Label>
            <Input
              value={String(content.author || '')}
              onChange={(e) => onContentChange('author', e.target.value)}
              placeholder="Author name"
            />
          </div>
        </div>
      )

    case 'image':
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label className="mb-1">Image URL</Label>
            <Input
              value={String(content.imageUrl || '')}
              onChange={(e) => onContentChange('imageUrl', e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>
          <div>
            <Label className="mb-1">Caption</Label>
            <Input
              value={String(content.caption || '')}
              onChange={(e) => onContentChange('caption', e.target.value)}
              placeholder="Image caption"
            />
          </div>
        </div>
      )

    default:
      return <p className="text-gray-500">No editor available for this template</p>
  }
}
