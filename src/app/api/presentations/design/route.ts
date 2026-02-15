import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Available Fancy Components for design decisions
const AVAILABLE_COMPONENTS = {
  backgrounds: [
    'animated-gradient-with-svg',
    'pixel-trail',
    'parallax-floating',
    'screensaver',
  ],
  text: [
    'typewriter',
    'letter-swap-forward-anim',
    'text-rotate',
    'simple-marquee',
  ],
  layout: [
    'float',
    'stacking-cards',
    'circling-elements',
    'media-between-text',
  ],
  interactive: [
    'drag-elements',
    'cursor-attractor-and-gravity',
    'elastic-line',
  ],
  carousels: [
    'simple-carousel',
    'box-carousel',
  ],
  effects: [
    'gooey-svg-filter',
    'image-trail',
  ],
}

const BRAND_PALETTES = {
  professional: {
    primary: ['#0ea5e9', '#3b82f6', '#6366f1'],
    secondary: ['#64748b', '#475569', '#334155'],
    accent: ['#f59e0b', '#10b981'],
    background: 'light',
  },
  bold: {
    primary: ['#dc2626', '#ea580c', '#f59e0b'],
    secondary: ['#1f2937', '#111827'],
    accent: ['#fbbf24', '#34d399'],
    background: 'dark',
  },
  creative: {
    primary: ['#8b5cf6', '#a855f7', '#d946ef'],
    secondary: ['#6366f1', '#4f46e5'],
    accent: ['#06b6d4', '#22d3ee'],
    background: 'gradient',
  },
  minimal: {
    primary: ['#18181b', '#27272a'],
    secondary: ['#71717a', '#a1a1aa'],
    accent: ['#3b82f6'],
    background: 'white',
  },
  tech: {
    primary: ['#06b6d4', '#0891b2', '#0e7490'],
    secondary: ['#1e293b', '#0f172a'],
    accent: ['#22d3ee', '#67e8f9'],
    background: 'dark',
  },
}

export async function POST(request: Request) {
  try {
    const { script, brandStyle = 'professional' } = await request.json()

    if (!script) {
      return NextResponse.json({ error: 'Script is required' }, { status: 400 })
    }

    const palette = BRAND_PALETTES[brandStyle as keyof typeof BRAND_PALETTES] || BRAND_PALETTES.professional

    const systemPrompt = `You are a presentation DESIGN agent. Your job is to:
1. Parse the script into slides
2. Design each slide with specific visual elements
3. Maintain brand consistency across all slides
4. Create a cohesive visual narrative

BRAND PALETTE:
- Primary colors: ${palette.primary.join(', ')}
- Secondary colors: ${palette.secondary.join(', ')}
- Accent colors: ${palette.accent.join(', ')}
- Background style: ${palette.background}

AVAILABLE FANCY COMPONENTS:
${JSON.stringify(AVAILABLE_COMPONENTS, null, 2)}

For EACH slide, output:
{
  "template": "title|content|bullets|two-column|quote|image",
  "content": { ... template-specific content ... },
  "design": {
    "background": {
      "type": "gradient|solid|animated|image",
      "colors": ["#hex1", "#hex2", ...],
      "component": "animated-gradient-with-svg" | null
    },
    "titleEffect": "typewriter|letter-swap|text-rotate|none",
    "animation": {
      "entrance": "fade|slide|scale|bounce",
      "stagger": true|false,
      "duration": 0.3-0.8
    },
    "decorations": [
      { "component": "float", "position": "top-left|top-right|...", "content": "orb|shape|icon" }
    ],
    "accentColor": "#hex"
  }
}

DESIGN RULES:
1. Title slides: Always use animated gradient backgrounds, typewriter effect
2. Content slides: Subtle backgrounds, focus on readability
3. Bullet slides: Staggered animations, floating bullet points
4. Quote slides: Dark dramatic backgrounds, large typography
5. Maintain visual rhythm - alternate between dramatic and calm slides
6. Use decorative Float elements sparingly but consistently
7. Keep text effects subtle - typewriter for titles, static for body

Return a JSON array of designed slides. Include design decisions for every slide.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Design this presentation with consistent branding:\n\n${script}` }
      ],
      temperature: 0.4,
      max_tokens: 8000,
    })

    const content = response.choices[0].message.content || '[]'
    
    // Extract JSON from response
    let jsonStr = content
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1]
    }
    
    const slides = JSON.parse(jsonStr.trim())
    
    return NextResponse.json({ 
      slides,
      brandStyle,
      palette 
    })
  } catch (error) {
    console.error('Error designing presentation:', error)
    return NextResponse.json(
      { error: 'Failed to design presentation' },
      { status: 500 }
    )
  }
}
