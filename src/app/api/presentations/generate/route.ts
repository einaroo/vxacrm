import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  try {
    const { script } = await request.json()

    if (!script) {
      return NextResponse.json({ error: 'Script is required' }, { status: 400 })
    }

    const systemPrompt = `You are a presentation parser. Given a script/outline, extract slides and return them as JSON.

Each slide should have:
- template: one of "title", "content", "bullets", "two-column", "quote", "image"
- content: an object with the appropriate fields for that template

Template content fields:
- title: { title, subtitle? }
- content: { title, body }
- bullets: { title, bullets: string[] }
- two-column: { title, left, right }
- quote: { quote, author? }
- image: { imageUrl?, caption? }

Rules:
1. First slide should usually be "title" template
2. Use "bullets" for lists
3. Use "content" for paragraphs
4. Use "quote" for testimonials or key quotes
5. Keep text concise - this is for slides, not documents
6. Return ONLY valid JSON array of slides, no markdown

Example output:
[
  {"template": "title", "content": {"title": "Presentation Title", "subtitle": "Tagline here"}},
  {"template": "bullets", "content": {"title": "Key Points", "bullets": ["Point 1", "Point 2", "Point 3"]}}
]`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Parse this presentation script into slides:\n\n${script}` }
      ],
      temperature: 0.3,
      max_tokens: 4000,
    })

    const content = response.choices[0].message.content || '[]'
    
    // Extract JSON from response (handle potential markdown wrapping)
    let jsonStr = content
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1]
    }
    
    const slides = JSON.parse(jsonStr.trim())
    
    return NextResponse.json({ slides })
  } catch (error) {
    console.error('Error generating presentation:', error)
    return NextResponse.json(
      { error: 'Failed to generate presentation' },
      { status: 500 }
    )
  }
}
