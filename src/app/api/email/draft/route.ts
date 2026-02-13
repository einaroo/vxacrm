import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

interface DraftEmailRequest {
  customerId: string
  context?: string
  tone?: 'friendly' | 'professional' | 'casual'
}

/**
 * Generate AI-drafted email based on customer context
 * POST /api/email/draft
 */
export async function POST(request: NextRequest) {
  try {
    const body: DraftEmailRequest = await request.json()

    if (!body.customerId) {
      return NextResponse.json({ error: 'customerId required' }, { status: 400 })
    }

    const openaiApiKey = process.env.OPENAI_API_KEY
    if (!openaiApiKey) {
      return NextResponse.json({ error: 'OpenAI not configured' }, { status: 500 })
    }

    // Fetch customer data
    const { data: customer, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', body.customerId)
      .single()

    if (error || !customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Calculate days since last contact
    const daysSinceUpdate = customer.updated_at
      ? Math.floor(
          (Date.now() - new Date(customer.updated_at).getTime()) / (1000 * 60 * 60 * 24)
        )
      : null

    // Build context for AI
    const customerContext = `
Customer: ${customer.name || 'Unknown'}
Company: ${customer.company || 'Unknown'}
Email: ${customer.email || 'Unknown'}
Status: ${customer.status}
MRR Value: ${customer.mrr_value ? `$${customer.mrr_value}/mo` : 'Not set'}
Days since last contact: ${daysSinceUpdate !== null ? daysSinceUpdate : 'Unknown'}
${body.context ? `Additional context: ${body.context}` : ''}
`.trim()

    // Generate email draft with OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant drafting personalized sales emails for VXA, an AI-powered marketing workspace that helps create high-performing content at scale.

Guidelines:
- Keep emails short (3-5 sentences max)
- Be ${body.tone || 'professional'} but warm
- Reference specific details about their company/situation
- End with a soft CTA (e.g., "Would love to show you...", "Happy to chat if...")
- For leads: introduce VXA and its value
- For in-contact/negotiating: follow up on previous conversations
- For won: check in on satisfaction, ask for feedback
- For lost: polite reconnection attempt

Return JSON:
{
  "subject": "Email subject line",
  "body": "Email body text"
}`,
          },
          {
            role: 'user',
            content: `Draft a personalized email for this customer:\n\n${customerContext}`,
          },
        ],
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      console.error('OpenAI error:', await response.text())
      return NextResponse.json({ error: 'Failed to generate draft' }, { status: 500 })
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content || ''

    // Parse JSON from response
    let draft = {
      subject: `Following up - VXA for ${customer.company || customer.name}`,
      body: `Hi${customer.name ? ` ${customer.name.split(' ')[0]}` : ''},\n\nI wanted to reach out about VXA and how we could help ${customer.company || 'your team'} create high-performing marketing content at scale.\n\nWould love to show you what we're building.\n\nBest,\nEinar`,
    }

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        draft = {
          subject: parsed.subject || draft.subject,
          body: parsed.body || draft.body,
        }
      }
    } catch (e) {
      console.error('Failed to parse AI response:', e)
    }

    return NextResponse.json({
      success: true,
      draft,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        company: customer.company,
        status: customer.status,
      },
    })
  } catch (error) {
    console.error('Draft email error:', error)
    return NextResponse.json({ error: 'Failed to generate draft' }, { status: 500 })
  }
}
