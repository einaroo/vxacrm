import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

interface EnrichRequest {
  company: string
  website?: string
  description?: string
  customerId?: string
}

interface EnrichResponse {
  contact?: {
    name: string
    role: string
    linkedIn?: string
    email?: string
  }
  companyInfo?: {
    description: string
    industry: string
    employeeCount: string
    fundingStage: string
    techStack: string[]
    headquarters: string
    founded: string
    recentNews: string[]
  }
  draftMessage: string
  fit: {
    score: number // 1-100
    reasons: string[]
  }
}

/**
 * Enhanced company enrichment with contact info, company data, and fit scoring
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

    // Enhanced enrichment prompt
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a B2B sales research assistant. Enrich company data for VXA (AI-powered marketing workspace for high-performing content).

Provide comprehensive company intelligence including:
- Best contact (CMO/Head of Marketing/Marketing Director/Founder)
- Company details (size, funding, tech stack, industry)
- Fit score for VXA (B2B SaaS, marketing-heavy, content-focused = higher)

Return JSON only:
{
  "contact": {
    "name": "Person Name",
    "role": "Title",
    "linkedIn": "https://linkedin.com/in/...",
    "email": "guess@domain.com"
  },
  "companyInfo": {
    "description": "Brief company description",
    "industry": "Industry category",
    "employeeCount": "e.g., 50-100, 100-500",
    "fundingStage": "e.g., Seed, Series A, Series B, Bootstrapped, Public",
    "techStack": ["CRM they use", "Marketing tools", etc],
    "headquarters": "City, Country",
    "founded": "Year",
    "recentNews": ["Recent development 1", "Recent development 2"]
  },
  "draftMessage": "Subject: ...\n\nHi [Name],\n\n...",
  "fit": {
    "score": 75,
    "reasons": ["B2B SaaS company", "Heavy marketing focus", etc]
  }
}`,
          },
          {
            role: 'user',
            content: `Enrich this company:
Company: ${body.company}
${body.website ? `Website: ${body.website}` : ''}
${body.description ? `Known info: ${body.description}` : ''}

Research and provide comprehensive data. Make educated guesses where info isn't public. Score fit 1-100 for VXA.`,
          },
        ],
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('OpenAI enrich error:', error)
      return NextResponse.json({ error: 'Failed to enrich' }, { status: 500 })
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content || ''

    // Parse JSON from response
    let result: EnrichResponse = {
      draftMessage: `Subject: Quick intro - VXA for ${body.company}\n\nHi,\n\nI came across ${body.company} and was impressed by what you're building. At VXA, we help marketing teams create high-performing content at scale using AI.\n\nWould love to show you how we could help accelerate your content production.\n\nBest,\nEinar`,
      fit: { score: 50, reasons: ['Unknown fit - needs more research'] },
    }

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        result = {
          contact: parsed.contact,
          companyInfo: parsed.companyInfo,
          draftMessage: parsed.draftMessage || result.draftMessage,
          fit: parsed.fit || result.fit,
        }
      }
    } catch (e) {
      console.error('Failed to parse enrich response:', e)
    }

    // Update customer record with enriched data
    const customerId = body.customerId
    let targetId = customerId

    if (!targetId) {
      // Find customer by company name
      const { data: customers } = await supabase
        .from('customers')
        .select('id')
        .ilike('company', body.company)
        .limit(1)

      if (customers && customers.length > 0) {
        targetId = customers[0].id
      }
    }

    if (targetId) {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      }

      if (result.contact?.name) {
        updateData.name = result.contact.name
      }

      // Construct email from contact name and domain
      if (result.contact?.email) {
        updateData.email = result.contact.email
      } else if (result.contact?.name && body.website) {
        try {
          const domain = new URL(
            body.website.startsWith('http') ? body.website : `https://${body.website}`
          ).hostname.replace('www.', '')
          const firstName = result.contact.name.split(' ')[0].toLowerCase()
          updateData.email = `${firstName}@${domain}`
        } catch {
          /* ignore */
        }
      }

      await supabase.from('customers').update(updateData).eq('id', targetId)

      // Store enrichment data in a separate field if we had a JSON column
      // For now, we'll return it in the response
    }

    return NextResponse.json({
      success: true,
      ...result,
      customerId: targetId,
    })
  } catch (error) {
    console.error('Enrich error:', error)
    return NextResponse.json({ error: 'Enrich failed' }, { status: 500 })
  }
}
