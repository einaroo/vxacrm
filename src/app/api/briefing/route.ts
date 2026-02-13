import { NextResponse } from 'next/server'
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
}

interface BriefingData {
  silentDeals: Array<{
    id: string
    name: string
    company: string
    status: string
    daysSilent: number
    mrr_value: number | null
  }>
  todaysMeetings: Array<{
    title: string
    time: string
    attendees: string[]
    crmContext?: {
      name: string
      company: string
      status: string
      mrr_value: number | null
    }
  }>
  hotLeads: Array<{
    id: string
    name: string
    company: string
    daysOld: number
    mrr_value: number | null
  }>
  recruitsNeedingAction: Array<{
    id: string
    name: string
    position: string | null
    stage: string
    daysSinceUpdate: number
  }>
}

/**
 * Generate morning briefing digest
 * GET /api/briefing
 */
export async function GET() {
  try {
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    // 1. Find deals gone silent (no update in 7+ days, in active stages)
    const { data: silentCustomers } = await supabase
      .from('customers')
      .select('*')
      .in('status', ['lead', 'in-contact', 'negotiating'])
      .lt('updated_at', sevenDaysAgo.toISOString())
      .order('updated_at', { ascending: true })

    const silentDeals = (silentCustomers || []).map((c) => ({
      id: c.id,
      name: c.name || 'Unknown',
      company: c.company || 'Unknown',
      status: c.status,
      daysSilent: Math.floor(
        (now.getTime() - new Date(c.updated_at).getTime()) / (1000 * 60 * 60 * 24)
      ),
      mrr_value: c.mrr_value,
    }))

    // 2. Get today's meetings from Google Calendar
    let todaysMeetings: BriefingData['todaysMeetings'] = []
    try {
      const { stdout } = await execAsync('gog calendar events --today --json')
      const data = JSON.parse(stdout)
      const events: Meeting[] = data.events || data || []

      // Get all customers for matching
      const { data: allCustomers } = await supabase.from('customers').select('*')

      todaysMeetings = events.map((event) => {
        const startTime = event.start?.dateTime || event.start?.date || ''
        const attendeeEmails = (event.attendees || []).map((a) => a.email?.toLowerCase())
        const attendeeNames = (event.attendees || []).map(
          (a) => a.displayName || a.email?.split('@')[0] || 'Unknown'
        )

        // Try to find matching customer by email
        let crmContext: BriefingData['todaysMeetings'][0]['crmContext'] | undefined
        if (allCustomers) {
          const matchedCustomer = allCustomers.find(
            (c) => c.email && attendeeEmails.includes(c.email.toLowerCase())
          )
          if (matchedCustomer) {
            crmContext = {
              name: matchedCustomer.name,
              company: matchedCustomer.company,
              status: matchedCustomer.status,
              mrr_value: matchedCustomer.mrr_value,
            }
          }
        }

        return {
          title: event.summary || '(No title)',
          time: startTime
            ? new Date(startTime).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Europe/Stockholm',
              })
            : 'TBD',
          attendees: attendeeNames,
          crmContext,
        }
      })
    } catch (error) {
      console.error('Failed to fetch calendar:', error)
    }

    // 3. Hot leads (recently added in last 14 days, still in lead/in-contact)
    const { data: recentLeads } = await supabase
      .from('customers')
      .select('*')
      .in('status', ['lead', 'in-contact'])
      .gt('created_at', fourteenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(10)

    const hotLeads = (recentLeads || []).map((c) => ({
      id: c.id,
      name: c.name || 'Unknown',
      company: c.company || 'Unknown',
      daysOld: Math.floor(
        (now.getTime() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24)
      ),
      mrr_value: c.mrr_value,
    }))

    // 4. Recruits needing action (no update in 7+ days, in active stages)
    const { data: staleRecruits } = await supabase
      .from('recruits')
      .select('*')
      .in('stage', ['lead', 'screen', 'interview', 'offer'])
      .lt('updated_at', sevenDaysAgo.toISOString())
      .order('updated_at', { ascending: true })

    const recruitsNeedingAction = (staleRecruits || []).map((r) => ({
      id: r.id,
      name: r.name || 'Unknown',
      position: r.position,
      stage: r.stage,
      daysSinceUpdate: Math.floor(
        (now.getTime() - new Date(r.updated_at).getTime()) / (1000 * 60 * 60 * 24)
      ),
    }))

    const briefing: BriefingData = {
      silentDeals,
      todaysMeetings,
      hotLeads,
      recruitsNeedingAction,
    }

    // Format for Slack
    const slackMessage = formatBriefingForSlack(briefing, now)

    return NextResponse.json({
      success: true,
      briefing,
      slackMessage,
      generatedAt: now.toISOString(),
    })
  } catch (error) {
    console.error('Briefing error:', error)
    return NextResponse.json({ error: 'Failed to generate briefing' }, { status: 500 })
  }
}

function formatBriefingForSlack(briefing: BriefingData, now: Date): string {
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  let message = `☀️ *Good morning! Here's your briefing for ${dateStr}*\n\n`

  // Today's Meetings
  message += `📅 *Today's Meetings* (${briefing.todaysMeetings.length})\n`
  if (briefing.todaysMeetings.length === 0) {
    message += '_No meetings scheduled_\n'
  } else {
    briefing.todaysMeetings.forEach((m) => {
      message += `• ${m.time} - ${m.title}`
      if (m.crmContext) {
        message += ` _(${m.crmContext.company}, ${m.crmContext.status})_`
      }
      message += '\n'
    })
  }

  message += '\n'

  // Silent Deals
  message += `🔕 *Deals Gone Silent* (${briefing.silentDeals.length})\n`
  if (briefing.silentDeals.length === 0) {
    message += '_All deals are active! 🎉_\n'
  } else {
    briefing.silentDeals.slice(0, 5).forEach((d) => {
      message += `• ${d.name} (${d.company}) - ${d.daysSilent} days silent`
      if (d.mrr_value) message += ` - $${d.mrr_value.toLocaleString()}/mo`
      message += '\n'
    })
    if (briefing.silentDeals.length > 5) {
      message += `_...and ${briefing.silentDeals.length - 5} more_\n`
    }
  }

  message += '\n'

  // Hot Leads
  message += `🔥 *Hot Leads* (${briefing.hotLeads.length})\n`
  if (briefing.hotLeads.length === 0) {
    message += '_No new leads in the last 2 weeks_\n'
  } else {
    briefing.hotLeads.slice(0, 5).forEach((l) => {
      message += `• ${l.name} (${l.company}) - ${l.daysOld} days old`
      if (l.mrr_value) message += ` - $${l.mrr_value.toLocaleString()}/mo potential`
      message += '\n'
    })
  }

  message += '\n'

  // Recruits
  message += `👥 *Recruits Needing Action* (${briefing.recruitsNeedingAction.length})\n`
  if (briefing.recruitsNeedingAction.length === 0) {
    message += '_All recruitment pipelines are active!_\n'
  } else {
    briefing.recruitsNeedingAction.slice(0, 5).forEach((r) => {
      message += `• ${r.name}${r.position ? ` (${r.position})` : ''} - ${r.stage} stage, ${r.daysSinceUpdate} days\n`
    })
    if (briefing.recruitsNeedingAction.length > 5) {
      message += `_...and ${briefing.recruitsNeedingAction.length - 5} more_\n`
    }
  }

  message += '\n---\n_Generated by VXA CRM_ 🚀'

  return message
}
