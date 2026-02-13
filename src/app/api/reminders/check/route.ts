import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

interface ReminderItem {
  id: string
  name: string
  company: string
  email: string | null
  status: string
  daysSilent: number
  mrr_value: number | null
  suggestedFollowUp: string
}

/**
 * Check for customers needing follow-up and generate AI message drafts
 * GET /api/reminders/check
 */
export async function GET() {
  try {
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Find customers in active stages with no update in 7+ days
    const { data: staleCustomers, error } = await supabase
      .from('customers')
      .select('*')
      .in('status', ['lead', 'in-contact', 'negotiating'])
      .lt('updated_at', sevenDaysAgo.toISOString())
      .order('mrr_value', { ascending: false, nullsFirst: false })
      .limit(20)

    if (error) {
      console.error('DB error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!staleCustomers || staleCustomers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No follow-ups needed! All deals are active 🎉',
        reminders: [],
        slackMessage: '✅ *Follow-up Check Complete*\n\nNo deals need follow-up - all pipelines are active!',
      })
    }

    const openaiApiKey = process.env.OPENAI_API_KEY
    const reminders: ReminderItem[] = []

    for (const customer of staleCustomers) {
      const daysSilent = Math.floor(
        (now.getTime() - new Date(customer.updated_at).getTime()) / (1000 * 60 * 60 * 24)
      )

      let suggestedFollowUp = getDefaultFollowUp(customer.name, customer.status, daysSilent)

      // Generate AI follow-up if OpenAI is available
      if (openaiApiKey) {
        try {
          const aiFollowUp = await generateAIFollowUp(
            openaiApiKey,
            customer.name,
            customer.company,
            customer.status,
            daysSilent,
            customer.mrr_value
          )
          if (aiFollowUp) {
            suggestedFollowUp = aiFollowUp
          }
        } catch (e) {
          console.error('AI follow-up failed for', customer.name, e)
        }
      }

      reminders.push({
        id: customer.id,
        name: customer.name || 'Unknown',
        company: customer.company || 'Unknown',
        email: customer.email,
        status: customer.status,
        daysSilent,
        mrr_value: customer.mrr_value,
        suggestedFollowUp,
      })
    }

    // Format for Slack
    const slackMessage = formatRemindersForSlack(reminders)

    return NextResponse.json({
      success: true,
      reminders,
      count: reminders.length,
      slackMessage,
      generatedAt: now.toISOString(),
    })
  } catch (error) {
    console.error('Reminders check error:', error)
    return NextResponse.json({ error: 'Failed to check reminders' }, { status: 500 })
  }
}

function getDefaultFollowUp(name: string, status: string, daysSilent: number): string {
  const firstName = name?.split(' ')[0] || 'there'

  if (status === 'lead') {
    return `Hi ${firstName}, I wanted to follow up on my previous message about VXA. Would love to show you how we're helping marketing teams create high-performing content at scale. Any interest in a quick chat?`
  }

  if (status === 'in-contact') {
    return `Hi ${firstName}, it's been a little while since we last connected. I wanted to check in and see if you had any questions about VXA or if there's anything I can help clarify?`
  }

  if (status === 'negotiating') {
    return `Hi ${firstName}, just wanted to touch base on our conversation. Is there anything holding you back from moving forward? Happy to address any concerns or adjust the proposal if needed.`
  }

  return `Hi ${firstName}, I wanted to follow up - it's been ${daysSilent} days since we last connected. Let me know if you'd like to continue our conversation!`
}

async function generateAIFollowUp(
  apiKey: string,
  name: string,
  company: string,
  status: string,
  daysSilent: number,
  mrrValue: number | null
): Promise<string | null> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You write short, friendly follow-up messages for sales outreach. VXA is an AI-powered marketing workspace that helps create high-performing content at scale.

Guidelines:
- Keep it 2-3 sentences max
- Be warm but professional
- Reference the time gap naturally
- End with a soft question or CTA
- Don't be pushy or salesy
- For leads: introduce value
- For in-contact: check in warmly
- For negotiating: address potential blockers`,
        },
        {
          role: 'user',
          content: `Write a follow-up message for:
- Name: ${name}
- Company: ${company || 'Unknown'}
- Status: ${status}
- Days since last contact: ${daysSilent}
${mrrValue ? `- Deal size: $${mrrValue}/mo potential` : ''}

Just output the message text, no subject line.`,
        },
      ],
      temperature: 0.8,
      max_tokens: 200,
    }),
  })

  if (!response.ok) return null

  const data = await response.json()
  return data.choices[0]?.message?.content?.trim() || null
}

function formatRemindersForSlack(reminders: ReminderItem[]): string {
  let message = `🔔 *Follow-up Reminders* (${reminders.length} deals need attention)\n\n`

  reminders.forEach((r, i) => {
    const mrrStr = r.mrr_value ? ` • $${r.mrr_value.toLocaleString()}/mo` : ''
    message += `*${i + 1}. ${r.name}* (${r.company})\n`
    message += `   _${r.status} • ${r.daysSilent} days silent${mrrStr}_\n`
    message += `   💬 "${r.suggestedFollowUp.slice(0, 100)}${r.suggestedFollowUp.length > 100 ? '...' : ''}"\n\n`
  })

  message += `---\n_Reply to a deal number to send the follow-up_ 📧`

  return message
}
