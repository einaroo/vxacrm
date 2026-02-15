import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Stage 1: Design Spec Generation
const DESIGN_AGENT_PROMPT = `You are an expert presentation design strategist. Analyze the script and create detailed visual specifications for each slide.

For EACH slide provide:
1. Content extraction (headline, body, bullets)
2. Visual description of how it should look
3. REASONING explaining why these visual choices support the message
4. Style specifications

## Available Fancy Components (pick appropriate ones):
- AnimatedGradient: Animated gradient backgrounds - dramatic, high-energy
- Float: Floating elements - visual interest, icons, decorations
- Typewriter: Text typing animation - reveals, key messages
- TextRotate: Cycling text - alternatives, value props
- SimpleMarquee: Scrolling text - testimonials, logos
- LetterSwap: Letter animation - short impactful words

## Output Schema
{
  "presentation": {
    "title": string,
    "mode": "dark" | "light",
    "design_consistency": string (describe the visual thread)
  },
  "slides": [{
    "slide_number": number,
    "slide_title": string,
    "copy": {
      "headline": string | null,
      "subheadline": string | null,
      "body": string | null,
      "bullets": string[] | null
    },
    "visual_description": string,
    "reasoning": string,
    "style": {
      "intent": string,
      "mood": string,
      "energy": "low" | "medium" | "high",
      "layout": "centered" | "left" | "split" | "scattered",
      "background": "solid" | "gradient" | "animated",
      "typography": string,
      "decorations": string[],
      "fancy_components": string[],
      "animation_entrance": string
    }
  }]
}`

// Stage 2: Code Generation  
const CODE_GENERATOR_PROMPT = `You are a code generator converting slide specs into React/JSX.

## Fancy Component Usage

### AnimatedGradient (animated background)
<div className="absolute inset-0">
  <AnimatedGradient colors={["#f97316", "#ef4444"]} speed={5} blur="heavy" />
</div>

### Float (floating decorations)
<Float speed={0.3} amplitude={[15, 10, 0]} rotationRange={[3, 2, 1]} timeOffset={0}>
  <div className="w-32 h-32 rounded-full bg-orange-500/20 blur-3xl" />
</Float>

### Typewriter (animated headline)
<Typewriter text="Your headline" speed={40} className="text-6xl font-bold" />

### TextRotate (cycling words)
<TextRotate texts={["Fast", "Smart", "Easy"]} className="text-4xl" />

## Rules
1. Root: <motion.div className="w-full h-full relative overflow-hidden bg-...">
2. Use specified fancy_components from spec
3. Match visual_description
4. NO .map() loops
5. Add Float decorations for visual richness

## Dark Mode
- bg-black/bg-slate-900, text-white, glowing accents

## Light Mode
- bg-white/bg-slate-50, text-slate-900, subtle shadows

## Output Format
You MUST return this exact JSON structure:
{
  "slides": [
    { "slide_number": 1, "code": "<motion.div className=\"w-full h-full...\">...</motion.div>" }
  ]
}
Each slide must have a "code" field containing the JSX string.`

export async function POST(req: NextRequest) {
  try {
    const { script, mode = 'dark' } = await req.json()

    if (!script?.trim()) {
      return NextResponse.json({ error: 'Script is required' }, { status: 400 })
    }

    // Stage 1: Generate Design Spec
    console.log('[Generate] Stage 1: Generating design spec...')
    const specResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: DESIGN_AGENT_PROMPT },
        {
          role: 'user',
          content: `Create slide specifications for ${mode.toUpperCase()} MODE presentation.

Script:
${script}

Requirements:
- One spec per slide/section
- Include reasoning for visual choices
- Pick appropriate fancy_components for each slide's intent
- Ensure visual consistency

Return as JSON.`
        }
      ],
      temperature: 0.4,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    })

    const specContent = specResponse.choices[0]?.message?.content
    if (!specContent) {
      return NextResponse.json({ error: 'Design spec generation failed' }, { status: 500 })
    }

    const spec = JSON.parse(specContent)
    console.log('[Generate] Stage 1 complete:', spec.slides?.length, 'slides')

    // Stage 2: Generate Code from Spec
    console.log('[Generate] Stage 2: Generating code...')
    const codeResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: CODE_GENERATOR_PROMPT },
        {
          role: 'user',
          content: `Generate JSX code for each slide.

Mode: ${mode.toUpperCase()}

Slides:
${spec.slides?.map((s: Record<string, unknown>, i: number) => `
--- SLIDE ${i + 1}: ${s.slide_title} ---
Visual: ${s.visual_description}
Reasoning: ${s.reasoning}
Copy: ${JSON.stringify(s.copy)}
Components: ${JSON.stringify((s.style as Record<string, unknown>)?.fancy_components || [])}
Layout: ${(s.style as Record<string, unknown>)?.layout}
Background: ${(s.style as Record<string, unknown>)?.background}
Energy: ${(s.style as Record<string, unknown>)?.energy}
Decorations: ${JSON.stringify((s.style as Record<string, unknown>)?.decorations || [])}
Animation: ${(s.style as Record<string, unknown>)?.animation_entrance}
`).join('\n')}

Generate visually rich JSX for each slide.

IMPORTANT: Return JSON in this EXACT format:
{
  "slides": [
    { "slide_number": 1, "code": "<motion.div>...JSX here...</motion.div>" },
    { "slide_number": 2, "code": "<motion.div>...JSX here...</motion.div>" }
  ]
}`
        }
      ],
      temperature: 0.3,
      max_tokens: 12000,
      response_format: { type: 'json_object' },
    })

    const codeContent = codeResponse.choices[0]?.message?.content
    if (!codeContent) {
      return NextResponse.json({ error: 'Code generation failed' }, { status: 500 })
    }

    const codeResult = JSON.parse(codeContent)
    console.log('[Generate] Stage 2 raw response:', codeContent.substring(0, 500))
    console.log('[Generate] Stage 2 slides count:', codeResult.slides?.length)
    if (codeResult.slides?.[0]) {
      console.log('[Generate] Stage 2 slide 0 keys:', Object.keys(codeResult.slides[0]))
      console.log('[Generate] Stage 2 slide 0 code:', codeResult.slides[0].code?.substring(0, 200))
    }

    // Combine spec and code
    const slides = codeResult.slides?.map((s: { slide_number?: number; code?: string }, i: number) => ({
      code: s.code || '',
      spec: spec.slides?.[i] || null
    })) || []

    return NextResponse.json({ 
      slides,
      presentation: spec.presentation
    })
  } catch (error) {
    console.error('Generate error:', error)
    return NextResponse.json(
      { error: 'Failed to generate slides' },
      { status: 500 }
    )
  }
}
