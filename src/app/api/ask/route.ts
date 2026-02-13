import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * Ask VXA API Route
 * 
 * Currently uses keyword matching for query routing.
 * Designed to be extensible for future LLM integration.
 * 
 * To add LLM support:
 * 1. Import your LLM client (e.g., OpenAI, Anthropic)
 * 2. Replace classifyIntent() with LLM-based classification
 * 3. Optionally use LLM to generate natural language summaries
 */

type IntentType = 'pipeline' | 'recruitment' | 'meeting' | 'competitor' | 'general'

interface AskResponse {
  type: IntentType
  title: string
  summary: string
  data?: Record<string, unknown>[]
  suggestions?: string[]
}

// Intent classification using keyword matching
// TODO: Replace with LLM-based classification for better accuracy
function classifyIntent(query: string): IntentType {
  const q = query.toLowerCase()
  
  if (q.includes('pipeline') || q.includes('deal') || q.includes('sales') || q.includes('revenue')) {
    return 'pipeline'
  }
  if (q.includes('recruit') || q.includes('candidate') || q.includes('hiring') || q.includes('talent')) {
    return 'recruitment'
  }
  if (q.includes('meeting') || q.includes('prep') || q.includes('agenda') || q.includes('call')) {
    return 'meeting'
  }
  if (q.includes('competitor') || q.includes('competition') || q.includes('market') || q.includes('intel')) {
    return 'competitor'
  }
  
  return 'general'
}

// Handler functions for each intent type
async function handlePipeline(): Promise<AskResponse> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)
  
  if (error) {
    console.error('Pipeline query error:', error)
    return {
      type: 'pipeline',
      title: 'Pipeline Overview',
      summary: 'Unable to fetch pipeline data at the moment.',
      suggestions: ['Try again', 'Show all deals'],
    }
  }

  const count = data?.length || 0
  return {
    type: 'pipeline',
    title: 'Pipeline Overview',
    summary: `Found ${count} deal${count !== 1 ? 's' : ''} in your pipeline.`,
    data: data as Record<string, unknown>[],
    suggestions: ['Filter by stage', 'Show closed won', 'Revenue forecast'],
  }
}

async function handleRecruitment(): Promise<AskResponse> {
  const { data, error } = await supabase
    .from('recruits')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)
  
  if (error) {
    console.error('Recruitment query error:', error)
    return {
      type: 'recruitment',
      title: 'Recruitment Pipeline',
      summary: 'Unable to fetch candidate data at the moment.',
      suggestions: ['Try again', 'Show all candidates'],
    }
  }

  const count = data?.length || 0
  return {
    type: 'recruitment',
    title: 'Recruitment Pipeline',
    summary: `You have ${count} candidate${count !== 1 ? 's' : ''} in your recruitment pipeline.`,
    data: data as Record<string, unknown>[],
    suggestions: ['Filter by role', 'Show interview stage', 'Add candidate'],
  }
}

async function handleMeeting(): Promise<AskResponse> {
  // For now, return mock meeting prep data
  // TODO: Integrate with calendar API to fetch actual meetings
  return {
    type: 'meeting',
    title: 'Meeting Prep',
    summary: 'Here\'s your meeting preparation checklist.',
    data: [
      { name: 'Review account history', status: 'pending' },
      { name: 'Check recent interactions', status: 'pending' },
      { name: 'Prepare talking points', status: 'pending' },
    ],
    suggestions: ['Show account details', 'Recent emails', 'Competitor analysis'],
  }
}

async function handleCompetitor(): Promise<AskResponse> {
  const { data, error } = await supabase
    .from('competitors')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(10)
  
  if (error) {
    console.error('Competitor query error:', error)
    return {
      type: 'competitor',
      title: 'Competitor Intelligence',
      summary: 'Unable to fetch competitor data at the moment.',
      suggestions: ['Try again', 'Add competitor'],
    }
  }

  const count = data?.length || 0
  return {
    type: 'competitor',
    title: 'Competitor Intelligence',
    summary: `Tracking ${count} competitor${count !== 1 ? 's' : ''} in your market.`,
    data: data as Record<string, unknown>[],
    suggestions: ['Compare features', 'Market positioning', 'Add competitor'],
  }
}

async function handleGeneral(query: string): Promise<AskResponse> {
  // For unrecognized intents, provide helpful suggestions
  return {
    type: 'general',
    title: 'How can I help?',
    summary: `I'm not sure how to handle "${query}" yet. Try asking about your pipeline, candidates, meetings, or competitors.`,
    suggestions: ['Show pipeline', 'Open candidates', 'Meeting prep', 'Competitor intel'],
  }
}

// Main query processor
// TODO: Add LLM integration point here
async function processQuery(query: string): Promise<AskResponse> {
  const intent = classifyIntent(query)
  
  switch (intent) {
    case 'pipeline':
      return handlePipeline()
    case 'recruitment':
      return handleRecruitment()
    case 'meeting':
      return handleMeeting()
    case 'competitor':
      return handleCompetitor()
    default:
      return handleGeneral(query)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query } = body

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
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
        title: 'Error',
        summary: 'An error occurred while processing your request.',
        suggestions: ['Try again'],
      },
      { status: 500 }
    )
  }
}
