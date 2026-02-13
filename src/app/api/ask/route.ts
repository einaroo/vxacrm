import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { Customer, Recruit, Competitor } from '@/lib/types'

/**
 * Ask VXA API Route - Intelligent CRM Assistant
 * 
 * This is a smart query processor that understands natural language requests
 * about your CRM data and returns actionable, conversational responses.
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * ARCHITECTURE OVERVIEW
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * 1. INTENT CLASSIFICATION
 *    - Currently: Keyword matching with pattern extraction
 *    - Future: Replace classifyIntent() with LLM call
 * 
 * 2. QUERY PARSING
 *    - Extracts filters: days, values, stages, names
 *    - Uses regex patterns to pull structured data from natural language
 * 
 * 3. DATA RETRIEVAL
 *    - Queries Supabase based on classified intent and filters
 *    - Applies smart defaults (e.g., "silent" = 14 days)
 * 
 * 4. RESPONSE FORMATTING
 *    - Conversational summaries, not data dumps
 *    - Suggested follow-up actions
 *    - Structured data for UI rendering
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * ADDING LLM INTEGRATION (OpenAI / Anthropic)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * To upgrade to LLM-powered classification:
 * 
 * 1. Install SDK:
 *    npm install openai  // or @anthropic-ai/sdk
 * 
 * 2. Add API key to .env.local:
 *    OPENAI_API_KEY=sk-...
 *    // or ANTHROPIC_API_KEY=sk-ant-...
 * 
 * 3. Replace classifyIntent() with:
 * 
 *    import OpenAI from 'openai'
 *    const openai = new OpenAI()
 *    
 *    async function classifyIntentWithLLM(query: string): Promise<ParsedIntent> {
 *      const response = await openai.chat.completions.create({
 *        model: 'gpt-4o-mini',  // Fast and cheap for classification
 *        messages: [
 *          {
 *            role: 'system',
 *            content: `You are a CRM query classifier. Given a user query, extract:
 *              - intent: one of ${Object.keys(INTENT_PATTERNS).join(', ')}
 *              - filters: { days?: number, minValue?: number, stage?: string, name?: string }
 *              Respond with JSON only.`
 *          },
 *          { role: 'user', content: query }
 *        ],
 *        response_format: { type: 'json_object' }
 *      })
 *      return JSON.parse(response.choices[0].message.content)
 *    }
 * 
 * 4. For natural language summaries, use LLM in formatResponse():
 * 
 *    async function generateSummary(data: any[], intent: IntentType): Promise<string> {
 *      const response = await openai.chat.completions.create({
 *        model: 'gpt-4o-mini',
 *        messages: [
 *          {
 *            role: 'system',
 *            content: 'Summarize this CRM data conversationally in 1-2 sentences.'
 *          },
 *          { role: 'user', content: JSON.stringify(data) }
 *        ]
 *      })
 *      return response.choices[0].message.content
 *    }
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type IntentType = 
  | 'pipeline_overview'    // General pipeline status
  | 'pipeline_silent'      // Deals gone quiet
  | 'pipeline_by_stage'    // Filter by stage
  | 'pipeline_by_value'    // Filter by MRR value
  | 'pipeline_analytics'   // Stats and metrics
  | 'meeting_prep'         // Prep for a meeting with someone
  | 'recruitment'          // Candidate queries
  | 'recruitment_by_stage' // Candidates in specific stage
  | 'competitor_intel'     // Competitor information
  | 'prospecting'          // Find new prospects (web search)
  | 'customer_health'      // Check on customer status
  | 'general'              // Fallback

interface QueryFilters {
  days?: number          // Time filter (e.g., "last 14 days")
  minValue?: number      // MRR filter (e.g., "over $1000")
  maxValue?: number      // MRR ceiling
  stage?: string         // Status/stage filter
  name?: string          // Person/company name
  searchQuery?: string   // Freeform search
}

interface ParsedIntent {
  type: IntentType
  filters: QueryFilters
  originalQuery: string
}

interface AskResponse {
  type: IntentType
  title: string
  summary: string
  data?: Record<string, unknown>[]
  insights?: string[]       // Key takeaways from the data
  suggestedActions?: string[] // Next steps the user can take
  meta?: {
    totalCount?: number
    filteredCount?: number
    totalValue?: number
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// INTENT CLASSIFICATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pattern definitions for intent classification
 * Each pattern includes keywords and optional filter extractors
 */
const INTENT_PATTERNS: Record<IntentType, RegExp[]> = {
  pipeline_silent: [
    /silent/i,
    /gone\s+quiet/i,
    /no\s+response/i,
    /haven'?t\s+heard/i,
    /stale/i,
    /inactive\s+(deal|customer)/i,
  ],
  pipeline_by_value: [
    /over\s+\$?\d+/i,
    /above\s+\$?\d+/i,
    /more\s+than\s+\$?\d+/i,
    /deals?\s+(worth|valued)/i,
    /high\s+value/i,
    /biggest\s+deals?/i,
  ],
  pipeline_by_stage: [
    /in\s+(negotiat|lead|contact|won|lost)/i,
    /stage\s+(negotiat|lead|contact|won|lost)/i,
    /(negotiat|lead|contact|won|lost)\s+stage/i,
    /show\s+(negotiat|lead|contact|won|lost)/i,
  ],
  pipeline_analytics: [
    /total\s+(pipeline|value|mrr)/i,
    /pipeline\s+(value|worth)/i,
    /conversion\s+rate/i,
    /how\s+much/i,
    /analytics/i,
    /stats/i,
    /metrics/i,
    /forecast/i,
  ],
  pipeline_overview: [
    /pipeline/i,
    /deals?/i,
    /sales/i,
    /revenue/i,
    /customers?/i,
  ],
  meeting_prep: [
    /prep(are)?\s+(for\s+)?(meeting|call)/i,
    /meeting\s+(with|prep)/i,
    /call\s+with/i,
    /brief\s+(me\s+)?on/i,
    /what\s+do\s+(i|we)\s+know\s+about/i,
    /context\s+(on|for|about)/i,
  ],
  recruitment_by_stage: [
    /interview\s+stage/i,
    /in\s+interview/i,
    /(screen|offer|hired)\s+stage/i,
    /candidates?\s+in\s+/i,
  ],
  recruitment: [
    /recruit/i,
    /candidate/i,
    /hiring/i,
    /talent/i,
    /applicant/i,
  ],
  competitor_intel: [
    /competitor/i,
    /competition/i,
    /market\s+intel/i,
    /what\s+are\s+.+\s+doing/i,
  ],
  prospecting: [
    /find\s+(companies|prospects|leads)/i,
    /search\s+for/i,
    /looking\s+for/i,
    /similar\s+to/i,
    /companies\s+(like|in|that)/i,
    /prospect/i,
  ],
  customer_health: [
    /health/i,
    /at\s+risk/i,
    /churn/i,
    /retention/i,
    /check\s+on/i,
  ],
  general: [], // Fallback
}

/**
 * Extract filters from natural language query
 */
function extractFilters(query: string): QueryFilters {
  const filters: QueryFilters = {}
  
  // Extract days: "last 14 days", "past 30 days", "14 days ago"
  const daysMatch = query.match(/(\d+)\s*days?/i)
  if (daysMatch) {
    filters.days = parseInt(daysMatch[1], 10)
  }
  
  // Extract value: "over $1000", "above 5000", "more than $500"
  const valueMatch = query.match(/(over|above|more\s+than)\s+\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i)
  if (valueMatch) {
    filters.minValue = parseFloat(valueMatch[2].replace(/,/g, ''))
  }
  
  // Extract stage keywords
  const stageKeywords = ['lead', 'in-contact', 'contact', 'negotiating', 'negotiation', 'won', 'lost']
  const stageLower = query.toLowerCase()
  for (const stage of stageKeywords) {
    if (stageLower.includes(stage)) {
      // Normalize stage names
      if (stage === 'contact' || stage === 'in-contact') {
        filters.stage = 'in-contact'
      } else if (stage === 'negotiation' || stage === 'negotiating') {
        filters.stage = 'negotiating'
      } else {
        filters.stage = stage
      }
      break
    }
  }
  
  // Extract recruitment stages
  const recruitStages = ['screen', 'interview', 'offer', 'hired']
  for (const stage of recruitStages) {
    if (stageLower.includes(stage)) {
      filters.stage = stage
      break
    }
  }
  
  // Extract name: "with Glenn", "about Sarah", "meeting with John Smith"
  const nameMatch = query.match(/(?:with|about|for|on)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g)
  if (nameMatch) {
    // Take the last name match (most likely to be the person)
    const lastMatch = nameMatch[nameMatch.length - 1]
    filters.name = lastMatch.replace(/^(with|about|for|on)\s+/i, '').trim()
  }
  
  return filters
}

/**
 * Classify the user's intent using keyword matching
 * 
 * TODO: Replace with LLM-based classification for better accuracy
 * See documentation at top of file for integration guide
 */
function classifyIntent(query: string): ParsedIntent {
  const filters = extractFilters(query)
  const queryLower = query.toLowerCase()
  
  // Check patterns in order of specificity (most specific first)
  const intentOrder: IntentType[] = [
    'meeting_prep',
    'pipeline_silent',
    'pipeline_by_value',
    'pipeline_by_stage',
    'pipeline_analytics',
    'recruitment_by_stage',
    'prospecting',
    'customer_health',
    'competitor_intel',
    'recruitment',
    'pipeline_overview',
    'general',
  ]
  
  for (const intent of intentOrder) {
    const patterns = INTENT_PATTERNS[intent]
    for (const pattern of patterns) {
      if (pattern.test(queryLower)) {
        return { type: intent, filters, originalQuery: query }
      }
    }
  }
  
  return { type: 'general', filters, originalQuery: query }
}

// ─────────────────────────────────────────────────────────────────────────────
// INTENT HANDLERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Handle silent/stale deals
 * Finds customers in active stages that haven't been updated recently
 */
async function handleSilentDeals(filters: QueryFilters): Promise<AskResponse> {
  const days = filters.days || 14 // Default to 14 days
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)
  
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .in('status', ['in-contact', 'negotiating'])
    .lt('updated_at', cutoffDate.toISOString())
    .order('updated_at', { ascending: true })
  
  if (error) {
    console.error('Silent deals query error:', error)
    return errorResponse('pipeline_silent', 'Unable to check for silent deals.')
  }
  
  const customers = data as Customer[]
  const totalValue = customers.reduce((sum, c) => sum + (c.mrr_value || 0), 0)
  
  if (customers.length === 0) {
    return {
      type: 'pipeline_silent',
      title: '🎉 No Silent Deals',
      summary: `Great news! All your active deals have been touched within the last ${days} days.`,
      data: [],
      insights: [
        'Your pipeline is healthy with recent activity',
        'Keep up the momentum with regular touchpoints',
      ],
      suggestedActions: [
        'Review your pipeline for new opportunities',
        'Schedule follow-ups with negotiating deals',
      ],
      meta: { totalCount: 0, totalValue: 0 },
    }
  }
  
  return {
    type: 'pipeline_silent',
    title: '⚠️ Silent Deals Alert',
    summary: `Found ${customers.length} deal${customers.length !== 1 ? 's' : ''} that ${customers.length !== 1 ? 'have' : 'has'} gone silent (no updates in ${days}+ days). Total at-risk value: $${totalValue.toLocaleString()}/mo.`,
    data: customers.map(c => ({
      id: c.id,
      name: c.name,
      company: c.company,
      status: c.status,
      mrr_value: c.mrr_value,
      daysSilent: Math.floor((Date.now() - new Date(c.updated_at).getTime()) / (1000 * 60 * 60 * 24)),
      updated_at: c.updated_at,
    })),
    insights: [
      `${customers.filter(c => c.status === 'negotiating').length} are in negotiating stage`,
      customers.length > 3 ? 'Consider prioritizing by deal value' : 'Small enough to address individually',
    ],
    suggestedActions: [
      'Send follow-up emails to re-engage',
      'Schedule calls with highest value prospects',
      'Consider if any should be marked as lost',
    ],
    meta: { totalCount: customers.length, totalValue },
  }
}

/**
 * Handle pipeline filtered by value
 */
async function handlePipelineByValue(filters: QueryFilters): Promise<AskResponse> {
  const minValue = filters.minValue || 1000
  
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .gte('mrr_value', minValue)
    .order('mrr_value', { ascending: false })
  
  if (error) {
    console.error('Pipeline by value query error:', error)
    return errorResponse('pipeline_by_value', 'Unable to filter deals by value.')
  }
  
  const customers = data as Customer[]
  const totalValue = customers.reduce((sum, c) => sum + (c.mrr_value || 0), 0)
  
  return {
    type: 'pipeline_by_value',
    title: '💰 High-Value Deals',
    summary: `Found ${customers.length} deal${customers.length !== 1 ? 's' : ''} worth $${minValue.toLocaleString()}+/mo. Combined value: $${totalValue.toLocaleString()}/mo.`,
    data: customers as Record<string, unknown>[],
    insights: [
      `Top deal: ${customers[0]?.company || 'N/A'} at $${(customers[0]?.mrr_value || 0).toLocaleString()}/mo`,
      `${customers.filter(c => c.status === 'negotiating').length} are in negotiating stage`,
    ],
    suggestedActions: [
      'Prioritize follow-ups with negotiating deals',
      'Review pricing strategy for high-value segment',
    ],
    meta: { totalCount: customers.length, totalValue },
  }
}

/**
 * Handle pipeline filtered by stage
 */
async function handlePipelineByStage(filters: QueryFilters): Promise<AskResponse> {
  const stage = filters.stage || 'negotiating'
  
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('status', stage)
    .order('mrr_value', { ascending: false, nullsFirst: false })
  
  if (error) {
    console.error('Pipeline by stage query error:', error)
    return errorResponse('pipeline_by_stage', `Unable to fetch ${stage} deals.`)
  }
  
  const customers = data as Customer[]
  const totalValue = customers.reduce((sum, c) => sum + (c.mrr_value || 0), 0)
  
  const stageEmoji: Record<string, string> = {
    lead: '🌱',
    'in-contact': '📞',
    negotiating: '🤝',
    won: '🏆',
    lost: '❌',
  }
  
  return {
    type: 'pipeline_by_stage',
    title: `${stageEmoji[stage] || '📊'} ${stage.charAt(0).toUpperCase() + stage.slice(1)} Stage`,
    summary: `${customers.length} customer${customers.length !== 1 ? 's' : ''} in ${stage} stage. Total value: $${totalValue.toLocaleString()}/mo.`,
    data: customers as Record<string, unknown>[],
    insights: [
      customers.length > 0 ? `Average deal size: $${Math.round(totalValue / customers.length).toLocaleString()}/mo` : 'No deals in this stage',
    ],
    suggestedActions: 
      stage === 'negotiating' 
        ? ['Focus on closing these deals', 'Check for any blockers']
        : stage === 'lead'
        ? ['Qualify and prioritize leads', 'Start outreach sequence']
        : ['Review for insights'],
    meta: { totalCount: customers.length, totalValue },
  }
}

/**
 * Handle pipeline analytics
 */
async function handlePipelineAnalytics(): Promise<AskResponse> {
  const { data: customers, error } = await supabase
    .from('customers')
    .select('*')
  
  if (error) {
    console.error('Analytics query error:', error)
    return errorResponse('pipeline_analytics', 'Unable to calculate analytics.')
  }
  
  const all = customers as Customer[]
  
  // Calculate metrics
  const byStatus: Record<string, Customer[]> = {}
  for (const c of all) {
    byStatus[c.status] = byStatus[c.status] || []
    byStatus[c.status].push(c)
  }
  
  const wonDeals = byStatus['won'] || []
  const lostDeals = byStatus['lost'] || []
  const activeDeals = [...(byStatus['lead'] || []), ...(byStatus['in-contact'] || []), ...(byStatus['negotiating'] || [])]
  
  const totalPipelineValue = activeDeals.reduce((sum, c) => sum + (c.mrr_value || 0), 0)
  const wonValue = wonDeals.reduce((sum, c) => sum + (c.mrr_value || 0), 0)
  
  const closedDeals = wonDeals.length + lostDeals.length
  const winRate = closedDeals > 0 ? Math.round((wonDeals.length / closedDeals) * 100) : 0
  
  return {
    type: 'pipeline_analytics',
    title: '📊 Pipeline Analytics',
    summary: `Your pipeline is worth $${totalPipelineValue.toLocaleString()}/mo across ${activeDeals.length} active deals. Win rate: ${winRate}%.`,
    data: [
      { metric: 'Total Pipeline Value', value: `$${totalPipelineValue.toLocaleString()}/mo` },
      { metric: 'Active Deals', value: activeDeals.length },
      { metric: 'Won MRR', value: `$${wonValue.toLocaleString()}/mo` },
      { metric: 'Win Rate', value: `${winRate}%` },
      { metric: 'Leads', value: (byStatus['lead'] || []).length },
      { metric: 'In Contact', value: (byStatus['in-contact'] || []).length },
      { metric: 'Negotiating', value: (byStatus['negotiating'] || []).length },
      { metric: 'Won', value: wonDeals.length },
      { metric: 'Lost', value: lostDeals.length },
    ],
    insights: [
      `${(byStatus['negotiating'] || []).length} deals in final negotiating stage`,
      activeDeals.length > 0 
        ? `Average deal size: $${Math.round(totalPipelineValue / activeDeals.length).toLocaleString()}/mo`
        : 'No active deals',
    ],
    suggestedActions: [
      'Focus on negotiating deals to improve win rate',
      'Add more leads to keep pipeline healthy',
    ],
    meta: { 
      totalCount: all.length, 
      filteredCount: activeDeals.length,
      totalValue: totalPipelineValue,
    },
  }
}

/**
 * Handle general pipeline overview
 */
async function handlePipelineOverview(): Promise<AskResponse> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .in('status', ['lead', 'in-contact', 'negotiating'])
    .order('updated_at', { ascending: false })
    .limit(15)
  
  if (error) {
    console.error('Pipeline overview error:', error)
    return errorResponse('pipeline_overview', 'Unable to fetch pipeline.')
  }
  
  const customers = data as Customer[]
  const totalValue = customers.reduce((sum, c) => sum + (c.mrr_value || 0), 0)
  
  return {
    type: 'pipeline_overview',
    title: '📈 Pipeline Overview',
    summary: `You have ${customers.length} active deal${customers.length !== 1 ? 's' : ''} worth $${totalValue.toLocaleString()}/mo in your pipeline.`,
    data: customers as Record<string, unknown>[],
    insights: [
      'Showing most recently updated deals',
    ],
    suggestedActions: [
      'Which deals have gone silent?',
      'Show me deals over $1000',
      'What\'s our total pipeline value?',
    ],
    meta: { totalCount: customers.length, totalValue },
  }
}

/**
 * Handle meeting prep - search for context on a person/company
 */
async function handleMeetingPrep(filters: QueryFilters): Promise<AskResponse> {
  const name = filters.name
  
  if (!name) {
    return {
      type: 'meeting_prep',
      title: '📝 Meeting Prep',
      summary: 'Who are you meeting with? Try: "Prep for my meeting with [name]"',
      suggestedActions: [
        'Prep for meeting with [company name]',
        'What do we know about [person name]?',
      ],
    }
  }
  
  // Search customers
  const { data: customers } = await supabase
    .from('customers')
    .select('*')
    .or(`name.ilike.%${name}%,company.ilike.%${name}%`)
  
  // Search recruits
  const { data: recruits } = await supabase
    .from('recruits')
    .select('*')
    .or(`name.ilike.%${name}%,role.ilike.%${name}%`)
  
  // Search competitors
  const { data: competitors } = await supabase
    .from('competitors')
    .select('*')
    .or(`name.ilike.%${name}%,company.ilike.%${name}%`)
  
  const foundCustomers = (customers || []) as Customer[]
  const foundRecruits = (recruits || []) as Recruit[]
  const foundCompetitors = (competitors || []) as Competitor[]
  
  const totalFound = foundCustomers.length + foundRecruits.length + foundCompetitors.length
  
  if (totalFound === 0) {
    return {
      type: 'meeting_prep',
      title: `🔍 No Results for "${name}"`,
      summary: `I couldn't find anyone named "${name}" in your CRM. They might be a new contact.`,
      insights: [
        'Consider adding them as a new lead or candidate',
      ],
      suggestedActions: [
        'Add as new customer',
        'Add as recruit candidate',
        'Search with a different name',
      ],
    }
  }
  
  // Build context response
  const contextData: Record<string, unknown>[] = []
  const insights: string[] = []
  
  if (foundCustomers.length > 0) {
    const c = foundCustomers[0]
    contextData.push({
      type: 'customer',
      name: c.name,
      company: c.company,
      email: c.email,
      status: c.status,
      mrr_value: c.mrr_value,
      lastUpdated: c.updated_at,
    })
    insights.push(`Customer in "${c.status}" stage${c.mrr_value ? ` • $${c.mrr_value.toLocaleString()}/mo deal` : ''}`)
    
    const daysSinceUpdate = Math.floor((Date.now() - new Date(c.updated_at).getTime()) / (1000 * 60 * 60 * 24))
    if (daysSinceUpdate > 14) {
      insights.push(`⚠️ Last updated ${daysSinceUpdate} days ago`)
    }
  }
  
  if (foundRecruits.length > 0) {
    const r = foundRecruits[0]
    contextData.push({
      type: 'recruit',
      name: r.name,
      role: r.role,
      position: r.position,
      stage: r.stage,
      email: r.email,
      comments: r.comments,
    })
    insights.push(`Candidate for ${r.role || r.position || 'unknown role'} • ${r.stage} stage`)
  }
  
  if (foundCompetitors.length > 0) {
    const comp = foundCompetitors[0]
    contextData.push({
      type: 'competitor',
      name: comp.name,
      company: comp.company,
      website: comp.website,
      status: comp.status,
      pricing: comp.pricing,
      coreFeature: comp.core_feature,
    })
    insights.push(`Competitor tracked as "${comp.status}"`)
  }
  
  return {
    type: 'meeting_prep',
    title: `📋 Meeting Prep: ${name}`,
    summary: `Found context for "${name}" in your CRM. Here's what you need to know:`,
    data: contextData,
    insights,
    suggestedActions: [
      'Review recent communications',
      'Prepare talking points',
      'Check for any open tasks',
    ],
    meta: { totalCount: totalFound },
  }
}

/**
 * Handle recruitment queries
 */
async function handleRecruitment(filters: QueryFilters): Promise<AskResponse> {
  let query = supabase
    .from('recruits')
    .select('*')
    .order('updated_at', { ascending: false })
  
  if (filters.stage) {
    query = query.eq('stage', filters.stage)
  }
  
  const { data, error } = await query.limit(20)
  
  if (error) {
    console.error('Recruitment query error:', error)
    return errorResponse('recruitment', 'Unable to fetch candidates.')
  }
  
  const recruits = data as Recruit[]
  const stageLabel = filters.stage ? ` in ${filters.stage} stage` : ''
  
  return {
    type: filters.stage ? 'recruitment_by_stage' : 'recruitment',
    title: `👥 Candidates${stageLabel}`,
    summary: `${recruits.length} candidate${recruits.length !== 1 ? 's' : ''}${stageLabel}.`,
    data: recruits as Record<string, unknown>[],
    insights: [
      recruits.length > 0 
        ? `${recruits.filter(r => r.technical_role).length} technical roles`
        : 'No candidates in pipeline',
    ],
    suggestedActions: [
      'Show interview stage candidates',
      'Filter by role',
      'Add new candidate',
    ],
    meta: { totalCount: recruits.length },
  }
}

/**
 * Handle competitor intel
 */
async function handleCompetitorIntel(filters: QueryFilters): Promise<AskResponse> {
  let query = supabase
    .from('competitors')
    .select('*')
    .order('updated_at', { ascending: false })
  
  if (filters.name) {
    query = query.or(`name.ilike.%${filters.name}%,company.ilike.%${filters.name}%`)
  }
  
  const { data, error } = await query.limit(10)
  
  if (error) {
    console.error('Competitor query error:', error)
    return errorResponse('competitor_intel', 'Unable to fetch competitor data.')
  }
  
  const competitors = data as Competitor[]
  
  return {
    type: 'competitor_intel',
    title: '🎯 Competitor Intelligence',
    summary: `Tracking ${competitors.length} competitor${competitors.length !== 1 ? 's' : ''}.`,
    data: competitors as Record<string, unknown>[],
    insights: [
      `${competitors.filter(c => c.status === 'bigplayer').length} major players`,
      `${competitors.filter(c => c.status === 'traction').length} gaining traction`,
    ],
    suggestedActions: [
      'Compare features',
      'Analyze pricing',
      'Add competitor',
    ],
    meta: { totalCount: competitors.length },
  }
}

/**
 * Handle prospecting queries (web search)
 * TODO: Integrate with web search API
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function handleProspecting(_filters: QueryFilters): Promise<AskResponse> {
  // TODO: Use filters when web search is integrated
  return {
    type: 'prospecting',
    title: '🔍 Prospecting',
    summary: 'Web search for prospects is coming soon! This feature will allow you to find companies matching your criteria directly from VXA.',
    insights: [
      'This will integrate with web search APIs',
      'You\'ll be able to search by industry, location, and company size',
    ],
    suggestedActions: [
      'Check your existing pipeline',
      'Review leads that need follow-up',
      'Add prospects manually for now',
    ],
  }
}

/**
 * Handle customer health queries
 */
async function handleCustomerHealth(filters: QueryFilters): Promise<AskResponse> {
  const days = filters.days || 30
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - days)
  
  // Find won customers that haven't been touched
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('status', 'won')
    .lt('updated_at', cutoffDate.toISOString())
    .order('updated_at', { ascending: true })
  
  if (error) {
    console.error('Customer health query error:', error)
    return errorResponse('customer_health', 'Unable to check customer health.')
  }
  
  const customers = data as Customer[]
  const totalValue = customers.reduce((sum, c) => sum + (c.mrr_value || 0), 0)
  
  if (customers.length === 0) {
    return {
      type: 'customer_health',
      title: '💚 Customer Health: All Good',
      summary: `All your won customers have been touched within the last ${days} days.`,
      insights: ['Your customer success game is strong!'],
      suggestedActions: ['Review customer satisfaction', 'Plan upsell opportunities'],
    }
  }
  
  return {
    type: 'customer_health',
    title: '⚠️ Customer Health Alert',
    summary: `${customers.length} customer${customers.length !== 1 ? 's' : ''} haven't been contacted in ${days}+ days. At-risk MRR: $${totalValue.toLocaleString()}/mo.`,
    data: customers as Record<string, unknown>[],
    insights: [
      'Regular check-ins prevent churn',
      'Longest untouched customer listed first',
    ],
    suggestedActions: [
      'Schedule check-in calls',
      'Send satisfaction surveys',
      'Review account health metrics',
    ],
    meta: { totalCount: customers.length, totalValue },
  }
}

/**
 * Handle general/unknown queries
 */
async function handleGeneral(query: string): Promise<AskResponse> {
  return {
    type: 'general',
    title: '🤔 How can I help?',
    summary: `I'm not sure how to handle "${query}" yet. Here are some things I can help with:`,
    insights: [
      'I understand natural language queries about your CRM',
      'Try being more specific about what you\'re looking for',
    ],
    suggestedActions: [
      'Which deals have gone silent?',
      'What\'s our total pipeline value?',
      'Show me deals over $1000',
      'Prep for my meeting with [name]',
      'Show candidates in interview stage',
    ],
  }
}

/**
 * Helper to create error responses
 */
function errorResponse(type: IntentType, message: string): AskResponse {
  return {
    type,
    title: '❌ Error',
    summary: message,
    suggestedActions: ['Try again', 'Contact support if the issue persists'],
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN QUERY PROCESSOR
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Process a natural language query and return structured response
 * 
 * This is the main entry point for query processing.
 * 
 * To add LLM integration:
 * 1. Replace classifyIntent() call with async LLM classification
 * 2. Optionally add LLM-powered response summarization
 * 3. Consider streaming responses for better UX
 */
async function processQuery(query: string): Promise<AskResponse> {
  const { type, filters } = classifyIntent(query)
  
  switch (type) {
    case 'pipeline_silent':
      return handleSilentDeals(filters)
    case 'pipeline_by_value':
      return handlePipelineByValue(filters)
    case 'pipeline_by_stage':
      return handlePipelineByStage(filters)
    case 'pipeline_analytics':
      return handlePipelineAnalytics()
    case 'pipeline_overview':
      return handlePipelineOverview()
    case 'meeting_prep':
      return handleMeetingPrep(filters)
    case 'recruitment':
    case 'recruitment_by_stage':
      return handleRecruitment(filters)
    case 'competitor_intel':
      return handleCompetitorIntel(filters)
    case 'prospecting':
      return handleProspecting(filters)
    case 'customer_health':
      return handleCustomerHealth(filters)
    default:
      return handleGeneral(query)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// API ROUTE HANDLER
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query } = body

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { 
          type: 'general',
          title: 'Missing Query',
          summary: 'Please provide a query.',
          suggestedActions: ['Try: "What\'s in my pipeline?"'],
        },
        { status: 400 }
      )
    }

    const response = await processQuery(query.trim())
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('Ask API error:', error)
    return NextResponse.json(
      { 
        type: 'general',
        title: '❌ Error',
        summary: 'An error occurred while processing your request.',
        suggestedActions: ['Try again', 'Simplify your query'],
      },
      { status: 500 }
    )
  }
}
