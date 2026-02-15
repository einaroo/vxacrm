import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Fancy Components Design System
const DESIGN_SYSTEM = {
  components: {
    backgrounds: {
      'animated-gradient-with-svg': {
        description: 'Flowing animated gradient background',
        props: ['colors (array of 3-5 hex)', 'speed (4-10)', 'blur (light/medium/heavy)'],
        bestFor: ['title slides', 'quote slides', 'dramatic moments'],
      },
      'solid-gradient': {
        description: 'Static gradient background',
        props: ['from (hex)', 'to (hex)', 'direction (to-r/to-br/to-b)'],
        bestFor: ['content slides', 'subtle backgrounds'],
      },
    },
    text: {
      'typewriter': {
        description: 'Types out text character by character',
        props: ['speed (20-50ms)', 'delay (0-500ms)'],
        bestFor: ['titles', 'key statements', 'quotes'],
      },
      'simple-marquee': {
        description: 'Scrolling text banner',
        props: ['baseVelocity (50-150)', 'direction (left/right)'],
        bestFor: ['decorative text', 'repeating messages'],
      },
    },
    decorations: {
      'float': {
        description: 'Floating/hovering element with 3D motion',
        props: ['speed (0.2-0.6)', 'amplitude ([x,y,z])', 'rotationRange ([x,y,z])'],
        bestFor: ['orbs', 'shapes', 'icons', 'images'],
      },
    },
    filters: {
      'gooey-svg-filter': {
        description: 'Gooey blob effect',
        props: ['blur (10-30)', 'alphaMatrix (15-25)'],
        bestFor: ['blob shapes', 'organic decorations'],
      },
    },
  },
  
  palettes: {
    professional: {
      primary: ['#0ea5e9', '#3b82f6', '#6366f1'],
      secondary: ['#64748b', '#475569'],
      accent: '#f59e0b',
      background: { light: '#ffffff', dark: '#0f172a' },
      gradient: ['#0ea5e9', '#6366f1', '#8b5cf6'],
    },
    bold: {
      primary: ['#dc2626', '#ea580c', '#f59e0b'],
      secondary: ['#1f2937', '#111827'],
      accent: '#fbbf24',
      background: { light: '#ffffff', dark: '#111827' },
      gradient: ['#dc2626', '#ea580c', '#f59e0b', '#fbbf24'],
    },
    creative: {
      primary: ['#8b5cf6', '#a855f7', '#d946ef'],
      secondary: ['#6366f1', '#4f46e5'],
      accent: '#06b6d4',
      background: { light: '#faf5ff', dark: '#1e1b4b' },
      gradient: ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef'],
    },
    minimal: {
      primary: ['#18181b', '#27272a', '#3f3f46'],
      secondary: ['#71717a', '#a1a1aa'],
      accent: '#3b82f6',
      background: { light: '#ffffff', dark: '#18181b' },
      gradient: ['#27272a', '#3f3f46', '#52525b'],
    },
    tech: {
      primary: ['#06b6d4', '#0891b2', '#0e7490'],
      secondary: ['#1e293b', '#0f172a'],
      accent: '#22d3ee',
      background: { light: '#f0fdfa', dark: '#0f172a' },
      gradient: ['#06b6d4', '#0891b2', '#0e7490', '#155e75'],
    },
  },
}

export async function POST(request: Request) {
  try {
    const { script, brandStyle = 'professional' } = await request.json()

    if (!script) {
      return NextResponse.json({ error: 'Script is required' }, { status: 400 })
    }

    const palette = DESIGN_SYSTEM.palettes[brandStyle as keyof typeof DESIGN_SYSTEM.palettes] || DESIGN_SYSTEM.palettes.professional

    const systemPrompt = `You are a visual presentation designer. Create beautiful, branded slides using the Fancy Components design system.

# DESIGN SYSTEM

## Brand Palette: "${brandStyle}"
${JSON.stringify(palette, null, 2)}

## Available Fancy Components:
${JSON.stringify(DESIGN_SYSTEM.components, null, 2)}

# YOUR JOB

For EACH slide, create a complete visual design specification:

\`\`\`json
{
  "template": "title|content|bullets|two-column|quote|image",
  "content": {
    "title": "...",
    // other content fields based on template
  },
  "visual": {
    "background": {
      "component": "animated-gradient-with-svg" | "solid-gradient" | null,
      "props": {
        // component-specific props
        "colors": ["#hex", "#hex", "#hex"],
        "speed": 6,
        "blur": "heavy"
      }
    },
    "layout": {
      "textAlign": "center" | "left",
      "verticalAlign": "center" | "top",
      "padding": "normal" | "large" | "compact"
    },
    "typography": {
      "titleSize": "7xl" | "6xl" | "5xl" | "4xl",
      "titleWeight": "bold" | "semibold" | "medium",
      "titleEffect": "typewriter" | "static",
      "titleColor": "#hex or gradient",
      "bodySize": "2xl" | "xl" | "lg",
      "fontFamily": "inter" | "georgia"
    },
    "decorations": [
      {
        "component": "float",
        "element": "orb" | "shape" | "icon" | "quote-mark",
        "position": { "top": "15%", "left": "10%" },
        "size": "w-32 h-32",
        "style": "rounded-full bg-white/10 blur-xl",
        "props": {
          "speed": 0.3,
          "amplitude": [20, 15, 0],
          "rotationRange": [5, 5, 3],
          "timeOffset": 0
        }
      }
    ],
    "animations": {
      "entrance": "fade-up" | "fade" | "scale" | "slide-left" | "slide-right",
      "stagger": true | false,
      "staggerDelay": 0.1,
      "duration": 0.5
    },
    "colorScheme": "light" | "dark"
  }
}
\`\`\`

# DESIGN RULES

1. **Title slides**: ALWAYS use animated-gradient-with-svg background with brand gradient colors. Add 2-3 floating orb decorations. Use typewriter effect.

2. **Content slides**: Light background (solid-gradient or white). Focus on readability. Subtle entrance animations.

3. **Bullet slides**: Add floating bullets. Stagger entrance animations. Use accent color for bullet points.

4. **Quote slides**: Dark colorScheme. Use animated gradient at low opacity. Add large floating quote marks. Georgia font for quotes.

5. **Two-column slides**: Color-code columns with primary/secondary colors. Add subtle borders.

6. **Visual rhythm**: Alternate between dramatic (title, quote) and calm (content, bullets) slides.

7. **Decorations**: Use Float component for all decorative elements. Vary timeOffset so elements don't sync.

8. **Colors**: ALWAYS use colors from the brand palette. Never use generic colors.

Return a JSON array of fully designed slides. Every slide must have complete visual specifications.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Design this presentation with the "${brandStyle}" brand style. Create stunning visuals for each slide:\n\n${script}` }
      ],
      temperature: 0.5,
      max_tokens: 10000,
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
      palette,
      designSystem: DESIGN_SYSTEM.components,
    })
  } catch (error) {
    console.error('Error designing presentation:', error)
    return NextResponse.json(
      { error: 'Failed to design presentation' },
      { status: 500 }
    )
  }
}
