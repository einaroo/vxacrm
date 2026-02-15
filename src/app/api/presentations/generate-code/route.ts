import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Available Fancy Components for code generation
const FANCY_COMPONENTS = `
AVAILABLE FANCY COMPONENTS (use these for visual impact):

1. AnimatedGradient - Animated gradient background
   <AnimatedGradient colors={["#color1", "#color2", "#color3"]} speed={5} blur="heavy" />
   Props: colors (array), speed (number 1-10), blur ("light"|"medium"|"heavy")

2. Float - Floating animation wrapper
   <Float speed={0.3} amplitude={[15, 10, 0]} rotationRange={[3, 2, 1]} timeOffset={0}>
     <div>content</div>
   </Float>
   Props: speed (0.1-1), amplitude ([x,y,z]), rotationRange ([x,y,z]), timeOffset (number)

3. Typewriter - Typewriter text effect
   <Typewriter text="Your text" speed={50} className="..." />
   Props: text (string), speed (ms per char), className

4. TextRotate - Rotating text alternatives
   <TextRotate texts={["First", "Second", "Third"]} className="..." />
   Props: texts (array), className

5. LetterSwap - Letter swap animation on hover
   <LetterSwap text="Hover me" className="..." />
   Props: text (string), className

6. SimpleMarquee - Scrolling marquee
   <SimpleMarquee speed={50} direction="left">
     <div>content</div>
   </SimpleMarquee>
   Props: speed (number), direction ("left"|"right")
`

const BRAND_STYLE_SYSTEMS = {
  professional: {
    style_name: "Professional",
    intent: "Establish credibility, trust, and expertise",
    visual_tone: {
      mood: "Confident, polished, authoritative",
      energy: "Calm, measured",
      emotional_signal: "Trust, reliability, competence"
    },
    color_system: {
      backgrounds: ["slate-900", "slate-800", "slate-950"],
      color_blocks: ["blue-500", "blue-600", "slate-700"],
      text: { primary: "white", secondary: "slate-300", accent: "blue-400" },
      rules: "Use blue as accent, slate for depth, high contrast for readability"
    },
    typography_character: {
      headlines: "font-light tracking-tight, large scale (text-5xl to text-7xl)",
      body: "font-normal text-xl, generous line-height",
      hierarchy: "Clear size steps, accent color for emphasis"
    },
    composition: {
      layout_types: ["centered-focal", "split-content", "stacked-hierarchy"],
      spacing: "Generous padding (p-16), clear breathing room",
      grid: "Simple, balanced, not crowded"
    },
    fancy_components: ["Float for subtle movement", "AnimatedGradient for backgrounds", "Typewriter for reveals"]
  },
  bold: {
    style_name: "Bold",
    intent: "Make impact, energize, command attention",
    visual_tone: {
      mood: "Powerful, dynamic, unapologetic",
      energy: "High, explosive",
      emotional_signal: "Excitement, confidence, disruption"
    },
    color_system: {
      backgrounds: ["black", "slate-950"],
      color_blocks: ["orange-500", "red-500", "pink-500", "yellow-400"],
      text: { primary: "white", secondary: "orange-400", accent: "yellow-400" },
      rules: "High contrast, warm accent colors, dramatic gradients"
    },
    typography_character: {
      headlines: "font-black uppercase tracking-tighter, massive scale (text-7xl to text-9xl)",
      body: "font-bold text-2xl",
      hierarchy: "Extreme contrast, headlines dominate"
    },
    composition: {
      layout_types: ["centered-impact", "diagonal-energy", "full-bleed"],
      spacing: "Tight for tension, explosive from center",
      grid: "Break the grid, asymmetric allowed"
    },
    fancy_components: ["AnimatedGradient with warm colors", "Float with higher amplitude", "SimpleMarquee for energy"]
  },
  creative: {
    style_name: "Creative",
    intent: "Inspire, delight, express artistry",
    visual_tone: {
      mood: "Playful, imaginative, expressive",
      energy: "Flowing, organic",
      emotional_signal: "Wonder, creativity, possibility"
    },
    color_system: {
      backgrounds: ["violet-600", "purple-600", "indigo-700"],
      color_blocks: ["pink-400", "cyan-400", "emerald-400", "amber-400"],
      text: { primary: "white", secondary: "white/80", accent: "pink-300" },
      rules: "Rich gradients, complementary pops, allow color play"
    },
    typography_character: {
      headlines: "font-bold, allow playful sizing (text-5xl to text-7xl)",
      body: "font-medium text-xl",
      hierarchy: "Expressive, can break rules for effect"
    },
    composition: {
      layout_types: ["organic-flow", "scattered-elements", "layered-depth"],
      spacing: "Varied, creates rhythm",
      grid: "Loose, organic, overlapping allowed"
    },
    fancy_components: ["AnimatedGradient heavily", "Float with varied speeds", "TextRotate for playfulness", "Typewriter for reveals"]
  },
  minimal: {
    style_name: "Minimal",
    intent: "Communicate with clarity, elegant simplicity",
    visual_tone: {
      mood: "Calm, refined, sophisticated",
      energy: "Low, intentional",
      emotional_signal: "Clarity, focus, premium quality"
    },
    color_system: {
      backgrounds: ["white", "slate-50", "neutral-100"],
      color_blocks: ["slate-900", "slate-800"],
      text: { primary: "slate-900", secondary: "slate-500", accent: "slate-700" },
      rules: "Maximum 2-3 colors, embrace white space"
    },
    typography_character: {
      headlines: "font-extralight tracking-wide (text-4xl to text-6xl)",
      body: "font-light text-lg",
      hierarchy: "Subtle, size and weight only"
    },
    composition: {
      layout_types: ["centered-minimal", "asymmetric-balance", "single-focal"],
      spacing: "Maximum white space, let content breathe",
      grid: "Strict, precise alignment"
    },
    fancy_components: ["Typewriter for slow reveals", "Float with minimal amplitude", "Avoid heavy animations"]
  },
  tech: {
    style_name: "Tech",
    intent: "Convey innovation, precision, cutting-edge",
    visual_tone: {
      mood: "Futuristic, precise, intelligent",
      energy: "Electric, focused",
      emotional_signal: "Innovation, expertise, forward-thinking"
    },
    color_system: {
      backgrounds: ["slate-950", "slate-900", "black"],
      color_blocks: ["emerald-500", "cyan-500", "violet-500"],
      text: { primary: "emerald-400", secondary: "slate-400", accent: "cyan-400" },
      rules: "Dark mode, neon accents, terminal aesthetics"
    },
    typography_character: {
      headlines: "font-mono font-bold (text-5xl to text-7xl)",
      body: "font-mono text-lg",
      hierarchy: "Code-like, systematic"
    },
    composition: {
      layout_types: ["grid-based", "terminal-style", "data-driven"],
      spacing: "Systematic, grid-aligned",
      grid: "Strict grid lines visible as design element"
    },
    fancy_components: ["Grid background patterns", "AnimatedGradient with cool colors", "Typewriter for code effect", "Float for data elements"]
  }
}

const SYSTEM_PROMPT = `You are a presentation design AI that creates detailed slide specifications and then converts them to React + Tailwind CSS + Framer Motion code.

YOUR PROCESS:
1. First, generate a detailed JSON specification for EVERY slide in the presentation
2. Then, convert each specification to working React/JSX code
3. Maintain STRICT visual consistency across ALL slides

${FANCY_COMPONENTS}

SLIDE SPECIFICATION SCHEMA (generate this for each slide):
{
  "slide_number": number,
  "slide_title": string,
  "copy": {
    "headline": string | null,
    "subheadline": string | null,
    "body": string | null,
    "bullets": string[] | null,
    "footer": string | null
  },
  "visual_description": string (describe the visual intent),
  "layout_type": "title-centered" | "content-left" | "split-two-column" | "bullets-list" | "quote-centered" | "data-showcase" | "image-focus",
  "fancy_components": string[] (which fancy components to use),
  "animation_strategy": string (describe entrance animations)
}

CODE GENERATION RULES:
1. Output ONLY valid JSX that can be rendered by react-live
2. Use motion.div, motion.h1, motion.p for animations
3. Use Tailwind CSS classes for ALL styling
4. Root element MUST have "w-full h-full" classes
5. Use the Fancy Components appropriately based on style
6. Add entrance animations with initial/animate/transition props
7. NO imports, NO export statements - just pure JSX
8. Maintain the EXACT color palette and typography across ALL slides

CONSISTENCY REQUIREMENTS:
- Same background treatment style across all slides
- Same typography scale and weights
- Same animation timing and easing
- Same spacing system (padding, gaps)
- Same accent color usage
- Cohesive visual rhythm throughout`

export async function POST(req: NextRequest) {
  try {
    const { script, brandStyle = 'professional' } = await req.json()

    if (!script?.trim()) {
      return NextResponse.json({ error: 'Script is required' }, { status: 400 })
    }

    const styleSystem = BRAND_STYLE_SYSTEMS[brandStyle as keyof typeof BRAND_STYLE_SYSTEMS] || BRAND_STYLE_SYSTEMS.professional

    // Step 1: Generate detailed slide specifications
    const specResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Create a presentation with the following:

BRAND STYLE SYSTEM:
${JSON.stringify(styleSystem, null, 2)}

INPUT SCRIPT/OUTLINE:
${script}

INSTRUCTIONS:
1. Parse the script and create a slide for EVERY section/point mentioned
2. Do NOT skip or combine points - each deserves its own slide
3. Generate detailed specifications following the schema
4. Then generate React/JSX code for each slide
5. Ensure STRICT visual consistency using the style system

Respond with JSON:
{
  "presentation_style": {
    "background_base": "string (the consistent background approach)",
    "typography_scale": "string (the consistent type scale)",
    "animation_timing": "string (the consistent timing)",
    "accent_usage": "string (how accents are used)"
  },
  "slides": [
    {
      "spec": { ...slide specification },
      "code": "<motion.div>...</motion.div>"
    }
  ]
}

Generate ALL slides now.`,
        },
      ],
      temperature: 0.3,
      max_tokens: 16000,
      response_format: { type: 'json_object' },
    })

    const content = specResponse.choices[0]?.message?.content
    if (!content) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 })
    }

    const parsed = JSON.parse(content)
    
    if (!parsed.slides || !Array.isArray(parsed.slides)) {
      return NextResponse.json({ error: 'Invalid response format' }, { status: 500 })
    }

    // Extract just the code from each slide
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
