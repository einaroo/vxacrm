import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const SYSTEM_PROMPT = `You are an elite presentation designer creating React slides with Framer Motion animations and Fancy UI components.

## AVAILABLE COMPONENTS (USE THESE!)

### AnimatedGradient - Animated gradient background
\`\`\`jsx
<div className="absolute inset-0">
  <AnimatedGradient colors={["#f97316", "#ef4444", "#ec4899"]} speed={5} blur="heavy" />
</div>
\`\`\`

### Float - Makes any element float with subtle motion (USE FOR VISUAL ELEMENTS!)
\`\`\`jsx
<Float speed={0.3} amplitude={[15, 10, 0]} rotationRange={[3, 2, 1]} timeOffset={0}>
  <div className="w-32 h-32 rounded-full bg-white/10 blur-2xl" />
</Float>
\`\`\`

### Typewriter - Animated text typing effect (USE FOR HEADLINES!)
\`\`\`jsx
<Typewriter text="Your headline here" speed={40} className="text-6xl font-bold text-white" />
\`\`\`

### TextRotate - Cycling through text options
\`\`\`jsx
<TextRotate texts={["Fast", "Smart", "Powerful"]} className="text-4xl font-bold text-orange-400" />
\`\`\`

### SimpleMarquee - Scrolling text banner
\`\`\`jsx
<SimpleMarquee speed={40} direction="left">
  <span className="text-white/50 text-xl mx-8">INNOVATION</span>
  <span className="text-white/50 text-xl mx-8">CREATIVITY</span>
</SimpleMarquee>
\`\`\`

## VISUAL ELEMENTS TO INCLUDE

### Floating Orbs (Background decoration)
\`\`\`jsx
{/* Floating orbs for visual depth */}
<Float speed={0.2} amplitude={[20, 15, 0]} rotationRange={[0, 0, 5]} timeOffset={0}>
  <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-orange-500/20 blur-3xl" />
</Float>
<Float speed={0.15} amplitude={[15, 20, 0]} rotationRange={[0, 0, 3]} timeOffset={2}>
  <div className="absolute bottom-20 right-20 w-48 h-48 rounded-full bg-pink-500/20 blur-3xl" />
</Float>
\`\`\`

### Accent Lines and Shapes
\`\`\`jsx
<motion.div 
  className="absolute left-0 top-1/2 w-1 h-32 bg-gradient-to-b from-transparent via-orange-500 to-transparent"
  initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: 0.5 }}
/>
\`\`\`

### Icon/Emoji Accents
\`\`\`jsx
<Float speed={0.4} amplitude={[5, 8, 0]} rotationRange={[5, 5, 10]}>
  <span className="text-6xl">🚀</span>
</Float>
\`\`\`

## LAYOUT PATTERNS

### Title Slide - Dramatic entrance
- Large headline with Typewriter effect
- Floating decorative orbs
- Accent line or shape
- Subtitle with fade-in

### Content Slide - Visual hierarchy
- Title at top with motion entrance
- Key message large and centered OR
- Split layout with visual on one side
- Floating accent elements

### Bullet Points - Staggered reveal
- Each bullet with delay
- Icons or numbers with Float effect
- Accent color for bullets

### Quote Slide - Dramatic
- Large quote marks as decorative elements
- Typewriter for quote text
- Author with fade-in

### CTA/Closing - Impactful
- Bold headline
- TextRotate for dynamic element
- Floating decorations

## RULES

1. ALWAYS use at least 2-3 Fancy components per slide (Float, Typewriter, AnimatedGradient, etc.)
2. ALWAYS add visual decorations (floating orbs, accent lines, shapes)
3. Use motion.div with initial/animate for all text entrances
4. Stagger animations with transition={{ delay: X }}
5. Create visual depth with layered elements (z-index, blur)
6. Make headlines LARGE (text-6xl to text-8xl)
7. Use generous spacing (p-16, gap-8)
8. Root element MUST have "w-full h-full relative overflow-hidden"

## OUTPUT FORMAT

Return JSON:
{
  "slides": [
    {
      "code": "<motion.div className='w-full h-full relative overflow-hidden'>...</motion.div>",
      "spec": { "slide_title": "...", "layout": "..." }
    }
  ]
}

NO imports. NO exports. Just pure JSX starting with <motion.div>.`

const STYLE_CONFIGS = {
  professional: {
    colors: '["#0ea5e9", "#3b82f6", "#6366f1"]',
    bgClass: 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900',
    textPrimary: 'text-white',
    textSecondary: 'text-slate-300',
    accent: 'blue-500',
    orbColors: 'bg-blue-500/20, bg-indigo-500/20',
    fonts: 'font-light tracking-tight for headlines, font-normal for body',
    vibe: 'Sophisticated, clean, trustworthy. Subtle Float movements, elegant Typewriter reveals.'
  },
  bold: {
    colors: '["#f97316", "#ef4444", "#ec4899"]',
    bgClass: 'bg-black',
    textPrimary: 'text-white',
    textSecondary: 'text-orange-400',
    accent: 'orange-500',
    orbColors: 'bg-orange-500/30, bg-pink-500/30, bg-red-500/30',
    fonts: 'font-black uppercase tracking-tighter for headlines',
    vibe: 'High energy, impactful, disruptive. Aggressive Float amplitudes, fast Typewriter, multiple floating orbs.'
  },
  creative: {
    colors: '["#8b5cf6", "#7c3aed", "#ec4899", "#06b6d4"]',
    bgClass: 'bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900',
    textPrimary: 'text-white',
    textSecondary: 'text-purple-200',
    accent: 'pink-400',
    orbColors: 'bg-pink-500/30, bg-cyan-500/30, bg-purple-500/30',
    fonts: 'font-bold for headlines, playful sizing',
    vibe: 'Playful, expressive, artistic. Multiple floating elements, color variety, emoji accents allowed.'
  },
  minimal: {
    colors: '["#18181b", "#71717a"]',
    bgClass: 'bg-white',
    textPrimary: 'text-slate-900',
    textSecondary: 'text-slate-500',
    accent: 'slate-900',
    orbColors: 'bg-slate-200/50',
    fonts: 'font-extralight tracking-wide for headlines',
    vibe: 'Elegant simplicity, maximum whitespace. Subtle Float, slow Typewriter, minimal decorations.'
  },
  tech: {
    colors: '["#10b981", "#06b6d4", "#8b5cf6"]',
    bgClass: 'bg-slate-950',
    textPrimary: 'text-emerald-400',
    textSecondary: 'text-slate-400',
    accent: 'emerald-500',
    orbColors: 'bg-emerald-500/20, bg-cyan-500/20',
    fonts: 'font-mono font-bold for headlines',
    vibe: 'Futuristic, techy, precise. Grid patterns as backgrounds, terminal aesthetics, glowing accents.'
  }
}

const EXAMPLE_SLIDES = {
  bold: [
    {
      type: 'title',
      code: `<motion.div className="w-full h-full relative overflow-hidden bg-black flex items-center justify-center">
  {/* Animated gradient background */}
  <div className="absolute inset-0">
    <AnimatedGradient colors={["#f97316", "#ef4444", "#ec4899"]} speed={5} blur="heavy" />
  </div>
  
  {/* Floating orbs for depth */}
  <Float speed={0.2} amplitude={[25, 20, 0]} rotationRange={[0, 0, 5]} timeOffset={0}>
    <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-orange-500/30 blur-3xl" />
  </Float>
  <Float speed={0.15} amplitude={[20, 25, 0]} rotationRange={[0, 0, 3]} timeOffset={1.5}>
    <div className="absolute bottom-10 right-10 w-64 h-64 rounded-full bg-pink-500/30 blur-3xl" />
  </Float>
  <Float speed={0.25} amplitude={[15, 15, 0]} rotationRange={[0, 0, 8]} timeOffset={3}>
    <div className="absolute top-1/2 right-1/4 w-48 h-48 rounded-full bg-red-500/20 blur-3xl" />
  </Float>
  
  {/* Content */}
  <div className="relative z-10 text-center px-16">
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", damping: 10 }}
    >
      <Float speed={0.3} amplitude={[5, 8, 0]} rotationRange={[2, 2, 3]}>
        <h1 className="text-8xl font-black text-white uppercase tracking-tighter drop-shadow-2xl">
          VOI × VXA
        </h1>
      </Float>
    </motion.div>
    
    <motion.div 
      className="h-1 w-48 mx-auto my-8 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500"
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ delay: 0.5, duration: 0.8 }}
    />
    
    <motion.p 
      className="text-2xl text-orange-400 font-bold"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.7 }}
    >
      Validate Creative in Sweden. Scale Globally.
    </motion.p>
  </div>
</motion.div>`
    },
    {
      type: 'problem',
      code: `<motion.div className="w-full h-full relative overflow-hidden bg-black flex items-center">
  <div className="absolute inset-0">
    <AnimatedGradient colors={["#f97316", "#ef4444", "#ec4899"]} speed={5} blur="heavy" />
  </div>
  
  <Float speed={0.2} amplitude={[20, 15, 0]} rotationRange={[0, 0, 5]} timeOffset={0}>
    <div className="absolute top-20 right-20 w-56 h-56 rounded-full bg-red-500/30 blur-3xl" />
  </Float>
  <Float speed={0.18} amplitude={[15, 20, 0]} rotationRange={[0, 0, 3]} timeOffset={2}>
    <div className="absolute bottom-20 left-20 w-48 h-48 rounded-full bg-orange-500/30 blur-3xl" />
  </Float>
  
  {/* Accent line */}
  <motion.div 
    className="absolute left-16 top-0 w-1 h-full bg-gradient-to-b from-transparent via-orange-500 to-transparent"
    initial={{ scaleY: 0 }} 
    animate={{ scaleY: 1 }} 
    transition={{ duration: 1 }}
  />
  
  <div className="relative z-10 px-24 max-w-5xl">
    <motion.h2 
      className="text-7xl font-black text-white uppercase tracking-tighter mb-8"
      initial={{ x: -50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
    >
      The Problem
    </motion.h2>
    
    <motion.p 
      className="text-3xl text-white/90 mb-12 font-light"
      initial={{ x: -30, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      You know what creative <span className="text-orange-400 font-bold">might</span> work.
      <br />You don't know what <span className="text-red-400 font-bold">will</span> work.
    </motion.p>
    
    <div className="space-y-4">
      {[
        { icon: "💸", text: "Paid ads = budget burned to learn" },
        { icon: "🌍", text: "Organic = geofenced, slow, limited signal" },
        { icon: "🎲", text: "Agencies = guesswork dressed as strategy" }
      ].map((item, i) => (
        <motion.div 
          key={i}
          className="flex items-center gap-4"
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 + i * 0.15 }}
        >
          <Float speed={0.4} amplitude={[3, 5, 0]} rotationRange={[5, 5, 10]} timeOffset={i}>
            <span className="text-4xl">{item.icon}</span>
          </Float>
          <span className="text-xl text-white/80">{item.text}</span>
        </motion.div>
      ))}
    </div>
  </div>
</motion.div>`
    }
  ]
}

export async function POST(req: NextRequest) {
  try {
    const { script, brandStyle = 'professional' } = await req.json()

    if (!script?.trim()) {
      return NextResponse.json({ error: 'Script is required' }, { status: 400 })
    }

    const style = STYLE_CONFIGS[brandStyle as keyof typeof STYLE_CONFIGS] || STYLE_CONFIGS.professional
    const examples = EXAMPLE_SLIDES[brandStyle as keyof typeof EXAMPLE_SLIDES] || EXAMPLE_SLIDES.bold

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Create a presentation with this style and script:

## STYLE: ${brandStyle.toUpperCase()}
- Gradient colors: ${style.colors}
- Background: ${style.bgClass}
- Primary text: ${style.textPrimary}
- Secondary text: ${style.textSecondary}
- Accent color: ${style.accent}
- Floating orb colors: ${style.orbColors}
- Typography: ${style.fonts}
- Vibe: ${style.vibe}

## EXAMPLE SLIDES (follow this quality level):

### Example Title Slide:
\`\`\`jsx
${examples[0]?.code || ''}
\`\`\`

### Example Content Slide:
\`\`\`jsx
${examples[1]?.code || ''}
\`\`\`

## YOUR SCRIPT TO DESIGN:
${script}

## REQUIREMENTS:
1. Create a slide for EACH section in the script
2. EVERY slide must have:
   - AnimatedGradient or gradient background
   - At least 2 Float elements (floating orbs, icons, or decorations)
   - Typewriter OR motion animations for text
   - Visual decorations (orbs, lines, shapes)
3. Match the ${brandStyle} style exactly
4. Make it VISUALLY IMPRESSIVE - not just text on background

Generate ALL slides now as JSON.`
        }
      ],
      temperature: 0.4,
      max_tokens: 16000,
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 })
    }

    const parsed = JSON.parse(content)
    
    if (!parsed.slides || !Array.isArray(parsed.slides)) {
      return NextResponse.json({ error: 'Invalid response format' }, { status: 500 })
    }

    const validSlides = parsed.slides
      .filter((s: { code?: string }) => s.code && typeof s.code === 'string')
      .map((s: { code: string; spec?: Record<string, unknown> }) => ({
        code: s.code,
        spec: s.spec || null
      }))

    if (validSlides.length === 0) {
      return NextResponse.json({ error: 'No valid slides generated' }, { status: 500 })
    }

    return NextResponse.json({ 
      slides: validSlides,
      style: parsed.presentation_style || null
    })
  } catch (error) {
    console.error('Generate code error:', error)
    return NextResponse.json(
      { error: 'Failed to generate slides' },
      { status: 500 }
    )
  }
}
