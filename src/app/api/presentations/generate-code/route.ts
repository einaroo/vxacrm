import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const BRAND_STYLES = {
  professional: {
    colors: 'slate-900, slate-800, blue-500, white',
    fonts: 'font-light tracking-tight',
    vibe: 'Clean, corporate, trustworthy. Subtle animations, elegant transitions.',
  },
  bold: {
    colors: 'black, orange-500, red-500, pink-500, white',
    fonts: 'font-black uppercase tracking-tighter',
    vibe: 'High contrast, impactful, energetic. Spring animations, bold entrances.',
  },
  creative: {
    colors: 'violet-600, purple-600, indigo-700, pink-400, cyan-400',
    fonts: 'font-bold',
    vibe: 'Playful gradients, expressive. Floating orbs, rotation effects, colorful.',
  },
  minimal: {
    colors: 'white, slate-900, slate-300, slate-500',
    fonts: 'font-extralight tracking-wide',
    vibe: 'Maximum white space, elegant, refined. Slow fades, simple transitions.',
  },
  tech: {
    colors: 'slate-950, emerald-400, emerald-500, slate-500',
    fonts: 'font-mono font-bold',
    vibe: 'Cyber aesthetic, grid patterns, terminal vibes. Sharp animations, glitch-like effects.',
  },
}

const SYSTEM_PROMPT = `You are a presentation design AI that generates React + Tailwind CSS + Framer Motion slide code.

CRITICAL RULES:
1. Output ONLY valid JSX that can be rendered by react-live
2. Use motion.div, motion.h1, motion.p, etc. for animations
3. Use Tailwind CSS classes for ALL styling
4. Each slide must fill its container: use "w-full h-full" on the root element
5. Use responsive text sizes (text-4xl, text-6xl, text-8xl)
6. Add entrance animations with initial/animate props
7. Create visual hierarchy with proper spacing (p-12, p-16, gap-8)
8. Use gradients, backgrounds, and visual elements that match the brand style
9. NO imports, NO export statements - just pure JSX
10. The code will be wrapped in a container div automatically

ANIMATION PATTERNS:
- Fade in: initial={{ opacity: 0 }} animate={{ opacity: 1 }}
- Slide up: initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
- Scale: initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
- Stagger children with transition={{ delay: 0.2 }} etc.
- Use transition={{ type: "spring" }} for bouncy effects
- Use transition={{ duration: 0.8, ease: "easeOut" }} for smooth effects

BACKGROUND PATTERNS (use when appropriate):
- Gradient: bg-gradient-to-br from-X via-Y to-Z
- Grid: bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:50px_50px]
- Floating orbs: absolute positioned divs with blur-3xl and animate prop for floating

EXAMPLE SLIDE CODE:
<motion.div 
  className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col items-center justify-center p-12"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
>
  <motion.h1 
    className="text-6xl font-bold text-white mb-6"
    initial={{ y: 30, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ delay: 0.2 }}
  >
    Welcome
  </motion.h1>
  <motion.p 
    className="text-xl text-slate-400"
    initial={{ y: 20, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ delay: 0.4 }}
  >
    Let's get started
  </motion.p>
</motion.div>

Respond with a JSON array of slides, each with a "code" field containing the JSX string.`

export async function POST(req: NextRequest) {
  try {
    const { script, brandStyle = 'professional' } = await req.json()

    if (!script?.trim()) {
      return NextResponse.json({ error: 'Script is required' }, { status: 400 })
    }

    const style = BRAND_STYLES[brandStyle as keyof typeof BRAND_STYLES] || BRAND_STYLES.professional

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Generate a presentation with the following brand style and script.

BRAND STYLE: ${brandStyle}
- Colors to use: ${style.colors}
- Typography: ${style.fonts}
- Visual vibe: ${style.vibe}

SCRIPT/OUTLINE:
${script}

Generate 1 slide per main point/section in the script. Each slide should:
1. Match the brand style perfectly
2. Have engaging animations
3. Be visually consistent with the other slides (same color palette, similar animation timing)
4. Focus on key message - don't overcrowd

Respond with JSON:
{
  "slides": [
    { "code": "<motion.div>...</motion.div>" },
    ...
  ]
}`,
        },
      ],
      temperature: 0.4,
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 })
    }

    const parsed = JSON.parse(content)
    
    // Validate slides
    if (!parsed.slides || !Array.isArray(parsed.slides)) {
      return NextResponse.json({ error: 'Invalid response format' }, { status: 500 })
    }

    // Ensure each slide has code
    const validSlides = parsed.slides.filter((s: { code?: string }) => s.code && typeof s.code === 'string')

    return NextResponse.json({ slides: validSlides })
  } catch (error) {
    console.error('Generate code error:', error)
    return NextResponse.json(
      { error: 'Failed to generate slides' },
      { status: 500 }
    )
  }
}
