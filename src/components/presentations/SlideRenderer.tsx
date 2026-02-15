'use client'

import React, { useState, useEffect } from 'react'
import { LiveProvider, LivePreview, LiveError } from 'react-live'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

// Scope: all components/utilities available in slide code
const scope = {
  // React
  React,
  useState,
  useEffect,
  
  // Motion
  motion,
  AnimatePresence,
  
  // Utilities
  cn,
  
  // Common elements (shortcuts)
  div: 'div',
  span: 'span',
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  p: 'p',
  ul: 'ul',
  li: 'li',
  img: 'img',
}

interface SlideRendererProps {
  code: string
  className?: string
}

export function SlideRenderer({ code, className }: SlideRendererProps) {
  // Wrap user code in a render function that returns the JSX
  const wrappedCode = `
    <div className="w-full h-full">
      ${code}
    </div>
  `

  return (
    <div className={cn('w-full h-full overflow-hidden', className)}>
      <LiveProvider code={wrappedCode} scope={scope} noInline={false}>
        <LivePreview className="w-full h-full" />
        <LiveError 
          className="absolute inset-0 bg-red-900/90 text-white p-4 text-sm font-mono overflow-auto"
        />
      </LiveProvider>
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
  className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-16"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
>
  <motion.h1 
    className="text-6xl font-light tracking-tight text-white mb-6"
    initial={{ y: 30, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ duration: 0.8, ease: "easeOut" }}
  >
    Professional Title
  </motion.h1>
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
  <motion.div 
    className="absolute inset-0 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 opacity-20"
    animate={{ 
      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
    }}
    transition={{ duration: 5, repeat: Infinity }}
  />
  <motion.h1 
    className="text-8xl font-black text-white uppercase tracking-tighter relative z-10"
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
  className="w-full h-full bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 flex flex-col items-center justify-center p-12 relative"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
>
  <motion.div 
    className="absolute top-20 left-20 w-32 h-32 bg-pink-400/30 rounded-full blur-3xl"
    animate={{ scale: [1, 1.2, 1], x: [0, 20, 0] }}
    transition={{ duration: 4, repeat: Infinity }}
  />
  <motion.div 
    className="absolute bottom-20 right-20 w-40 h-40 bg-cyan-400/30 rounded-full blur-3xl"
    animate={{ scale: [1.2, 1, 1.2], y: [0, -20, 0] }}
    transition={{ duration: 5, repeat: Infinity }}
  />
  <motion.h1 
    className="text-6xl font-bold text-white relative z-10"
    initial={{ rotateX: 90, opacity: 0 }}
    animate={{ rotateX: 0, opacity: 1 }}
    transition={{ duration: 0.8 }}
  >
    ✨ Creative
  </motion.h1>
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
  <motion.h1 
    className="text-5xl font-extralight text-slate-900 tracking-wide"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 1.5 }}
  >
    Minimal
  </motion.h1>
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
  <motion.h1 
    className="text-6xl font-mono font-bold text-emerald-400 relative z-10"
    initial={{ y: -30, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ type: "spring" }}
  >
    {"<Tech/>"}
  </motion.h1>
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
