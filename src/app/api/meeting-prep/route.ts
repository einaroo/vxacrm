import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export const dynamic = 'force-dynamic'

interface Meeting {
  id: string
  summary: string
  start: { dateTime?: string; date?: string }
  end: { dateTime?: string; date?: string }
  attendees?: Array<{ email: string; displayName?: string }>
  description?: string
  htmlLink?: string
}

interface PrepDoc {
  meetingTitle: string
  meetingTime: string
  attendees: string[]
  crmContext: {
    name: string
    company: string
    email: string
    status: string
    mrr_value: number | null
    daysSinceUpdate: number
    created_at: string
  } | null
  recruitContext: {
    name: string
    position: string | null
    stage: string
    daysSinceUpdate: number
  } | null
  companyNews: string[]
  talkingPoints: string[]
  calendarLink?: string
}

/**
 * Generate meeting prep docs for upcoming meetings
 * GET /api/meeting-prep - checks for meetings starting in next 30-60 min
 * GET /api/meeting-prep?meetingId=xxx - prep for specific meeting
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const specificMeetingId = searchParams.get('meetingId')
    const lookAheadMinutes = parseInt(searchParams.get('lookAhead') || '60')

    const now = new Date()
    const lookAheadTime = new Date(now.getTime() + lookAheadMinutes * 60 * 1000)
    const thirtyMinFromNow = new Date(now.getTime() + 30 * 60 * 1000)

    // Get upcoming meetings
    let meetings: Meeting[] = []
    try {
      const fromStr = now.toISOString()
      const toStr = lookAheadTime.toISOString()
      const { stdout } = await execAsync(
        `gog calendar events --from='${fromStr}' --to='${toStr}' --json`
      )
      const data = JSON.parse(stdout)
      meetings = data.events || data || []

      if (specificMeetingId) {
        meetings = meetings.filter((m) => m.id === specificMeetingId)
      }
    } catch (error) {
      console.error('Failed to fetch calendar:', error)
      return NextResponse.json({ error: 'Could not fetch calendar' }, { status: 500 })
    }

    if (meetings.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No upcoming meetings in the next hour',
        preps: [],
      })
    }

    // Get all CRM data for matching
    const { data: allCustomers } = await supabase.from('customers').select('*')
    const { data: allRecruits } = await supabase.from('recruits').select('*')

    const prepDocs: PrepDoc[] = []
    const openaiApiKey = process.env.OPENAI_API_KEY

    for (const meeting of meetings) {
      const startTime = meeting.start?.dateTime || meeting.start?.date
      if (!startTime) continue

      const meetingStart = new Date(startTime)
      // Only prep for meetings starting in next 30-60 min (unless specific ID requested)
      if (!specificMeetingId && (meetingStart < thirtyMinFromNow || meetingStart > lookAheadTime)) {
        continue
      }

      const attendeeEmails = (meeting.attendees || [])
        .map((a) => a.email?.toLowerCase())
        .filter(Boolean)
      const attendeeNames = (meeting.attendees || []).map(
        (a) => a.displayName || a.email?.split('@')[0] || 'Unknown'
      )

      // Match with CRM customer
      let crmContext: PrepDoc['crmContext'] = null
      if (allCustomers) {
        const matched = allCustomers.find(
          (c) => c.email && attendeeEmails.includes(c.email.toLowerCase())
        )
        if (matched) {
          crmContext = {
            name: matched.name || 'Unknown',
            company: matched.company || 'Unknown',
            email: matched.email || '',
            status: matched.status,
            mrr_value: matched.mrr_value,
            daysSinceUpdate: Math.floor(
              (now.getTime() - new Date(matched.updated_at).getTime()) / (1000 * 60 * 60 * 24)
            ),
            created_at: matched.created_at,
          }
        }
      }

      // Match with recruit
      let recruitContext: PrepDoc['recruitContext'] = null
      if (allRecruits) {
        const matched = allRecruits.find(
          (r) => r.email && attendeeEmails.includes(r.email.toLowerCase())
        )
        if (matched) {
          recruitContext = {
            name: matched.name || 'Unknown',
            position: matched.position,
            stage: matched.stage,
            daysSinceUpdate: Math.floor(
              (now.getTime() - new Date(matched.updated_at).getTime()) / (1000 * 60 * 60 * 24)
            ),
          }
        }
      }

      // Generate talking points with AI
      let talkingPoints: string[] = []
      let companyNews: string[] = []

      if (openaiApiKey && (crmContext || recruitContext)) {
        try {
          const contextStr = crmContext
            ? `Customer: ${crmContext.name} from ${crmContext.company}, status: ${crmContext.status}, potential: $${crmContext.mrr_value || 'unknown'}/mo, ${crmContext.daysSinceUpdate} days since last update`
            : `Recruit: ${recruitContext!.name}, applying for: ${recruitContext!.position || 'unknown position'}, stage: ${recruitContext!.stage}`

          const aiResult = await generatePrepWithAI(
            openaiApiKey,
            meeting.summary || 'Meeting',
            contextStr,
            crmContext?.company
          )
          talkingPoints = aiResult.talkingPoints
          companyNews = aiResult.companyNews
        } catch (e) {
          console.error('AI prep failed:', e)
          talkingPoints = getDefaultTalkingPoints(crmContext, recruitContext)
        }
      } else {
        talkingPoints = getDefaultTalkingPoints(crmContext, recruitContext)
      }

      prepDocs.push({
        meetingTitle: meeting.summary || '(No title)',
        meetingTime: meetingStart.toLocaleString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Europe/Stockholm',
        }),
        attendees: attendeeNames,
        crmContext,
        recruitContext,
        companyNews,
        talkingPoints,
        calendarLink: meeting.htmlLink,
      })
    }

    // Format for Slack
    const slackMessage = formatPrepForSlack(prepDocs)

    return NextResponse.json({
      success: true,
      preps: prepDocs,
      count: prepDocs.length,
      slackMessage,
      generatedAt: now.toISOString(),
    })
  } catch (error) {
    console.error('Meeting prep error:', error)
    return NextResponse.json({ error: 'Failed to generate prep' }, { status: 500 })
  }
}

async function generatePrepWithAI(
  apiKey: string,
  meetingTitle: string,
  contextStr: string,
  company?: string
): Promise<{ talkingPoints: string[]; companyNews: string[] }> {
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
          content: `You help prepare for business meetings. VXA is an AI-powered marketing workspace.

Generate a JSON response with:
1. talkingPoints: 3-5 specific talking points for the meeting
2. companyNews: 2-3 recent/relevant things about the company (make educated guesses based on industry if unknown)

Be specific and actionable. Focus on value VXA can provide.`,
        },
        {
          role: 'user',
          content: `Meeting: ${meetingTitle}
Context: ${contextStr}
${company ? `Company: ${company}` : ''}

Generate prep in JSON format: { "talkingPoints": [...], "companyNews": [...] }`,
        },
      ],
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    throw new Error('AI request failed')
  }

  const data = await response.json()
  const content = data.choices[0]?.message?.content || ''

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        talkingPoints: parsed.talkingPoints || [],
        companyNews: parsed.companyNews || [],
      }
    }
  } catch {
    // Fall through to default
  }

  return { talkingPoints: [], companyNews: [] }
}

function getDefaultTalkingPoints(
  crmContext: PrepDoc['crmContext'],
  recruitContext: PrepDoc['recruitContext']
): string[] {
  if (crmContext) {
    const points = ['Review their current marketing workflow', 'Demo VXA content generation capabilities']
    if (crmContext.status === 'negotiating') {
      points.push('Address any concerns about pricing or implementation')
      points.push('Discuss timeline and next steps')
    } else if (crmContext.status === 'in-contact') {
      points.push('Understand their specific pain points')
      points.push('Share relevant case studies')
    } else {
      points.push('Introduce VXA and key value propositions')
    }
    return points
  }

  if (recruitContext) {
    return [
      `Review their experience for ${recruitContext.position || 'the role'}`,
      'Discuss team culture and expectations',
      'Answer questions about VXA and the role',
      'Assess culture fit and motivation',
    ]
  }

  return ['Prepare agenda', 'Review previous notes', 'Set clear meeting objectives']
}

function formatPrepForSlack(preps: PrepDoc[]): string {
  if (preps.length === 0) {
    return '📋 No meetings need prep right now.'
  }

  let message = `📋 *Meeting Prep Ready!*\n\n`

  preps.forEach((prep, i) => {
    message += `*${i + 1}. ${prep.meetingTitle}*\n`
    message += `📅 ${prep.meetingTime}\n`
    message += `👥 ${prep.attendees.join(', ')}\n`

    if (prep.crmContext) {
      message += `🏢 ${prep.crmContext.company} • ${prep.crmContext.status}`
      if (prep.crmContext.mrr_value) {
        message += ` • $${prep.crmContext.mrr_value.toLocaleString()}/mo`
      }
      message += '\n'
    }

    if (prep.recruitContext) {
      message += `👤 Recruit: ${prep.recruitContext.position || 'Unknown role'} • ${prep.recruitContext.stage}\n`
    }

    if (prep.companyNews.length > 0) {
      message += `\n📰 *Recent News:*\n`
      prep.companyNews.forEach((news) => {
        message += `• ${news}\n`
      })
    }

    message += `\n💡 *Talking Points:*\n`
    prep.talkingPoints.forEach((point) => {
      message += `• ${point}\n`
    })

    if (prep.calendarLink) {
      message += `\n🔗 <${prep.calendarLink}|Open in Calendar>\n`
    }

    message += '\n---\n\n'
  })

  return message
}
