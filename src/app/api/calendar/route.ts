import { NextResponse } from 'next/server'
import { google } from 'googleapis'

// Force dynamic rendering - this route fetches real-time calendar data
export const dynamic = 'force-dynamic'

interface CalendarAttendee {
  email: string
  displayName?: string
  self?: boolean
  responseStatus?: string
  organizer?: boolean
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

function getGoogleAuth() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Missing Google OAuth credentials. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN.')
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret)
  oauth2Client.setCredentials({ refresh_token: refreshToken })
  
  return oauth2Client
}

export async function GET() {
  try {
    const auth = getGoogleAuth()
    const calendar = google.calendar({ version: 'v3', auth })

    // Get today's date range in ISO format
    const today = new Date()
    const startOfDay = new Date(today)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(today)
    endOfDay.setHours(23, 59, 59, 999)

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    })

    const events = response.data.items || []

    const meetings: Meeting[] = events.map(event => {
      const startTime = event.start?.dateTime || event.start?.date || ''
      const endTime = event.end?.dateTime || event.end?.date || ''
      
      const attendees = ((event.attendees as CalendarAttendee[]) || [])
        .filter(a => !a.self)
        .map(a => ({
          email: a.email,
          name: a.displayName,
          isOrganizer: a.organizer,
          responseStatus: a.responseStatus,
        }))

      return {
        id: event.id || '',
        title: event.summary || '(No title)',
        startTime,
        endTime,
        attendees,
      }
    })

    return NextResponse.json({
      success: true,
      meetings,
      date: startOfDay.toISOString().split('T')[0],
      count: meetings.length,
    })

  } catch (error) {
    console.error('[Calendar API] Error:', error)
    
    const message = error instanceof Error ? error.message : 'Internal server error'
    const isAuthError = message.includes('OAuth') || message.includes('credentials')
    
    return NextResponse.json(
      { 
        success: false, 
        error: message,
        meetings: [] 
      },
      { status: isAuthError ? 401 : 500 }
    )
  }
}
