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

interface VisualSpec {
  background?: {
    component?: string
    props?: {
      colors?: string[]
      speed?: number
      blur?: string
      from?: string
      to?: string
      direction?: string
    }
  }
  layout?: {
    textAlign?: string
    verticalAlign?: string
    padding?: string
  }
  typography?: {
    titleSize?: string
    titleWeight?: string
    titleEffect?: string
    titleColor?: string
    bodySize?: string
    fontFamily?: string
  }
  decorations?: Array<{
    component?: string
    element?: string
    position?: { top?: string; left?: string; right?: string; bottom?: string }
    size?: string
    style?: string
    props?: {
      speed?: number
      amplitude?: number[]
      rotationRange?: number[]
      timeOffset?: number
    }
  }>
  animations?: {
    entrance?: string
    stagger?: boolean
    staggerDelay?: number
    duration?: number
  }
  colorScheme?: string
}

interface Palette {
  primary?: string[]
  secondary?: string[]
  accent?: string
  background?: { light?: string; dark?: string }
  gradient?: string[]
}

interface Slide {
  id: string
  slide_order: number
  template: string
  content: Record<string, unknown> & {
    _visual?: VisualSpec
    _palette?: Palette
    _brandStyle?: string
  }
}

const DEFAULT_GRADIENT = ['#0ea5e9', '#6366f1', '#8b5cf6', '#d946ef']

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
            <DesignedSlide slide={currentSlide} slideKey={slideKey} />
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

// Render decorations from visual spec
function RenderDecorations({ decorations }: { decorations?: VisualSpec['decorations'] }) {
  if (!decorations?.length) return null
  
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {decorations.map((dec, i) => {
        if (dec.component === 'float') {
          const posStyle: React.CSSProperties = {}
          if (dec.position?.top) posStyle.top = dec.position.top
          if (dec.position?.left) posStyle.left = dec.position.left
          if (dec.position?.right) posStyle.right = dec.position.right
          if (dec.position?.bottom) posStyle.bottom = dec.position.bottom
          
          return (
            <div key={i} className="absolute" style={posStyle}>
              <Float
                speed={dec.props?.speed || 0.3}
                amplitude={(dec.props?.amplitude as [number, number, number]) || [20, 15, 0]}
                rotationRange={(dec.props?.rotationRange as [number, number, number]) || [5, 5, 3]}
                timeOffset={dec.props?.timeOffset || i * 1.5}
              >
                {dec.element === 'orb' && (
                  <div className={cn(dec.size || 'w-32 h-32', dec.style || 'rounded-full bg-white/10 blur-xl')} />
                )}
                {dec.element === 'quote-mark' && (
                  <div className="text-[200px] text-white/5 font-serif leading-none">
                    {dec.position?.left ? '"' : '"'}
                  </div>
                )}
              </Float>
            </div>
          )
        }
        return null
      })}
    </div>
  )
}

// Get entrance animation variants
function getEntranceAnimation(entrance?: string, index = 0, staggerDelay = 0.1) {
  const delay = index * staggerDelay
  
  switch (entrance) {
    case 'fade-up':
      return {
        initial: { opacity: 0, y: 30 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, delay }
      }
    case 'slide-left':
      return {
        initial: { opacity: 0, x: -40 },
        animate: { opacity: 1, x: 0 },
        transition: { duration: 0.5, delay }
      }
    case 'slide-right':
      return {
        initial: { opacity: 0, x: 40 },
        animate: { opacity: 1, x: 0 },
        transition: { duration: 0.5, delay }
      }
    case 'scale':
      return {
        initial: { opacity: 0, scale: 0.9 },
        animate: { opacity: 1, scale: 1 },
        transition: { duration: 0.5, delay }
      }
    default:
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.5, delay }
      }
  }
}

function DesignedSlide({ slide, slideKey }: { slide: Slide; slideKey: number }) {
  const content = slide.content
  const visual = content._visual || {}
  const palette = content._palette || {}
  
  const typography = visual.typography || {}
  const animations = visual.animations || {}
  const background = visual.background || {}
  const colorScheme = visual.colorScheme || 'light'
  
  // Get colors
  const gradientColors = background.props?.colors || palette.gradient || DEFAULT_GRADIENT
  const accentColor = typeof palette.accent === 'string' ? palette.accent : palette.primary?.[0] || '#6366f1'
  
  // Typography classes
  const titleSizeClass = `text-${typography.titleSize || '5xl'}`
  const titleWeightClass = `font-${typography.titleWeight || 'bold'}`
  const bodySizeClass = `text-${typography.bodySize || '2xl'}`
  const fontFamily = typography.fontFamily === 'georgia' ? 'Georgia, serif' : 'Inter, system-ui, sans-serif'
  
  // Render title with effect
  const renderTitle = (text: string, className: string) => {
    if (typography.titleEffect === 'typewriter') {
      return (
        <Typewriter 
          key={slideKey}
          text={text}
          speed={35}
          className={className}
        />
      )
    }
    
    const anim = getEntranceAnimation(animations.entrance, 0)
    return (
      <motion.span {...anim} className={className}>
        {text}
      </motion.span>
    )
  }

  // Background component
  const renderBackground = () => {
    if (background.component === 'animated-gradient-with-svg') {
      return (
        <AnimatedGradient 
          colors={gradientColors} 
          speed={background.props?.speed || 6} 
          blur={(background.props?.blur as 'light' | 'medium' | 'heavy') || 'heavy'} 
        />
      )
    }
    
    if (background.component === 'solid-gradient') {
      return (
        <div 
          className={cn('absolute inset-0', `bg-gradient-${background.props?.direction || 'to-br'}`)}
          style={{
            background: `linear-gradient(to bottom right, ${background.props?.from || '#f8fafc'}, ${background.props?.to || '#e2e8f0'})`
          }}
        />
      )
    }
    
    return null
  }

  // Base styles
  const isDark = colorScheme === 'dark'
  const bgClass = isDark ? 'bg-slate-900' : 'bg-white'
  const textClass = isDark ? 'text-white' : 'text-slate-800'
  const subtextClass = isDark ? 'text-white/70' : 'text-slate-600'

  switch (slide.template) {
    case 'title':
      return (
        <div className={cn('w-full h-full flex flex-col items-center justify-center text-center relative overflow-hidden', bgClass)}>
          {renderBackground()}
          <RenderDecorations decorations={visual.decorations} />
          
          <div className="relative z-10 px-16">
            <h1 
              className={cn(titleSizeClass, titleWeightClass, isDark ? 'text-white drop-shadow-2xl' : textClass)}
              style={{ fontFamily }}
            >
              {renderTitle(String(content.title || 'Title'), 'inline')}
            </h1>
            {Boolean(content.subtitle) && (
              <motion.p 
                className={cn('text-3xl font-light mt-6', isDark ? 'text-white/90' : subtextClass)}
                {...getEntranceAnimation(animations.entrance, 1, animations.staggerDelay)}
                style={{ fontFamily }}
              >
                {String(content.subtitle)}
              </motion.p>
            )}
          </div>
        </div>
      )

    case 'content':
      return (
        <div className={cn('w-full h-full flex flex-col p-16 relative overflow-hidden', bgClass)}>
          {renderBackground()}
          
          <h2 
            className={cn(titleSizeClass, titleWeightClass, textClass, 'mb-10 relative z-10')}
            style={{ fontFamily }}
          >
            {renderTitle(String(content.title || 'Title'), 'inline')}
          </h2>
          <motion.p 
            className={cn(bodySizeClass, subtextClass, 'leading-relaxed whitespace-pre-wrap flex-1 relative z-10')}
            {...getEntranceAnimation(animations.entrance, 1, animations.staggerDelay)}
            style={{ fontFamily }}
          >
            {String(content.body || '')}
          </motion.p>
        </div>
      )

    case 'two-column':
      return (
        <div className={cn('w-full h-full flex flex-col p-16', bgClass)}>
          <h2 
            className={cn(titleSizeClass, titleWeightClass, textClass, 'mb-10')}
            style={{ fontFamily }}
          >
            {renderTitle(String(content.title || 'Title'), 'inline')}
          </h2>
          <div className="flex-1 grid grid-cols-2 gap-12">
            <motion.div 
              className={cn(bodySizeClass, subtextClass, 'whitespace-pre-wrap p-8 rounded-2xl border-2')}
              style={{ 
                backgroundColor: `${accentColor}10`,
                borderColor: `${accentColor}30`,
                fontFamily
              }}
              {...getEntranceAnimation('slide-left', 0)}
            >
              {String(content.left || '')}
            </motion.div>
            <motion.div 
              className={cn(bodySizeClass, subtextClass, 'whitespace-pre-wrap p-8 rounded-2xl border-2')}
              style={{ 
                backgroundColor: `${palette.secondary?.[0] || '#8b5cf6'}10`,
                borderColor: `${palette.secondary?.[0] || '#8b5cf6'}30`,
                fontFamily
              }}
              {...getEntranceAnimation('slide-right', 0)}
            >
              {String(content.right || '')}
            </motion.div>
          </div>
        </div>
      )

    case 'bullets':
      const bullets = (content.bullets as string[]) || []
      return (
        <div className={cn('w-full h-full flex flex-col p-16', bgClass)}>
          <h2 
            className={cn(titleSizeClass, titleWeightClass, textClass, 'mb-10')}
            style={{ fontFamily }}
          >
            {renderTitle(String(content.title || 'Title'), 'inline')}
          </h2>
          <ul className="space-y-5 flex-1">
            {bullets.map((bullet, i) => (
              <motion.li 
                key={i} 
                className={cn(bodySizeClass, subtextClass, 'flex items-start gap-4')}
                {...getEntranceAnimation(animations.entrance || 'slide-left', i, animations.staggerDelay || 0.1)}
                style={{ fontFamily }}
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
                      background: `linear-gradient(135deg, ${accentColor}, ${palette.primary?.[1] || accentColor})`,
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
      return (
        <div className="w-full h-full flex flex-col items-center justify-center text-center relative overflow-hidden bg-slate-900">
          <div className="absolute inset-0 opacity-40">
            <AnimatedGradient 
              colors={gradientColors} 
              speed={8} 
              blur="heavy" 
            />
          </div>
          
          <RenderDecorations decorations={visual.decorations} />
          
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
                {...getEntranceAnimation('fade', 0)}
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
        <div className={cn('w-full h-full flex flex-col items-center justify-center p-16', bgClass)}>
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
              className={cn(bodySizeClass, subtextClass, 'mt-8')}
              {...getEntranceAnimation('fade', 0)}
              style={{ fontFamily }}
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
