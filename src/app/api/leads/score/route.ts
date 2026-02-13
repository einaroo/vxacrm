import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

interface LeadScore {
  customerId: string
  name: string
  company: string
  status: string
  score: number // 0-100
  factors: {
    companyFit: number // 0-25
    dealSize: number // 0-25
    engagement: number // 0-25
    timing: number // 0-25
  }
  signals: string[]
  recommendation: string
}

/**
 * Calculate lead scores for all customers or specific customer
 * GET /api/leads/score - scores all customers
 * GET /api/leads/score?customerId=xxx - scores specific customer
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const customerId = searchParams.get('customerId')
    const includeWonLost = searchParams.get('includeWonLost') === 'true'

    // Fetch customers
    let query = supabase.from('customers').select('*')

    if (customerId) {
      query = query.eq('id', customerId)
    } else if (!includeWonLost) {
      query = query.in('status', ['lead', 'in-contact', 'negotiating'])
    }

    const { data: customers, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('DB error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!customers || customers.length === 0) {
      return NextResponse.json({
        success: true,
        scores: [],
        message: customerId ? 'Customer not found' : 'No customers to score',
      })
    }

    const now = new Date()
    const scores: LeadScore[] = []

    for (const customer of customers) {
      const score = calculateLeadScore(customer, now)
      scores.push(score)
    }

    // Sort by score descending
    scores.sort((a, b) => b.score - a.score)

    // Format for Slack
    const slackMessage = formatScoresForSlack(scores.slice(0, 10))

    return NextResponse.json({
      success: true,
      scores,
      count: scores.length,
      topLeads: scores.slice(0, 5),
      slackMessage,
      scoredAt: now.toISOString(),
    })
  } catch (error) {
    console.error('Lead scoring error:', error)
    return NextResponse.json({ error: 'Failed to score leads' }, { status: 500 })
  }
}

function calculateLeadScore(
  customer: {
    id: string
    name: string | null
    company: string | null
    email: string | null
    status: string
    mrr_value: number | null
    created_at: string
    updated_at: string
  },
  now: Date
): LeadScore {
  const factors = {
    companyFit: 0,
    dealSize: 0,
    engagement: 0,
    timing: 0,
  }
  const signals: string[] = []

  // === COMPANY FIT (0-25 points) ===
  // B2B SaaS, marketing focus = higher score
  const companyLower = (customer.company || '').toLowerCase()
  const nameLower = (customer.name || '').toLowerCase()

  // Industry signals
  if (
    companyLower.includes('saas') ||
    companyLower.includes('software') ||
    companyLower.includes('tech')
  ) {
    factors.companyFit += 8
    signals.push('Tech/SaaS company')
  }

  if (
    companyLower.includes('marketing') ||
    companyLower.includes('media') ||
    companyLower.includes('content') ||
    companyLower.includes('agency')
  ) {
    factors.companyFit += 10
    signals.push('Marketing-focused company')
  }

  // Role signals (from contact name - often includes title)
  if (
    nameLower.includes('cmo') ||
    nameLower.includes('marketing') ||
    nameLower.includes('head of growth')
  ) {
    factors.companyFit += 7
    signals.push('Decision maker contact')
  }

  // Has email (indicates more complete lead)
  if (customer.email) {
    factors.companyFit += 3
    if (customer.email.includes(getDomainFromCompany(customer.company || ''))) {
      factors.companyFit += 2
      signals.push('Company email verified')
    }
  }

  factors.companyFit = Math.min(factors.companyFit, 25)

  // === DEAL SIZE (0-25 points) ===
  const mrrValue = customer.mrr_value || 0

  if (mrrValue >= 10000) {
    factors.dealSize = 25
    signals.push('High-value deal ($10k+ MRR)')
  } else if (mrrValue >= 5000) {
    factors.dealSize = 20
    signals.push('Mid-high deal ($5-10k MRR)')
  } else if (mrrValue >= 2000) {
    factors.dealSize = 15
    signals.push('Mid-value deal ($2-5k MRR)')
  } else if (mrrValue >= 500) {
    factors.dealSize = 10
    signals.push('Starter deal ($500-2k MRR)')
  } else if (mrrValue > 0) {
    factors.dealSize = 5
    signals.push('Small deal potential')
  } else {
    factors.dealSize = 3 // Unknown = some base value
  }

  // === ENGAGEMENT (0-25 points) ===
  // Based on status progression
  const statusScores: Record<string, number> = {
    lead: 5,
    'in-contact': 15,
    negotiating: 25,
    won: 25,
    lost: 0,
  }
  factors.engagement = statusScores[customer.status] || 0

  if (customer.status === 'negotiating') {
    signals.push('In negotiation - hot!')
  } else if (customer.status === 'in-contact') {
    signals.push('Actively engaged')
  }

  // === TIMING (0-25 points) ===
  const daysSinceUpdate = Math.floor(
    (now.getTime() - new Date(customer.updated_at).getTime()) / (1000 * 60 * 60 * 24)
  )
  const daysSinceCreated = Math.floor(
    (now.getTime() - new Date(customer.created_at).getTime()) / (1000 * 60 * 60 * 24)
  )

  // Recently active = higher score
  if (daysSinceUpdate <= 3) {
    factors.timing = 25
    signals.push('Very active (updated in last 3 days)')
  } else if (daysSinceUpdate <= 7) {
    factors.timing = 20
    signals.push('Active (updated this week)')
  } else if (daysSinceUpdate <= 14) {
    factors.timing = 12
  } else if (daysSinceUpdate <= 30) {
    factors.timing = 6
    signals.push('Needs follow-up (2-4 weeks silent)')
  } else {
    factors.timing = 2
    signals.push('⚠️ Going cold (30+ days silent)')
  }

  // Fresh leads get a small boost
  if (daysSinceCreated <= 7 && customer.status === 'lead') {
    factors.timing = Math.min(factors.timing + 5, 25)
    signals.push('Fresh lead')
  }

  // Calculate total score
  const totalScore = factors.companyFit + factors.dealSize + factors.engagement + factors.timing

  // Generate recommendation
  let recommendation = ''
  if (totalScore >= 80) {
    recommendation = '🔥 Hot lead - prioritize immediate follow-up!'
  } else if (totalScore >= 60) {
    recommendation = '⚡ Strong prospect - schedule a call this week'
  } else if (totalScore >= 40) {
    recommendation = '📧 Worth pursuing - send personalized outreach'
  } else if (totalScore >= 20) {
    recommendation = '📋 Nurture - add to email sequence'
  } else {
    recommendation = '❄️ Cold - low priority, revisit later'
  }

  return {
    customerId: customer.id,
    name: customer.name || 'Unknown',
    company: customer.company || 'Unknown',
    status: customer.status,
    score: totalScore,
    factors,
    signals,
    recommendation,
  }
}

function getDomainFromCompany(company: string): string {
  // Simple heuristic to get domain from company name
  return company.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')
}

function formatScoresForSlack(scores: LeadScore[]): string {
  if (scores.length === 0) {
    return '📊 No leads to score at this time.'
  }

  let message = `📊 *Lead Scoring Report* (Top ${scores.length})\n\n`

  scores.forEach((score, i) => {
    const emoji =
      score.score >= 80
        ? '🔥'
        : score.score >= 60
          ? '⚡'
          : score.score >= 40
            ? '📧'
            : score.score >= 20
              ? '📋'
              : '❄️'

    message += `${emoji} *${i + 1}. ${score.name}* (${score.company}) - *${score.score}/100*\n`
    message += `   _${score.status} • ${score.recommendation}_\n`

    if (score.signals.length > 0) {
      message += `   Signals: ${score.signals.slice(0, 3).join(', ')}\n`
    }
    message += '\n'
  })

  message += `---\n_Breakdown: Fit (${scores[0]?.factors.companyFit || 0}/25) + Deal (${scores[0]?.factors.dealSize || 0}/25) + Engagement (${scores[0]?.factors.engagement || 0}/25) + Timing (${scores[0]?.factors.timing || 0}/25)_`

  return message
}
