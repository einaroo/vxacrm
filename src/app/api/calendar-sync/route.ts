import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// User's own email to skip
const USER_EMAIL = 'einar@vxalabs.com'

// Keywords that suggest an interview/recruitment event (case-insensitive)
const INTERVIEW_KEYWORDS = [
  'interview',
  'screening',
  'call with',
  'meeting with',
  'intro',
  'coffee chat',
  'coffee with',
  'lunch with',
  'möte med', // Swedish: meeting with
  'fika med', // Swedish: coffee with
  'kandidat',  // Swedish: candidate
  'intervju',  // Swedish: interview
]

interface CalendarEvent {
  id: string
  summary?: string
  start?: {
    dateTime?: string
    date?: string
  }
  attendees?: Array<{
    email: string
    displayName?: string
    self?: boolean
    responseStatus?: string
  }>
  creator?: {
    email: string
    displayName?: string
  }
  organizer?: {
    email: string
    displayName?: string
  }
}

interface CalendarResponse {
  events: CalendarEvent[]
}

function isInterviewEvent(summary: string | undefined): boolean {
  if (!summary) return false
  const lowerSummary = summary.toLowerCase()
  return INTERVIEW_KEYWORDS.some(keyword => lowerSummary.includes(keyword.toLowerCase()))
}

function extractPositionHint(summary: string): string | null {
  // Try to extract role/position from event title
  const patterns = [
    /(?:for|för)\s+(.+?)(?:\s+position|\s+role|\s*$)/i,
    /(.+?)\s+(?:interview|intervju)/i,
    /(?:interview|intervju)\s+(?:with|med)\s+.+?\s+(?:for|för)\s+(.+)/i,
  ]
  
  for (const pattern of patterns) {
    const match = summary.match(pattern)
    if (match?.[1]) {
      return match[1].trim()
    }
  }
  
  return null
}

function extractCandidateInfo(event: CalendarEvent): { name: string; email: string } | null {
  // First, try to find an attendee that isn't the user
  if (event.attendees && event.attendees.length > 0) {
    for (const attendee of event.attendees) {
      if (!attendee.self && attendee.email !== USER_EMAIL) {
        // Skip calendar groups and resources
        if (attendee.email.includes('@group.calendar.google.com') ||
            attendee.email.includes('@resource.calendar.google.com')) {
          continue
        }
        
        const name = attendee.displayName || 
          attendee.email.split('@')[0].replace(/[._]/g, ' ')
        
        return {
          name: name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          email: attendee.email,
        }
      }
    }
  }
  
  // Fallback: try to extract name from event summary
  const summary = event.summary || ''
  const namePatterns = [
    /(?:with|med)\s+([A-Z][a-zåäö]+(?:\s+[A-Z][a-zåäö]+)*)/i,
    /(?:call|interview|intervju|meeting|möte|lunch|fika|coffee)\s+(?:with|med)?\s*([A-Z][a-zåäö]+(?:\s+[A-Z][a-zåäö]+)*)/i,
  ]
  
  for (const pattern of namePatterns) {
    const match = summary.match(pattern)
    if (match?.[1]) {
      return {
        name: match[1].trim(),
        email: '', // No email available from title
      }
    }
  }
  
  return null
}

export async function POST(request: NextRequest) {
  try {
    // Parse optional date range from request body
    const body = await request.json().catch(() => ({}))
    const fromDate = body.fromDate || '2025-01-01'
    const toDate = body.toDate || new Date().toISOString().split('T')[0]
    
    // Fetch calendar events using gog CLI
    const command = `gog calendar events primary --from "${fromDate}" --to "${toDate}" --json`
    
    let stdout: string
    try {
      const result = await execAsync(command, { maxBuffer: 10 * 1024 * 1024 })
      stdout = result.stdout
    } catch (execError) {
      console.error('[Calendar Sync] Error executing gog command:', execError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch calendar events' },
        { status: 500 }
      )
    }
    
    let calendarData: CalendarResponse
    try {
      calendarData = JSON.parse(stdout)
    } catch {
      console.error('[Calendar Sync] Failed to parse calendar JSON')
      return NextResponse.json(
        { success: false, error: 'Failed to parse calendar data' },
        { status: 500 }
      )
    }
    
    if (!calendarData.events || !Array.isArray(calendarData.events)) {
      return NextResponse.json(
        { success: true, message: 'No events found', added: 0, skipped: 0 }
      )
    }
    
    // Filter for interview-related events
    const interviewEvents = calendarData.events.filter(event => 
      isInterviewEvent(event.summary)
    )
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // Get existing recruits by email to check for duplicates
    const { data: existingRecruits } = await supabase
      .from('recruits')
      .select('email')
    
    const existingEmails = new Set(
      (existingRecruits || [])
        .map(r => r.email?.toLowerCase())
        .filter(Boolean)
    )
    
    // Process interview events
    const candidates: Array<{
      name: string
      email: string | null
      position: string | null
      stage: string
      comments: string
    }> = []
    
    const skippedEvents: string[] = []
    
    for (const event of interviewEvents) {
      const candidateInfo = extractCandidateInfo(event)
      
      if (!candidateInfo) {
        skippedEvents.push(`No candidate info: ${event.summary}`)
        continue
      }
      
      // Skip if email already exists
      if (candidateInfo.email && existingEmails.has(candidateInfo.email.toLowerCase())) {
        skippedEvents.push(`Duplicate email: ${candidateInfo.email}`)
        continue
      }
      
      // Skip if we already have this candidate in our batch
      const isDuplicate = candidates.some(
        c => c.email && c.email.toLowerCase() === candidateInfo.email.toLowerCase()
      )
      if (isDuplicate) {
        continue
      }
      
      const eventDate = event.start?.dateTime || event.start?.date || ''
      const positionHint = extractPositionHint(event.summary || '')
      
      candidates.push({
        name: candidateInfo.name,
        email: candidateInfo.email || null,
        position: positionHint,
        stage: 'lead',
        comments: `Synced from calendar event: "${event.summary}" on ${eventDate.split('T')[0]}`,
      })
      
      // Add email to set to prevent duplicates within this batch
      if (candidateInfo.email) {
        existingEmails.add(candidateInfo.email.toLowerCase())
      }
    }
    
    // Insert new candidates
    let addedCount = 0
    if (candidates.length > 0) {
      const { error } = await supabase.from('recruits').insert(candidates)
      
      if (error) {
        console.error('[Calendar Sync] Error inserting recruits:', error)
        return NextResponse.json(
          { success: false, error: 'Failed to insert candidates' },
          { status: 500 }
        )
      }
      
      addedCount = candidates.length
    }
    
    return NextResponse.json({
      success: true,
      message: `Synced ${addedCount} new candidates from calendar`,
      added: addedCount,
      skipped: skippedEvents.length,
      totalInterviewEvents: interviewEvents.length,
      details: {
        candidates: candidates.map(c => ({ name: c.name, email: c.email })),
        skipped: skippedEvents.slice(0, 10), // Limit for response size
      }
    })
    
  } catch (error) {
    console.error('[Calendar Sync] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint for testing/info
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/calendar-sync',
    description: 'Sync interview events from Google Calendar to recruitment pipeline',
    methods: ['POST'],
    keywords: INTERVIEW_KEYWORDS,
    usage: {
      method: 'POST',
      body: {
        fromDate: '2025-01-01 (optional)',
        toDate: '2026-02-13 (optional, defaults to today)',
      }
    }
  })
}
