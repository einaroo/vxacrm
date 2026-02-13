import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

interface CompetitorAlert {
  competitorId: string
  name: string
  website: string | null
  category: 'funding' | 'features' | 'pricing' | 'hiring' | 'news' | 'other'
  headline: string
  summary: string
  impact: 'high' | 'medium' | 'low'
  source?: string
  date?: string
}

interface ScanResult {
  competitor: {
    id: string
    name: string
    website: string | null
  }
  alerts: CompetitorAlert[]
  lastScanned: string
}

/**
 * Scan competitors for recent news and changes
 * GET /api/competitors/scan - scans all competitors
 * GET /api/competitors/scan?competitorId=xxx - scans specific competitor
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const competitorId = searchParams.get('competitorId')

    // Fetch competitors
    let query = supabase.from('competitors').select('*')

    if (competitorId) {
      query = query.eq('id', competitorId)
    }

    const { data: competitors, error } = await query.order('name')

    if (error) {
      console.error('DB error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!competitors || competitors.length === 0) {
      return NextResponse.json({
        success: true,
        results: [],
        message: 'No competitors to scan',
      })
    }

    const openaiApiKey = process.env.OPENAI_API_KEY
    if (!openaiApiKey) {
      return NextResponse.json({ error: 'OpenAI not configured' }, { status: 500 })
    }

    const now = new Date()
    const results: ScanResult[] = []
    const allAlerts: CompetitorAlert[] = []

    // Scan each competitor
    for (const competitor of competitors) {
      try {
        const alerts = await scanCompetitor(openaiApiKey, competitor)
        results.push({
          competitor: {
            id: competitor.id,
            name: competitor.name,
            website: competitor.website,
          },
          alerts,
          lastScanned: now.toISOString(),
        })
        allAlerts.push(...alerts)
      } catch (e) {
        console.error(`Failed to scan ${competitor.name}:`, e)
        results.push({
          competitor: {
            id: competitor.id,
            name: competitor.name,
            website: competitor.website,
          },
          alerts: [],
          lastScanned: now.toISOString(),
        })
      }
    }

    // Sort alerts by impact
    const impactOrder = { high: 0, medium: 1, low: 2 }
    allAlerts.sort((a, b) => impactOrder[a.impact] - impactOrder[b.impact])

    // Format for Slack
    const slackMessage = formatAlertsForSlack(allAlerts, competitors.length)

    return NextResponse.json({
      success: true,
      results,
      allAlerts,
      alertCount: allAlerts.length,
      competitorsScanned: competitors.length,
      slackMessage,
      scannedAt: now.toISOString(),
    })
  } catch (error) {
    console.error('Competitor scan error:', error)
    return NextResponse.json({ error: 'Failed to scan competitors' }, { status: 500 })
  }
}

async function scanCompetitor(
  apiKey: string,
  competitor: {
    id: string
    name: string
    website: string | null
    core_feature: string | null
    pricing: string | null
  }
): Promise<CompetitorAlert[]> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a competitive intelligence analyst. Search for recent news and updates about companies in the marketing tech / AI content space.

Look for:
1. Funding announcements (Series A, B, etc.)
2. New feature launches or product updates
3. Pricing changes
4. Key hires or departures (C-suite, VP level)
5. Partnerships or acquisitions
6. Major customer wins

Return JSON array of alerts found (can be empty if no recent news):
[
  {
    "category": "funding|features|pricing|hiring|news|other",
    "headline": "Short headline",
    "summary": "2-3 sentence summary",
    "impact": "high|medium|low",
    "date": "approximate date if known"
  }
]

Focus on news from the last 30 days. Be factual - only include real news you find. If no news, return empty array.`,
        },
        {
          role: 'user',
          content: `Scan for recent news about:
Company: ${competitor.name}
${competitor.website ? `Website: ${competitor.website}` : ''}
${competitor.core_feature ? `Known for: ${competitor.core_feature}` : ''}

Search and report any recent developments. Return JSON array of alerts.`,
        },
      ],
      temperature: 0.3, // Lower temp for factual recall
    }),
  })

  if (!response.ok) {
    throw new Error('AI request failed')
  }

  const data = await response.json()
  const content = data.choices[0]?.message?.content || ''

  try {
    // Extract JSON array from response
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const alerts = JSON.parse(jsonMatch[0])
      return alerts.map((alert: {
        category?: string
        headline?: string
        summary?: string
        impact?: string
        date?: string
      }) => ({
        competitorId: competitor.id,
        name: competitor.name,
        website: competitor.website,
        category: alert.category || 'other',
        headline: alert.headline || 'Update detected',
        summary: alert.summary || '',
        impact: alert.impact || 'medium',
        date: alert.date,
      }))
    }
  } catch (e) {
    console.error('Failed to parse competitor alerts:', e)
  }

  return []
}

function formatAlertsForSlack(alerts: CompetitorAlert[], competitorCount: number): string {
  let message = `🔍 *Competitor Intelligence Report*\n_Scanned ${competitorCount} competitors_\n\n`

  if (alerts.length === 0) {
    message += '✅ No significant competitor movements detected this period.\n'
    message += '_All quiet on the competitive front!_'
    return message
  }

  // Group by category
  const byCategory: Record<string, CompetitorAlert[]> = {}
  alerts.forEach((alert) => {
    if (!byCategory[alert.category]) {
      byCategory[alert.category] = []
    }
    byCategory[alert.category].push(alert)
  })

  const categoryEmojis: Record<string, string> = {
    funding: '💰',
    features: '🚀',
    pricing: '💵',
    hiring: '👤',
    news: '📰',
    other: '📌',
  }

  const categoryOrder = ['funding', 'features', 'pricing', 'hiring', 'news', 'other']

  for (const category of categoryOrder) {
    if (!byCategory[category]) continue

    const emoji = categoryEmojis[category] || '📌'
    message += `${emoji} *${category.charAt(0).toUpperCase() + category.slice(1)}*\n`

    byCategory[category].forEach((alert) => {
      const impactEmoji = alert.impact === 'high' ? '🔴' : alert.impact === 'medium' ? '🟡' : '🟢'
      message += `${impactEmoji} *${alert.name}*: ${alert.headline}\n`
      message += `   _${alert.summary.slice(0, 150)}${alert.summary.length > 150 ? '...' : ''}_\n`
    })
    message += '\n'
  }

  // High-impact summary
  const highImpact = alerts.filter((a) => a.impact === 'high')
  if (highImpact.length > 0) {
    message += `\n⚠️ *Action Items:* ${highImpact.length} high-impact alert${highImpact.length > 1 ? 's' : ''} detected - review immediately!`
  }

  message += '\n---\n_Weekly competitor scan by VXA CRM_'

  return message
}
