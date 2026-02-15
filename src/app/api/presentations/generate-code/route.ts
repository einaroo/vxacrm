import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// The FULL slide specification schema
const SLIDE_SPEC_SCHEMA = `{
  "slide_number": number,
  "slide_title": string,
  "copy": {
    "headline": string | null,
    "subheadline": string | null,
    "body": string | null,
    "bullets": string[] | null,
    "footer": string | null
  },
  "visual_description": string,
  "style": {
    "style_name": string,
    "intent": string,
    "visual_tone": {
      "mood": string,
      "energy": "low" | "medium" | "high",
      "emotional_signal": string
    },
    "color_system": {
      "backgrounds": string,
      "color_blocks": string[] | null,
      "text": { "primary": string, "secondary": string, "accent": string },
      "rules": string
    },
    "background_treatment": {
      "type": "solid" | "gradient" | "animated" | "gooey",
      "texture": string | null,
      "depth": "flat" | "layered" | "deep",
      "avoid": string[] | null
    },
    "typography_character": {
      "headlines": string,
      "numbers": string | null,
      "body": string,
      "hierarchy": string,
      "avoid": string[] | null
    },
    "composition": {
      "layout_types": string,
      "spacing": "tight" | "balanced" | "generous",
      "hierarchy": string,
      "grid": string | null
    },
    "graphic_elements": {
      "usage": string,
      "allowed": string[],
      "avoid": string[] | null
    },
    "section_labels": {
      "style": string | null,
      "position": string | null
    },
    "anti_patterns": string[] | null,
    "fancy_components": string[]
  }
}`

const DESIGN_AGENT_PROMPT = `You are an expert presentation design strategist. Create DETAILED visual specifications for each slide.

## AVAILABLE FANCY COMPONENTS (pick appropriate ones):
- AnimatedGradient: Animated gradient backgrounds - dramatic, high-energy, use for title/hero slides
- Float: Floating elements with subtle motion - icons, decorations, visual interest
- Typewriter: Text typing animation - reveals, emphasis on key messages
- TextRotate: Cycling through text options - value props, alternatives
- SimpleMarquee: Horizontal scrolling text - testimonials, logos, continuous messaging
- LetterSwap: Letter-by-letter swap animation - short impactful words, CTAs
- GooeyFilter: Gooey/liquid SVG effect - creative, organic, blob-like visuals
- CssBox: 3D box effects - product showcases, depth

## LAYOUT RULES (CRITICAL for consistency):
1. Text must NEVER overlap with decorative elements
2. Headlines: Always in safe zone (top 20% or center)
3. Body text: Maintain 64px minimum padding from edges
4. Floating elements: Position in corners or behind text (z-index: -1)
5. Decorations: Use absolute positioning with specific coordinates
6. Visual hierarchy: Title > Subtitle > Body > Footer

## COMPOSITION RULES:
- "centered": Content in center, decorations in corners
- "left-aligned": Text left 60%, visuals right 40%
- "split": Two equal columns with clear separation
- "hero": Large headline center, supporting elements around

## OUTPUT SCHEMA (use this EXACT structure):
${SLIDE_SPEC_SCHEMA}

Generate specs for EVERY slide with full detail.`

const CODE_GENERATOR_PROMPT = `You are a code generator converting slide specs into React/JSX.

## AVAILABLE FANCY COMPONENTS:

### AnimatedGradient
<div className="absolute inset-0 -z-10">
  <AnimatedGradient colors={["#f97316", "#ef4444"]} speed={5} blur="heavy" />
</div>

### Float (for decorations - ALWAYS behind text with -z-10)
<Float speed={0.3} amplitude={[15, 10, 0]} rotationRange={[3, 2, 1]} timeOffset={0}>
  <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-orange-500/20 blur-3xl -z-10" />
</Float>

### Typewriter
<Typewriter text="Your headline" speed={40} className="text-6xl font-bold" />

### GooeyFilter (apply with CSS filter)
<GooeyFilter id="gooey" strength={10} />
<div style={{filter: "url(#gooey)"}}>
  <div className="w-20 h-20 rounded-full bg-blue-500 absolute top-10 left-10" />
  <div className="w-16 h-16 rounded-full bg-blue-500 absolute top-20 left-20" />
</div>

### LetterSwap
<LetterSwap text="IMPACT" className="text-4xl font-bold" />

## CRITICAL LAYOUT RULES:
1. Root: <motion.div className="w-full h-full relative overflow-hidden bg-...">
2. Decorative elements MUST have: className="... absolute ... -z-10" (behind text)
3. Text content MUST have: className="... relative z-10" (in front)
4. Padding: Use p-16 for main content area (64px safe zone)
5. Never position text where decorations are
6. Use flex/grid for predictable layouts

## Dark Mode
- bg-black/bg-slate-900, text-white, glowing accents with opacity

## Light Mode
- bg-white/bg-slate-50, text-slate-900, solid colors

## Output Format
Return JSON:
{
  "slides": [
    { "slide_number": 1, "code": "<motion.div className=\"w-full h-full...\">...</motion.div>" }
  ]
}
Each slide MUST have a "code" field with valid JSX.`

export async function POST(req: NextRequest) {
  try {
    const { script, mode = 'dark' } = await req.json()

    if (!script?.trim()) {
      return NextResponse.json({ error: 'Script is required' }, { status: 400 })
    }

    // Stage 1: Generate Design Spec with FULL schema
    console.log('[Generate] Stage 1: Generating detailed design spec...')
    const specResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: DESIGN_AGENT_PROMPT },
        {
          role: 'user',
          content: `Create DETAILED slide specifications for ${mode.toUpperCase()} MODE.

Script:
${script}

Requirements:
1. Use the FULL spec schema for each slide
2. Include visual_tone, color_system, background_treatment, typography_character, composition
3. Pick fancy_components that match each slide's intent
4. Specify graphic_elements with allowed decorations
5. List anti_patterns to avoid
6. Ensure visual consistency across all slides

Return as JSON with "presentation" and "slides" arrays.`
        }
      ],
      temperature: 0.4,
      max_tokens: 6000,
      response_format: { type: 'json_object' },
    })

    const specContent = specResponse.choices[0]?.message?.content
    if (!specContent) {
      return NextResponse.json({ error: 'Design spec generation failed' }, { status: 500 })
    }

    const spec = JSON.parse(specContent)
    console.log('[Generate] Stage 1 complete:', spec.slides?.length, 'slides with full specs')

    // Stage 2: Generate Code from Spec
    console.log('[Generate] Stage 2: Generating code with layout rules...')
    const codeResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: CODE_GENERATOR_PROMPT },
        {
          role: 'user',
          content: `Generate JSX code for each slide following the specs.

Mode: ${mode.toUpperCase()}

Slides:
${spec.slides?.map((s: Record<string, unknown>, i: number) => {
  const style = s.style as Record<string, unknown> || {}
  return `
--- SLIDE ${i + 1}: ${s.slide_title} ---
Visual: ${s.visual_description}
Copy: ${JSON.stringify(s.copy)}
Components: ${JSON.stringify(style.fancy_components || [])}
Layout: ${JSON.stringify(style.composition || {})}
Background: ${JSON.stringify(style.background_treatment || {})}
Typography: ${JSON.stringify(style.typography_character || {})}
Graphics: ${JSON.stringify(style.graphic_elements || {})}
Color System: ${JSON.stringify(style.color_system || {})}
Anti-patterns: ${JSON.stringify(style.anti_patterns || [])}
`}).join('\n')}

CRITICAL:
1. Decorations must be -z-10 (behind text)
2. Text content must be z-10 (in front)
3. Use the specified fancy_components
4. Follow composition layout rules
5. Respect anti_patterns

Return JSON with slides array containing code field.`
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
    console.log('[Generate] Stage 2 complete:', codeResult.slides?.length, 'slides with code')

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
