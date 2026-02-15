import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// The detailed slide specification schema
const SLIDE_SPEC_SCHEMA = `
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
  "visual_description": string (describe what this slide should look like visually),
  "reasoning": string (explain WHY these visual choices support the message),
  "style": {
    "style_name": string,
    "intent": string (what is this slide trying to achieve),
    "visual_tone": {
      "mood": string,
      "energy": "low" | "medium" | "high",
      "emotional_signal": string
    },
    "color_system": {
      "backgrounds": string (describe background approach),
      "color_blocks": string[] | null,
      "text": { "primary": string, "secondary": string, "accent": string },
      "rules": string
    },
    "background_treatment": {
      "type": "solid" | "gradient" | "animated" | "pattern" | "image",
      "texture": string | null,
      "depth": "flat" | "layered" | "deep",
      "avoid": string[] | null
    },
    "typography_character": {
      "headlines": string (describe headline style),
      "numbers": string | null,
      "body": string,
      "hierarchy": string,
      "avoid": string[] | null
    },
    "composition": {
      "layout_type": "centered" | "left-aligned" | "split" | "asymmetric" | "grid" | "scattered",
      "spacing": "tight" | "balanced" | "generous",
      "hierarchy": string,
      "grid": string | null
    },
    "graphic_elements": {
      "usage": string,
      "suggested": string[] (what visual elements to include),
      "avoid": string[] | null
    },
    "animation_approach": {
      "entrance": string (how elements should enter),
      "emphasis": string | null,
      "decorations": string (floating elements, orbs, etc.)
    },
    "fancy_components": string[] (which Fancy components would work well here)
  }
}
`

const SYSTEM_PROMPT = `You are an expert presentation design strategist. Your job is to analyze a script and create detailed visual specifications for each slide.

For EACH slide, you must provide:
1. The content (headline, body, bullets, etc.)
2. A visual description of how it should look
3. REASONING explaining why these visual choices support the message
4. Detailed style specifications including typography, composition, animation

## Available Fancy Components (pick appropriate ones for each slide):
- AnimatedGradient: Animated gradient backgrounds - good for high-energy or dramatic slides
- Float: Makes elements float/hover - great for visual interest, icons, decorations
- Typewriter: Text typing animation - good for reveals, emphasis on key messages
- TextRotate: Cycling through text options - good for alternatives, variations
- SimpleMarquee: Scrolling text - good for continuous messaging, social proof
- LetterSwap: Letter-by-letter animation - good for headlines, emphasis
- GooeyFilter: Gooey/liquid effect - good for creative, playful slides
- CssBox: 3D box effects - good for product showcases, depth

## Your Output
Return a JSON object with:
{
  "presentation": {
    "title": string,
    "overall_style": "light" | "dark",
    "design_system": {
      "color_palette": { ... },
      "typography_scale": { ... },
      "animation_timing": string
    }
  },
  "slides": [
    ... array of slide specs following the schema
  ]
}

CRITICAL: 
- Each slide spec must include REASONING for visual choices
- Pick Fancy components that MATCH the slide's intent
- Ensure visual CONSISTENCY across all slides
- Make each slide visually distinct while cohesive`

export async function POST(req: NextRequest) {
  try {
    const { script, mode = 'dark' } = await req.json()

    if (!script?.trim()) {
      return NextResponse.json({ error: 'Script is required' }, { status: 400 })
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Create detailed slide specifications for this presentation.

## Mode: ${mode.toUpperCase()} MODE
${mode === 'dark' 
  ? '- Dark backgrounds (slate-900, black, etc.)\n- Light text (white, slate-100)\n- Glowing accents' 
  : '- Light backgrounds (white, slate-50)\n- Dark text (slate-900)\n- Subtle shadows'}

## Slide Specification Schema:
${SLIDE_SPEC_SCHEMA}

## Script to Design:
${script}

## Requirements:
1. Create a spec for EVERY slide/section in the script
2. Include visual_description and reasoning for each
3. Pick appropriate fancy_components for each slide's intent
4. Ensure visual consistency while making each slide distinct
5. Consider the flow and narrative arc

Generate the complete design specification now.`
        }
      ],
      temperature: 0.4,
      max_tokens: 8000,
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 })
    }

    const spec = JSON.parse(content)
    return NextResponse.json(spec)
  } catch (error) {
    console.error('Design spec error:', error)
    return NextResponse.json(
      { error: 'Failed to generate design spec' },
      { status: 500 }
    )
  }
}
