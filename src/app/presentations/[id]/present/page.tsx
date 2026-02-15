'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { SlideRenderer, DEFAULT_SLIDE_CODE } from '@/components/presentations/SlideRenderer'

interface Slide {
  id: string
  slide_order: number
  code: string
}

export default function PresentationModePage() {
  const params = useParams()
  const router = useRouter()
  const presentationId = params.id as string

  const [slides, setSlides] = useState<Slide[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [slideKey, setSlideKey] = useState(0)

  const fetchSlides = useCallback(async () => {
    const { data } = await supabase
      .from('presentation_slides')
      .select('*')
      .eq('presentation_id', presentationId)
      .order('slide_order', { ascending: true })

    if (data) {
      // Migration: ensure each slide has code
      const migratedSlides = data.map((slide: Record<string, unknown>) => ({
        id: slide.id as string,
        slide_order: slide.slide_order as number,
        code: (slide.code as string) || DEFAULT_SLIDE_CODE
      }))
      setSlides(migratedSlides)
    }
    setLoading(false)
  }, [presentationId])

  useEffect(() => {
    fetchSlides()
  }, [fetchSlides])

  const goNext = useCallback(() => {
    setCurrentIndex((i) => {
      const next = Math.min(i + 1, slides.length - 1)
      if (next !== i) setSlideKey(k => k + 1)
      return next
    })
  }, [slides.length])

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => {
      const prev = Math.max(i - 1, 0)
      if (prev !== i) setSlideKey(k => k + 1)
      return prev
    })
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
          setSlideKey(k => k + 1)
          break
        case 'End':
          setCurrentIndex(slides.length - 1)
          setSlideKey(k => k + 1)
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
        <motion.div 
          className="text-white text-xl"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Loading...
        </motion.div>
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
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide.id + '-' + slideKey}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="w-full h-full max-w-[1920px] max-h-[1080px] aspect-video rounded-lg overflow-hidden shadow-2xl ring-1 ring-white/10"
          >
            <SlideRenderer code={currentSlide.code} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 z-50">
        <span className="text-white/60 text-sm font-medium tabular-nums">
          {currentIndex + 1} / {slides.length}
        </span>
        <div className="flex gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setCurrentIndex(i)
                setSlideKey(k => k + 1)
              }}
              className={cn(
                'h-2 rounded-full transition-all duration-200',
                i === currentIndex
                  ? 'bg-white w-6'
                  : 'bg-white/30 hover:bg-white/50 w-2'
              )}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
