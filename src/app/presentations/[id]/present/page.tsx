'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { X, ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import AnimatedGradient from '@/components/fancy/background/animated-gradient-with-svg'
import Float from '@/components/fancy/blocks/float'
import Typewriter from '@/components/fancy/text/typewriter'

interface SlideDesign {
  background?: {
    type?: string
    colors?: string[]
    component?: string
  }
  titleEffect?: string
  animation?: {
    entrance?: string
    stagger?: boolean
    duration?: number
  }
  decorations?: Array<{
    component?: string
    position?: string
    content?: string
  }>
  accentColor?: string
}

interface Slide {
  id: string
  slide_order: number
  template: string
  content: Record<string, unknown> & {
    _design?: SlideDesign
    _palette?: {
      primary?: string[]
      secondary?: string[]
      accent?: string[]
      background?: string
    }
  }
}

// Default color palettes
const DEFAULT_COLORS = {
  title: ['#0ea5e9', '#6366f1', '#8b5cf6', '#d946ef'],
  quote: ['#4f46e5', '#7c3aed', '#a855f7', '#ec4899'],
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

    if (data) setSlides(data)
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
            key={currentSlide.id + '-' + slideKey}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="w-full h-full max-w-[1920px] max-h-[1080px] aspect-video rounded-lg overflow-hidden shadow-2xl"
          >
            <PresentSlide slide={currentSlide} slideKey={slideKey} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 z-50">
        <span className="text-white/60 text-sm font-medium">
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

function PresentSlide({ slide, slideKey }: { slide: Slide; slideKey: number }) {
  const content = slide.content
  const design = content._design
  const palette = content._palette
  
  // Get colors from design or use defaults
  const getColors = (defaultColors: string[]) => {
    if (design?.background?.colors?.length) return design.background.colors
    if (palette?.primary?.length) return palette.primary
    return defaultColors
  }
  
  const accentColor = design?.accentColor || palette?.accent?.[0] || '#6366f1'
  const animDuration = design?.animation?.duration || 0.5

  // Render animated title based on design
  const renderTitle = (text: string, className: string) => {
    const effect = design?.titleEffect || 'typewriter'
    
    if (effect === 'typewriter') {
      return (
        <Typewriter 
          key={slideKey}
          text={text}
          speed={35}
          className={className}
        />
      )
    }
    
    return (
      <motion.span
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: animDuration }}
        className={className}
      >
        {text}
      </motion.span>
    )
  }

  switch (slide.template) {
    case 'title':
      const titleColors = getColors(DEFAULT_COLORS.title)
      return (
        <div className="w-full h-full flex flex-col items-center justify-center text-center relative overflow-hidden">
          {/* Animated Gradient Background */}
          <AnimatedGradient 
            colors={titleColors} 
            speed={6} 
            blur="heavy" 
          />
          
          {/* Floating Decorative Elements */}
          <div className="absolute inset-0 pointer-events-none">
            <Float speed={0.3} amplitude={[20, 15, 0]} rotationRange={[5, 5, 3]} timeOffset={0}>
              <div className="absolute top-[15%] left-[10%] w-32 h-32 rounded-full bg-white/10 blur-xl" />
            </Float>
            <Float speed={0.4} amplitude={[15, 20, 0]} rotationRange={[3, 8, 2]} timeOffset={2}>
              <div className="absolute bottom-[20%] right-[15%] w-40 h-40 rounded-full bg-white/10 blur-xl" />
            </Float>
            <Float speed={0.25} amplitude={[25, 10, 0]} rotationRange={[4, 4, 5]} timeOffset={4}>
              <div className="absolute top-[40%] right-[8%] w-24 h-24 rounded-full bg-white/5 blur-lg" />
            </Float>
          </div>
          
          {/* Content */}
          <div className="relative z-10 px-16">
            <h1 className="text-7xl font-bold mb-6 text-white drop-shadow-2xl" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
              {renderTitle(String(content.title || 'Title'), 'inline')}
            </h1>
            {Boolean(content.subtitle) && (
              <motion.p 
                className="text-3xl text-white/90 font-light"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
              >
                {String(content.subtitle)}
              </motion.p>
            )}
          </div>
        </div>
      )

    case 'content':
      return (
        <div className="w-full h-full flex flex-col p-16 bg-gradient-to-br from-slate-50 to-white">
          <h2 
            className="text-5xl font-bold mb-10 bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent"
            style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
          >
            {renderTitle(String(content.title || 'Title'), 'inline')}
          </h2>
          <motion.p 
            className="text-2xl text-slate-600 leading-relaxed whitespace-pre-wrap flex-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: animDuration, delay: 0.3 }}
            style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
          >
            {String(content.body || '')}
          </motion.p>
        </div>
      )

    case 'two-column':
      return (
        <div className="w-full h-full flex flex-col p-16 bg-white">
          <h2 
            className="text-5xl font-bold mb-10 text-slate-800"
            style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
          >
            {renderTitle(String(content.title || 'Title'), 'inline')}
          </h2>
          <div className="flex-1 grid grid-cols-2 gap-12">
            <motion.div 
              className="text-xl text-slate-700 whitespace-pre-wrap p-8 rounded-2xl border-2"
              style={{ 
                backgroundColor: `${accentColor}10`,
                borderColor: `${accentColor}30`,
                fontFamily: 'Inter, system-ui, sans-serif'
              }}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: animDuration, delay: 0.3 }}
            >
              {String(content.left || '')}
            </motion.div>
            <motion.div 
              className="text-xl text-slate-700 whitespace-pre-wrap p-8 rounded-2xl border-2"
              style={{ 
                backgroundColor: `${palette?.secondary?.[0] || '#8b5cf6'}10`,
                borderColor: `${palette?.secondary?.[0] || '#8b5cf6'}30`,
                fontFamily: 'Inter, system-ui, sans-serif'
              }}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: animDuration, delay: 0.4 }}
            >
              {String(content.right || '')}
            </motion.div>
          </div>
        </div>
      )

    case 'bullets':
      const bullets = (content.bullets as string[]) || []
      return (
        <div className="w-full h-full flex flex-col p-16 bg-gradient-to-br from-white to-slate-50">
          <h2 
            className="text-5xl font-bold mb-10 text-slate-800"
            style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
          >
            {renderTitle(String(content.title || 'Title'), 'inline')}
          </h2>
          <ul className="space-y-5 flex-1">
            {bullets.map((bullet, i) => (
              <motion.li 
                key={i} 
                className="text-2xl text-slate-700 flex items-start gap-4"
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
                style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
              >
                <Float 
                  speed={0.5} 
                  amplitude={[2, 3, 0]} 
                  rotationRange={[0, 0, 5]}
                  timeOffset={i * 0.5}
                >
                  <span 
                    className="w-4 h-4 rounded-full mt-2 flex-shrink-0 shadow-lg"
                    style={{ 
                      background: `linear-gradient(135deg, ${accentColor}, ${palette?.primary?.[1] || '#8b5cf6'})`,
                      boxShadow: `0 4px 14px ${accentColor}40`
                    }}
                  />
                </Float>
                <span>{bullet}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      )

    case 'quote':
      const quoteColors = getColors(DEFAULT_COLORS.quote)
      return (
        <div className="w-full h-full flex flex-col items-center justify-center text-center relative overflow-hidden bg-slate-900">
          {/* Animated Gradient Overlay */}
          <div className="absolute inset-0 opacity-40">
            <AnimatedGradient 
              colors={quoteColors} 
              speed={8} 
              blur="heavy" 
            />
          </div>
          
          {/* Floating Quote Marks */}
          <Float speed={0.2} amplitude={[30, 20, 0]} rotationRange={[5, 10, 5]} className="absolute top-[10%] left-[5%]">
            <div className="text-[200px] text-white/5 font-serif leading-none">&ldquo;</div>
          </Float>
          <Float speed={0.2} amplitude={[20, 30, 0]} rotationRange={[8, 5, 3]} timeOffset={3} className="absolute bottom-[10%] right-[5%]">
            <div className="text-[200px] text-white/5 font-serif leading-none">&rdquo;</div>
          </Float>
          
          {/* Quote Content */}
          <div className="relative z-10 px-20 max-w-5xl">
            <blockquote 
              className="text-4xl italic text-white leading-relaxed font-light"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              <Typewriter 
                key={slideKey}
                text={String(content.quote || '')}
                speed={25}
              />
            </blockquote>
            {Boolean(content.author) && (
              <motion.p 
                className="text-2xl text-white/70 mt-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1 }}
                style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
              >
                — {String(content.author)}
              </motion.p>
            )}
          </div>
        </div>
      )

    case 'image':
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-16 bg-slate-50">
          <Float speed={0.15} amplitude={[5, 8, 0]} rotationRange={[1, 1, 0]}>
            {content.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={String(content.imageUrl)}
                alt=""
                className="max-h-[70vh] max-w-full object-contain rounded-xl shadow-2xl"
              />
            ) : (
              <div className="w-96 h-64 bg-gradient-to-br from-slate-200 to-slate-300 rounded-xl flex items-center justify-center shadow-inner">
                <ImageIcon className="w-16 h-16 text-slate-400" />
              </div>
            )}
          </Float>
          {Boolean(content.caption) && (
            <motion.p 
              className="text-2xl text-slate-600 mt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
            >
              {String(content.caption)}
            </motion.p>
          )}
        </div>
      )

    default:
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-white">
          <p className="text-gray-400 text-2xl">Unknown template</p>
        </div>
      )
  }
}
