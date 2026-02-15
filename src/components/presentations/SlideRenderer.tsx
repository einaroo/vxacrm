'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { LiveProvider, LivePreview, LiveError } from 'react-live'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

// Fancy Components
import AnimatedGradient from '@/components/fancy/background/animated-gradient-with-svg'
import Float from '@/components/fancy/blocks/float'
import SimpleMarquee from '@/components/fancy/blocks/simple-marquee'
import Typewriter from '@/components/fancy/text/typewriter'
import TextRotate from '@/components/fancy/text/text-rotate'
import LetterSwap from '@/components/fancy/text/letter-swap-forward-anim'
import GooeyFilter from '@/components/fancy/filter/gooey-svg-filter'
import CssBox from '@/components/fancy/blocks/css-box'

interface SlideRendererProps {
  code: string
  className?: string
}

// Inner component that uses react-live (only rendered client-side)
function LiveSlide({ code }: { code: string }) {
  // Scope must be defined inside the component to ensure client-side only
  const scope = {
    React,
    useState,
    useEffect,
    useCallback,
    motion,
    AnimatePresence,
    AnimatedGradient,
    Float,
    SimpleMarquee,
    Typewriter,
    TextRotate,
    LetterSwap,
    GooeyFilter,
    CssBox,
    cn,
  }

  return (
    <LiveProvider code={code} scope={scope} noInline={false}>
      <LivePreview 
        Component={({ children }) => <div className="w-full h-full">{children}</div>}
      />
      <LiveError className="absolute inset-0 bg-red-900/95 text-white p-6 text-sm font-mono overflow-auto z-50" />
    </LiveProvider>
  )
}

export function SlideRenderer({ code, className }: SlideRendererProps) {
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  // If no code or empty, show placeholder
  if (!code || code.trim() === '') {
    return (
      <div className={cn('w-full h-full flex items-center justify-center bg-slate-900 text-slate-400', className)}>
        No slide code
      </div>
    )
  }
  
  // Wait for client-side hydration
  if (!isClient) {
    return (
      <div className={cn('w-full h-full bg-gradient-to-br from-slate-900 to-slate-800', className)}>
        <div className="w-full h-full flex items-center justify-center">
          <div className="animate-pulse text-slate-500">Loading preview...</div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('w-full h-full overflow-hidden relative', className)}>
      <LiveSlide code={code} />
    </div>
  )
}

// Default starter code for new slides
export const DEFAULT_SLIDE_CODE = `<motion.div 
  className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col items-center justify-center p-12"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.5 }}
>
  <motion.h1 
    className="text-5xl font-bold text-white mb-4"
    initial={{ y: 20, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ delay: 0.2 }}
  >
    Slide Title
  </motion.h1>
  <motion.p 
    className="text-xl text-slate-300"
    initial={{ y: 20, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ delay: 0.4 }}
  >
    Your content here
  </motion.p>
</motion.div>`

// Brand style starter templates
export const BRAND_TEMPLATES = {
  professional: `<motion.div 
  className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-16 relative overflow-hidden"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
>
  <Float speed={0.2} amplitude={[10, 8, 0]} rotationRange={[2, 2, 1]}>
    <motion.h1 
      className="text-6xl font-light tracking-tight text-white mb-6"
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      Professional Title
    </motion.h1>
  </Float>
  <motion.div 
    className="w-24 h-1 bg-blue-500 mb-8"
    initial={{ scaleX: 0 }}
    animate={{ scaleX: 1 }}
    transition={{ delay: 0.4, duration: 0.6 }}
  />
  <motion.p 
    className="text-2xl text-slate-400 font-light"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.6 }}
  >
    Subtitle or tagline
  </motion.p>
</motion.div>`,

  bold: `<motion.div 
  className="w-full h-full bg-black flex flex-col items-center justify-center p-12 relative overflow-hidden"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
>
  <div className="absolute inset-0">
    <AnimatedGradient colors={["#f97316", "#ef4444", "#ec4899"]} speed={4} blur="heavy" />
  </div>
  <motion.h1 
    className="text-8xl font-black text-white uppercase tracking-tighter relative z-10 drop-shadow-2xl"
    initial={{ scale: 0.5, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ type: "spring", damping: 10 }}
  >
    BOLD
  </motion.h1>
  <motion.p 
    className="text-2xl text-orange-400 font-bold mt-4 relative z-10"
    initial={{ x: -50, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    transition={{ delay: 0.3 }}
  >
    Make a statement
  </motion.p>
</motion.div>`,

  creative: `<motion.div 
  className="w-full h-full flex flex-col items-center justify-center p-12 relative overflow-hidden"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
>
  <div className="absolute inset-0">
    <AnimatedGradient colors={["#8b5cf6", "#7c3aed", "#6366f1", "#ec4899"]} speed={6} blur="medium" />
  </div>
  <Float speed={0.3} amplitude={[15, 12, 0]} rotationRange={[3, 3, 2]}>
    <motion.h1 
      className="text-6xl font-bold text-white relative z-10 drop-shadow-lg"
      initial={{ rotateX: 90, opacity: 0 }}
      animate={{ rotateX: 0, opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      ✨ Creative
    </motion.h1>
  </Float>
  <motion.p 
    className="text-xl text-white/80 mt-6 relative z-10"
    initial={{ y: 20, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ delay: 0.5 }}
  >
    Unleash imagination
  </motion.p>
</motion.div>`,

  minimal: `<motion.div 
  className="w-full h-full bg-white flex flex-col items-center justify-center p-16"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
>
  <Typewriter 
    text="Minimal"
    speed={80}
    className="text-5xl font-extralight text-slate-900 tracking-wide"
  />
  <motion.div 
    className="w-8 h-px bg-slate-300 my-8"
    initial={{ scaleX: 0 }}
    animate={{ scaleX: 1 }}
    transition={{ delay: 0.8, duration: 0.6 }}
  />
  <motion.p 
    className="text-lg text-slate-500 font-light"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 1.2 }}
  >
    Less is more
  </motion.p>
</motion.div>`,

  tech: `<motion.div 
  className="w-full h-full bg-slate-950 flex flex-col items-center justify-center p-12 relative overflow-hidden"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
>
  <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,150,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,150,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
  <motion.div 
    className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-emerald-500/50 to-transparent"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.5 }}
  />
  <Float speed={0.25} amplitude={[8, 6, 0]} rotationRange={[1, 1, 0]}>
    <motion.h1 
      className="text-6xl font-mono font-bold text-emerald-400 relative z-10"
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring" }}
    >
      {"<Tech/>"}
    </motion.h1>
  </Float>
  <motion.p 
    className="text-lg text-slate-500 font-mono mt-6 relative z-10"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.4 }}
  >
    // innovation.driven()
  </motion.p>
</motion.div>`,
}
