import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const SYSTEM_PROMPT = `You are an elite presentation designer creating React slides with Framer Motion and Fancy UI components.

## REQUIRED COMPONENTS (USE ALL OF THESE!)

### AnimatedGradient - Animated gradient background
<div className="absolute inset-0">
  <AnimatedGradient colors={["#f97316", "#ef4444", "#ec4899"]} speed={5} blur="heavy" />
</div>

### Float - Makes elements float (USE FOR DECORATIONS!)
<Float speed={0.3} amplitude={[15, 10, 0]} rotationRange={[3, 2, 1]} timeOffset={0}>
  <div className="w-32 h-32 rounded-full bg-white/20 blur-3xl" />
</Float>

### Typewriter - Animated typing (USE FOR HEADLINES!)
<Typewriter text="Your headline" speed={40} className="text-6xl font-bold text-white" />

## EVERY SLIDE MUST HAVE:

1. Root: <motion.div className="w-full h-full relative overflow-hidden bg-black">
2. Background: AnimatedGradient with style-appropriate colors
3. 2-3 floating orbs using Float component with blur-3xl
4. Animated text using motion.div with initial/animate props
5. Visual decorations (accent lines, shapes, floating elements)

## EXAMPLE TITLE SLIDE:

<motion.div className="w-full h-full relative overflow-hidden bg-black flex items-center justify-center">
  <div className="absolute inset-0">
    <AnimatedGradient colors={["#f97316", "#ef4444", "#ec4899"]} speed={5} blur="heavy" />
  </div>
  
  <Float speed={0.2} amplitude={[25, 20, 0]} rotationRange={[0, 0, 5]} timeOffset={0}>
    <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-orange-500/30 blur-3xl" />
  </Float>
  <Float speed={0.15} amplitude={[20, 25, 0]} rotationRange={[0, 0, 3]} timeOffset={1.5}>
    <div className="absolute bottom-10 right-10 w-64 h-64 rounded-full bg-pink-500/30 blur-3xl" />
  </Float>
  
  <div className="relative z-10 text-center px-16">
    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring" }}>
      <Float speed={0.3} amplitude={[5, 8, 0]} rotationRange={[2, 2, 3]}>
        <h1 className="text-8xl font-black text-white uppercase tracking-tighter drop-shadow-2xl">
          HEADLINE
        </h1>
      </Float>
    </motion.div>
    
    <motion.div className="h-1 w-48 mx-auto my-8 bg-gradient-to-r from-orange-500 to-pink-500"
      initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.5 }}
    />
    
    <motion.p className="text-2xl text-orange-400 font-bold"
      initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }}
    >
      Subtitle text here
    </motion.p>
  </div>
</motion.div>

## EXAMPLE CONTENT SLIDE:

<motion.div className="w-full h-full relative overflow-hidden bg-black flex items-center">
  <div className="absolute inset-0">
    <AnimatedGradient colors={["#f97316", "#ef4444", "#ec4899"]} speed={5} blur="heavy" />
  </div>
  
  <Float speed={0.2} amplitude={[20, 15, 0]} rotationRange={[0, 0, 5]} timeOffset={0}>
    <div className="absolute top-20 right-20 w-56 h-56 rounded-full bg-red-500/30 blur-3xl" />
  </Float>
  <Float speed={0.18} amplitude={[15, 20, 0]} rotationRange={[0, 0, 3]} timeOffset={2}>
    <div className="absolute bottom-20 left-20 w-48 h-48 rounded-full bg-orange-500/30 blur-3xl" />
  </Float>
  
  <motion.div className="absolute left-16 top-0 w-1 h-full bg-gradient-to-b from-transparent via-orange-500 to-transparent"
    initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 1 }}
  />
  
  <div className="relative z-10 px-24 max-w-5xl">
    <motion.h2 className="text-7xl font-black text-white uppercase tracking-tighter mb-8"
      initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
    >
      Title Here
    </motion.h2>
    
    <motion.p className="text-3xl text-white/90 mb-12"
      initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}
    >
      Main message with <span className="text-orange-400 font-bold">emphasis</span>
    </motion.p>
    
    <div className="space-y-6">
      <motion.div className="flex items-center gap-4"
        initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 }}
      >
        <Float speed={0.4} amplitude={[3, 5, 0]} rotationRange={[5, 5, 10]} timeOffset={0}>
          <span className="text-4xl">💸</span>
        </Float>
        <span className="text-xl text-white/80">Bullet point one</span>
      </motion.div>
      <motion.div className="flex items-center gap-4"
        initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 }}
      >
        <Float speed={0.4} amplitude={[3, 5, 0]} rotationRange={[5, 5, 10]} timeOffset={1}>
          <span className="text-4xl">🎯</span>
        </Float>
        <span className="text-xl text-white/80">Bullet point two</span>
      </motion.div>
    </div>
  </div>
</motion.div>

## STYLE-SPECIFIC COLORS

Professional: colors={["#0ea5e9", "#3b82f6", "#6366f1"]} - blue orbs, white text
Bold: colors={["#f97316", "#ef4444", "#ec4899"]} - orange/pink orbs, white text, UPPERCASE
Creative: colors={["#8b5cf6", "#7c3aed", "#ec4899"]} - purple/pink orbs, playful
Minimal: bg-white, subtle shadows, slate text, minimal orbs
Tech: colors={["#10b981", "#06b6d4"]} - green/cyan glows, grid pattern, monospace

## OUTPUT

Return JSON: { "slides": [{ "code": "<motion.div>...</motion.div>" }] }

CRITICAL: 
- NO .map() or JavaScript loops in JSX - write out each element manually
- Every slide needs Float orbs, AnimatedGradient, and motion animations
- Make it VISUALLY RICH, not just text`

const STYLE_CONFIGS: Record<string, { colors: string; orbs: string }> = {
  professional: {
    colors: '["#0ea5e9", "#3b82f6", "#6366f1"]',
    orbs: 'bg-blue-500/20, bg-indigo-500/20'
  },
  bold: {
    colors: '["#f97316", "#ef4444", "#ec4899"]',
    orbs: 'bg-orange-500/30, bg-pink-500/30, bg-red-500/30'
  },
  creative: {
    colors: '["#8b5cf6", "#7c3aed", "#ec4899", "#06b6d4"]',
    orbs: 'bg-purple-500/30, bg-pink-500/30, bg-cyan-500/30'
  },
  minimal: {
    colors: '["#e2e8f0", "#cbd5e1"]',
    orbs: 'bg-slate-200/30'
  },
  tech: {
    colors: '["#10b981", "#06b6d4", "#8b5cf6"]',
    orbs: 'bg-emerald-500/20, bg-cyan-500/20'
  }
}

export async function POST(req: NextRequest) {
  try {
    const { script, brandStyle = 'professional' } = await req.json()

    if (!script?.trim()) {
      return NextResponse.json({ error: 'Script is required' }, { status: 400 })
    }

    const style = STYLE_CONFIGS[brandStyle] || STYLE_CONFIGS.professional

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Create slides for this script using ${brandStyle.toUpperCase()} style.

STYLE CONFIG:
- AnimatedGradient colors: ${style.colors}
- Floating orb classes: ${style.orbs}

SCRIPT:
${script}

REQUIREMENTS:
1. One slide per section in the script
2. EVERY slide must have AnimatedGradient, 2-3 Float orbs, motion animations
3. Use emojis as floating icons where appropriate
4. Add accent lines and visual decorations
5. Make headlines LARGE (text-6xl to text-8xl)
6. NO .map() loops - write each element manually
7. Follow the ${brandStyle} style for colors and typography

Generate all slides as JSON now.`
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

    return NextResponse.json({ slides: validSlides })
  } catch (error) {
    console.error('Generate code error:', error)
    return NextResponse.json(
      { error: 'Failed to generate slides' },
      { status: 500 }
    )
  }
}
