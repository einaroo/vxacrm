import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

interface CalendarAttendee {
  email: string
  displayName?: string
  self?: boolean
  responseStatus?: string
  organizer?: boolean
}

interface CalendarEvent {
  id: string
  summary?: string
  start?: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  end?: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  attendees?: CalendarAttendee[]
}

interface CalendarResponse {
  events: CalendarEvent[]
}

export interface Meeting {
  id: string
  title: string
  startTime: string
  endTime: string
  attendees: Array<{
    email: string
    name?: string
    isOrganizer?: boolean
    responseStatus?: string
  }>
}

function formatEvent(event: CalendarEvent): Meeting {
  const startTime = event.start?.dateTime || event.start?.date || ''
  const endTime = event.end?.dateTime || event.end?.date || ''
  
  const attendees = (event.attendees || [])
    .filter(a => !a.self)
    .map(a => ({
      email: a.email,
      name: a.displayName,
      isOrganizer: a.organizer,
      responseStatus: a.responseStatus,
    }))

  return {
    id: event.id,
    title: event.summary || '(No title)',
    startTime,
    endTime,
    attendees,
  }
}

export async function GET() {
  try {
    // Get today's date in YYYY-MM-DD format
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const fromDate = today.toISOString().split('T')[0]
    const toDate = tomorrow.toISOString().split('T')[0]
    
    // Fetch calendar events using gog CLI
    const command = `gog calendar list --from "${fromDate}" --to "${toDate}" --json`
    
    let stdout: string
    try {
      const result = await execAsync(command, { 
        timeout: 15000,
        maxBuffer: 5 * 1024 * 1024 
      })
      stdout = result.stdout
    } catch (execError) {
      console.error('[Calendar API] Error executing gog command:', execError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch calendar events', meetings: [] },
        { status: 500 }
      )
    }
    
    let calendarData: CalendarResponse
    try {
      calendarData = JSON.parse(stdout)
    } catch {
      console.error('[Calendar API] Failed to parse calendar JSON:', stdout.slice(0, 200))
      return NextResponse.json(
        { success: false, error: 'Failed to parse calendar data', meetings: [] },
        { status: 500 }
      )
    }
    
    if (!calendarData.events || !Array.isArray(calendarData.events)) {
      return NextResponse.json({
        success: true,
        meetings: [],
        date: fromDate,
      })
    }
    
    // Format events into meetings
    const meetings = calendarData.events.map(formatEvent)
    
    // Sort by start time
    meetings.sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    )
    
    return NextResponse.json({
      success: true,
      meetings,
      date: fromDate,
      count: meetings.length,
    })
    
  } catch (error) {
    console.error('[Calendar API] Unexpected error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error',
        meetings: [] 
      },
      { status: 500 }
    )
  }
}
