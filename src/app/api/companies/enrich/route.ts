import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

interface EnrichRequest {
  company: string
  website?: string
  description?: string
  customerId?: string // ID to update after enrichment
}

interface EnrichResponse {
  contact?: {
    name: string
    role: string
    linkedIn?: string
    email?: string
  }
  draftMessage: string
}

/**
 * Enrich company data with contact info and draft outreach message
 * POST /api/companies/enrich
 */
export async function POST(request: NextRequest) {
  try {
    const body: EnrichRequest = await request.json()

    if (!body.company) {
      return NextResponse.json({ error: 'Company name required' }, { status: 400 })
    }

    const openaiApiKey = process.env.OPENAI_API_KEY
    if (!openaiApiKey) {
      return NextResponse.json({ error: 'OpenAI not configured' }, { status: 500 })
    }

    // Use OpenAI with web search to find contact and draft message
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        tools: [{ type: 'web_search' }],
        input: `I need to reach out to ${body.company}${body.website ? ` (${body.website})` : ''} about VXA, an AI-powered marketing workspace that helps create high-performing content at scale.

${body.description ? `About them: ${body.description}` : ''}

Please:
1. Find the best person to contact (CMO, Head of Marketing, Marketing Director, or Founder). Search for their LinkedIn profile.
2. Draft a short, personalized cold outreach email (3-4 sentences max) that:
   - References something specific about their company
   - Introduces VXA briefly
   - Has a soft CTA (e.g., "Would love to show you how...")

Return as JSON:
{
  "contact": {
    "name": "Person Name",
    "role": "Their Title",
    "linkedIn": "https://linkedin.com/in/..."
  },
  "draftMessage": "Subject: ...\n\nHi [Name],\n\n..."
}`,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('OpenAI enrich error:', error)
      return NextResponse.json({ error: 'Failed to enrich' }, { status: 500 })
    }

    const data = await response.json()
    
    // Find the message output
    const messageOutput = data.output?.find((o: { type: string }) => o.type === 'message')
    const outputText = messageOutput?.content?.[0]?.text || ''

    // Parse JSON from response
    let result: EnrichResponse = {
      draftMessage: `Subject: Quick intro - VXA for ${body.company}\n\nHi,\n\nI came across ${body.company} and was impressed by what you're building. At VXA, we help marketing teams create high-performing content at scale using AI.\n\nWould love to show you how we could help accelerate your content production.\n\nBest,\nEinar`
    }

    try {
      const jsonMatch = outputText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        result = {
          contact: parsed.contact,
          draftMessage: parsed.draftMessage || result.draftMessage,
        }
      }
    } catch (e) {
      console.error('Failed to parse enrich response:', e)
    }

    // Update customer record with enriched contact info
    if (result.contact?.name) {
      // Find customer by company name
      const { data: customers } = await supabase
        .from('customers')
        .select('id')
        .ilike('company', body.company)
        .limit(1)

      if (customers && customers.length > 0) {
        // Construct email from contact name and domain
        let contactEmail = ''
        if (body.website) {
          try {
            const domain = new URL(body.website.startsWith('http') ? body.website : `https://${body.website}`).hostname.replace('www.', '')
            const firstName = result.contact.name.split(' ')[0].toLowerCase()
            contactEmail = `${firstName}@${domain}`
          } catch { /* ignore */ }
        }

        // Update customer with contact info
        await supabase
          .from('customers')
          .update({
            name: result.contact.name,
            email: contactEmail || undefined,
          })
          .eq('id', customers[0].id)
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Enrich error:', error)
    return NextResponse.json({ error: 'Enrich failed' }, { status: 500 })
  }
}
