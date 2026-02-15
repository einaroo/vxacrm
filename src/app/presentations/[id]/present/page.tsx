'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { X, ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react'
import AnimatedGradient from '@/components/fancy/background/animated-gradient-with-svg'

interface Slide {
  id: string
  slide_order: number
  template: string
  content: Record<string, unknown>
}

export default function PresentationModePage() {
  const params = useParams()
  const router = useRouter()
  const presentationId = params.id as string

  const [slides, setSlides] = useState<Slide[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchSlides = useCallback(async () => {
    const { data } = await supabase
      .from('presentation_slides')
      .select('*')
      .eq('presentation_id', presentationId)
      .order('slide_order', { ascending: true })

    if (data) setSlides(data)
    setLoading(false)
  }, [presentationId])

  useEffect(() => {
    fetchSlides()
  }, [fetchSlides])

  const goNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(i + 1, slides.length - 1))
  }, [slides.length])

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(i - 1, 0))
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ':
        case 'Enter':
          e.preventDefault()
          goNext()
          break
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault()
          goPrev()
          break
        case 'Escape':
          router.push(`/presentations/${presentationId}`)
          break
        case 'Home':
          setCurrentIndex(0)
          break
        case 'End':
          setCurrentIndex(slides.length - 1)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [slides.length, presentationId, router, goNext, goPrev])

  const currentSlide = slides[currentIndex]

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!currentSlide) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-white">No slides found</div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Controls */}
      <div className="absolute top-4 right-4 z-50 flex gap-2 opacity-0 hover:opacity-100 transition-opacity">
        <button
          onClick={() => router.push(`/presentations/${presentationId}`)}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <button
        onClick={goPrev}
        disabled={currentIndex === 0}
        className={cn(
          'absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all',
          currentIndex === 0 && 'opacity-30 cursor-not-allowed'
        )}
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={goNext}
        disabled={currentIndex === slides.length - 1}
        className={cn(
          'absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all',
          currentIndex === slides.length - 1 && 'opacity-30 cursor-not-allowed'
        )}
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Slide */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full h-full max-w-[1920px] max-h-[1080px] aspect-video bg-white rounded-lg overflow-hidden shadow-2xl">
          <PresentSlide slide={currentSlide} />
        </div>
      </div>

      {/* Progress */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 z-50">
        <span className="text-white/60 text-sm">
          {currentIndex + 1} / {slides.length}
        </span>
        <div className="flex gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={cn(
                'w-2 h-2 rounded-full transition-all',
                i === currentIndex
                  ? 'bg-white w-6'
                  : 'bg-white/30 hover:bg-white/50'
              )}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function PresentSlide({ slide }: { slide: Slide }) {
  const content = slide.content as Record<string, unknown>
  const baseStyles = 'w-full h-full flex flex-col p-16'

  switch (slide.template) {
    case 'title':
      return (
        <div className={cn(baseStyles, 'items-center justify-center text-center relative overflow-hidden')}>
          <AnimatedGradient 
            colors={['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981']} 
            speed={8} 
            blur="heavy" 
          />
          <div className="relative z-10">
            <h1 className="text-7xl font-bold mb-6 text-white drop-shadow-lg">{String(content.title || 'Title')}</h1>
            {Boolean(content.subtitle) && (
              <p className="text-3xl text-white/80">{String(content.subtitle)}</p>
            )}
          </div>
        </div>
      )

    case 'content':
      return (
        <div className={baseStyles}>
          <h2 className="text-5xl font-bold mb-10">{String(content.title || 'Title')}</h2>
          <p className="text-3xl text-gray-700 leading-relaxed whitespace-pre-wrap flex-1">
            {String(content.body || '')}
          </p>
        </div>
      )

    case 'two-column':
      return (
        <div className={baseStyles}>
          <h2 className="text-5xl font-bold mb-10">{String(content.title || 'Title')}</h2>
          <div className="flex-1 grid grid-cols-2 gap-16">
            <div className="text-2xl text-gray-700 whitespace-pre-wrap">
              {String(content.left || '')}
            </div>
            <div className="text-2xl text-gray-700 whitespace-pre-wrap">
              {String(content.right || '')}
            </div>
          </div>
        </div>
      )

    case 'bullets':
      return (
        <div className={baseStyles}>
          <h2 className="text-5xl font-bold mb-10">{String(content.title || 'Title')}</h2>
          <ul className="space-y-6 flex-1">
            {((content.bullets as string[]) || []).map((bullet, i) => (
              <li key={i} className="text-3xl text-gray-700 flex items-start gap-4">
                <span className="w-3 h-3 rounded-full bg-blue-500 mt-3 flex-shrink-0" />
                {bullet}
              </li>
            ))}
          </ul>
        </div>
      )

    case 'quote':
      return (
        <div className={cn(baseStyles, 'items-center justify-center text-center relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800')}>
          <div className="absolute inset-0 opacity-20">
            <AnimatedGradient 
              colors={['#6366f1', '#8b5cf6', '#a855f7']} 
              speed={10} 
              blur="heavy" 
            />
          </div>
          <div className="relative z-10">
            <blockquote className="text-5xl italic text-white max-w-4xl leading-relaxed">
              &ldquo;{String(content.quote || '')}&rdquo;
            </blockquote>
            {Boolean(content.author) && (
              <p className="text-2xl text-white/70 mt-10">— {String(content.author)}</p>
            )}
          </div>
        </div>
      )

    case 'image':
      return (
        <div className={cn(baseStyles, 'items-center justify-center')}>
          {content.imageUrl ? (
            <img
              src={String(content.imageUrl)}
              alt=""
              className="max-h-[75%] max-w-full object-contain rounded-xl"
            />
          ) : (
            <div className="w-96 h-64 bg-gray-100 rounded-xl flex items-center justify-center">
              <ImageIcon className="w-16 h-16 text-gray-300" />
            </div>
          )}
          {Boolean(content.caption) && (
            <p className="text-2xl text-gray-500 mt-8">{String(content.caption)}</p>
          )}
        </div>
      )

    default:
      return (
        <div className={cn(baseStyles, 'items-center justify-center')}>
          <p className="text-gray-400 text-2xl">Unknown template</p>
        </div>
      )
  }
}
