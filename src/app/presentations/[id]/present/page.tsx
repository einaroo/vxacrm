'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { X, ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
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
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full max-w-[1920px] max-h-[1080px] aspect-video bg-white rounded-lg overflow-hidden shadow-2xl"
          >
            <PresentSlide slide={currentSlide} />
          </motion.div>
        </AnimatePresence>
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
            colors={['#0ea5e9', '#6366f1', '#8b5cf6', '#d946ef']} 
            speed={6} 
            blur="heavy" 
          />
          <motion.div 
            className="relative z-10"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h1 className="text-7xl font-bold mb-6 text-white drop-shadow-2xl">
              {String(content.title || 'Title')}
            </h1>
            {Boolean(content.subtitle) && (
              <motion.p 
                className="text-3xl text-white/90 font-light"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                {String(content.subtitle)}
              </motion.p>
            )}
          </motion.div>
        </div>
      )

    case 'content':
      return (
        <div className={cn(baseStyles, 'bg-gradient-to-br from-slate-50 to-slate-100')}>
          <motion.h2 
            className="text-5xl font-bold mb-10 bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent"
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {String(content.title || 'Title')}
          </motion.h2>
          <motion.p 
            className="text-3xl text-slate-600 leading-relaxed whitespace-pre-wrap flex-1"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {String(content.body || '')}
          </motion.p>
        </div>
      )

    case 'two-column':
      return (
        <div className={cn(baseStyles, 'bg-white')}>
          <motion.h2 
            className="text-5xl font-bold mb-10 text-slate-800"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {String(content.title || 'Title')}
          </motion.h2>
          <div className="flex-1 grid grid-cols-2 gap-16">
            <motion.div 
              className="text-2xl text-slate-700 whitespace-pre-wrap p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl"
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {String(content.left || '')}
            </motion.div>
            <motion.div 
              className="text-2xl text-slate-700 whitespace-pre-wrap p-8 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl"
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {String(content.right || '')}
            </motion.div>
          </div>
        </div>
      )

    case 'bullets':
      const bullets = (content.bullets as string[]) || []
      return (
        <div className={cn(baseStyles, 'bg-gradient-to-br from-white to-slate-50')}>
          <motion.h2 
            className="text-5xl font-bold mb-10 text-slate-800"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {String(content.title || 'Title')}
          </motion.h2>
          <ul className="space-y-6 flex-1">
            {bullets.map((bullet, i) => (
              <motion.li 
                key={i} 
                className="text-3xl text-slate-700 flex items-start gap-4"
                initial={{ x: -40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.1 + i * 0.1 }}
              >
                <span className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 mt-2.5 flex-shrink-0 shadow-lg shadow-blue-500/30" />
                {bullet}
              </motion.li>
            ))}
          </ul>
        </div>
      )

    case 'quote':
      return (
        <div className={cn(baseStyles, 'items-center justify-center text-center relative overflow-hidden bg-slate-900')}>
          <div className="absolute inset-0 opacity-30">
            <AnimatedGradient 
              colors={['#6366f1', '#8b5cf6', '#a855f7', '#d946ef']} 
              speed={8} 
              blur="heavy" 
            />
          </div>
          <motion.div 
            className="relative z-10"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-6xl text-purple-400 mb-4">&ldquo;</div>
            <blockquote className="text-4xl italic text-white max-w-4xl leading-relaxed font-light">
              {String(content.quote || '')}
            </blockquote>
            {Boolean(content.author) && (
              <motion.p 
                className="text-2xl text-white/70 mt-10"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                — {String(content.author)}
              </motion.p>
            )}
          </motion.div>
        </div>
      )

    case 'image':
      return (
        <div className={cn(baseStyles, 'items-center justify-center bg-slate-50')}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {content.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={String(content.imageUrl)}
                alt=""
                className="max-h-[75%] max-w-full object-contain rounded-xl shadow-2xl"
              />
            ) : (
              <div className="w-96 h-64 bg-gradient-to-br from-slate-200 to-slate-300 rounded-xl flex items-center justify-center shadow-inner">
                <ImageIcon className="w-16 h-16 text-slate-400" />
              </div>
            )}
          </motion.div>
          {Boolean(content.caption) && (
            <motion.p 
              className="text-2xl text-slate-600 mt-8"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {String(content.caption)}
            </motion.p>
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
