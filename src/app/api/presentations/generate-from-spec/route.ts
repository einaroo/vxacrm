import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Available Fancy Components with their use cases
const FANCY_COMPONENT_DOCS = `
## Available Fancy Components

### AnimatedGradient
Purpose: Animated gradient backgrounds
Usage: <AnimatedGradient colors={["#color1", "#color2"]} speed={5} blur="heavy" />
When to use: High-energy slides, dramatic reveals, title slides
Props: colors (array), speed (1-10), blur ("light"|"medium"|"heavy")

### Float  
Purpose: Makes elements float with subtle motion
Usage: <Float speed={0.3} amplitude={[15, 10, 0]} rotationRange={[3, 2, 1]} timeOffset={0}>...</Float>
When to use: Icons, decorative elements, emphasis on key elements
Props: speed (0.1-1), amplitude ([x,y,z]), rotationRange ([x,y,z]), timeOffset (stagger)

### Typewriter
Purpose: Animated text typing effect
Usage: <Typewriter text="Your text" speed={40} className="..." />
When to use: Headlines, key messages, dramatic reveals
Props: text (string), speed (ms per char), className

### TextRotate
Purpose: Cycling through text alternatives
Usage: <TextRotate texts={["Fast", "Smart", "Easy"]} className="..." />
When to use: Value propositions, alternatives, dynamic messaging
Props: texts (array), className

### SimpleMarquee
Purpose: Horizontal scrolling text
Usage: <SimpleMarquee speed={40} direction="left">...</SimpleMarquee>
When to use: Testimonials, logos, continuous messaging
Props: speed, direction ("left"|"right")

### LetterSwap
Purpose: Letter-by-letter swap animation
Usage: <LetterSwap text="IMPACT" className="..." />
When to use: Short impactful words, emphasis
Props: text, className

### motion.div (Framer Motion)
Purpose: Any animation with initial/animate states
Usage: <motion.div initial={{...}} animate={{...}} transition={{...}}>...</motion.div>
When to use: Everything - entrances, emphasis, stagger effects
`

const SYSTEM_PROMPT = `You are a code generator that converts slide design specifications into React/JSX code.

${FANCY_COMPONENT_DOCS}

## Code Generation Rules

1. Root element MUST be: <motion.div className="w-full h-full relative overflow-hidden ...">
2. Use the fancy_components specified in the slide spec
3. Match the visual_description exactly
4. Follow the color_system, typography_character, and composition specs
5. Add floating decorations based on graphic_elements.suggested
6. Use motion.div for all animated entrances
7. NO .map() loops - write each element explicitly
8. NO imports or exports - just JSX

## Dark Mode Pattern
- Background: bg-black or bg-slate-900/950
- Text: text-white, text-slate-300
- Accents: Glowing colors with opacity

## Light Mode Pattern  
- Background: bg-white or bg-slate-50
- Text: text-slate-900, text-slate-600
- Accents: Solid colors, subtle shadows

## Output Format
Return JSON:
{
  "slides": [
    {
      "slide_number": number,
      "code": "<motion.div>...</motion.div>"
    }
  ]
}`

export async function POST(req: NextRequest) {
  try {
    const { spec } = await req.json()

    if (!spec?.slides || !Array.isArray(spec.slides)) {
      return NextResponse.json({ error: 'Invalid spec - slides array required' }, { status: 400 })
    }

    const mode = spec.presentation?.overall_style || 'dark'

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Generate JSX code for each slide based on these specifications.

## Presentation Mode: ${mode.toUpperCase()}

## Design System:
${JSON.stringify(spec.presentation?.design_system || {}, null, 2)}

## Slides to Generate:
${spec.slides.map((s: Record<string, unknown>, i: number) => `
### Slide ${i + 1}: ${s.slide_title}
Visual Description: ${s.visual_description}
Reasoning: ${s.reasoning}
Copy: ${JSON.stringify(s.copy)}
Fancy Components to Use: ${JSON.stringify((s.style as Record<string, unknown>)?.fancy_components || [])}
Composition: ${JSON.stringify((s.style as Record<string, unknown>)?.composition || {})}
Typography: ${JSON.stringify((s.style as Record<string, unknown>)?.typography_character || {})}
Animation: ${JSON.stringify((s.style as Record<string, unknown>)?.animation_approach || {})}
`).join('\n---\n')}

Generate beautiful, visually rich JSX for each slide. Follow each slide's spec exactly.`
        }
      ],
      temperature: 0.3,
      max_tokens: 16000,
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 })
    }

    const result = JSON.parse(content)
    
    if (!result.slides || !Array.isArray(result.slides)) {
      return NextResponse.json({ error: 'Invalid response format' }, { status: 500 })
    }

    return NextResponse.json({ slides: result.slides })
  } catch (error) {
    console.error('Generate from spec error:', error)
    return NextResponse.json(
      { error: 'Failed to generate code' },
      { status: 500 }
    )
  }
}
