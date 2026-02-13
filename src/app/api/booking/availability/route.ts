import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export const dynamic = 'force-dynamic'

interface CalendarEvent {
  id: string
  summary: string
  start: string
  end: string
}

interface TimeSlot {
  date: string
  time: string
  startIso: string
  endIso: string
  available: boolean
}

/**
 * Get available 30-min booking slots for the next 2 weeks
 * GET /api/booking/availability
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const daysAhead = parseInt(searchParams.get('days') || '14')
    const slotDuration = parseInt(searchParams.get('duration') || '30') // minutes

    // Working hours (Stockholm time)
    const workStart = 9 // 9 AM
    const workEnd = 17 // 5 PM

    // Get events for the next N days using gog CLI
    const fromDate = new Date()
    const toDate = new Date()
    toDate.setDate(toDate.getDate() + daysAhead)

    const fromStr = fromDate.toISOString().split('T')[0]
    const toStr = toDate.toISOString().split('T')[0]

    let events: CalendarEvent[] = []

    try {
      const { stdout } = await execAsync(
        `gog calendar events --from='${fromStr}' --to='${toStr}' --max=100 --json`
      )
      const data = JSON.parse(stdout)
      events = (data.events || data || []).map((e: {
        id?: string
        summary?: string
        start?: { dateTime?: string; date?: string }
        end?: { dateTime?: string; date?: string }
      }) => ({
        id: e.id || '',
        summary: e.summary || '',
        start: e.start?.dateTime || e.start?.date || '',
        end: e.end?.dateTime || e.end?.date || '',
      }))
    } catch (error) {
      console.error('Failed to fetch calendar:', error)
      // Continue with empty events - will show all slots as available
    }

    // Generate all possible slots
    const slots: TimeSlot[] = []
    const current = new Date()
    current.setHours(0, 0, 0, 0)

    for (let day = 0; day < daysAhead; day++) {
      const date = new Date(current)
      date.setDate(date.getDate() + day)

      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue

      // Generate slots for this day
      for (let hour = workStart; hour < workEnd; hour++) {
        for (let minute = 0; minute < 60; minute += slotDuration) {
          const slotStart = new Date(date)
          slotStart.setHours(hour, minute, 0, 0)

          const slotEnd = new Date(slotStart)
          slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration)

          // Skip if end time is beyond work hours
          if (slotEnd.getHours() > workEnd || (slotEnd.getHours() === workEnd && slotEnd.getMinutes() > 0)) {
            continue
          }

          // Skip slots in the past (add 1 hour buffer)
          const now = new Date()
          now.setHours(now.getHours() + 1)
          if (slotStart < now) continue

          // Check if slot conflicts with any event
          const isAvailable = !events.some((event) => {
            const eventStart = new Date(event.start)
            const eventEnd = new Date(event.end)
            // Overlap check: slot starts before event ends AND slot ends after event starts
            return slotStart < eventEnd && slotEnd > eventStart
          })

          slots.push({
            date: slotStart.toISOString().split('T')[0],
            time: slotStart.toLocaleTimeString('en-GB', {
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'Europe/Stockholm',
            }),
            startIso: slotStart.toISOString(),
            endIso: slotEnd.toISOString(),
            available: isAvailable,
          })
        }
      }
    }

    // Filter to only available slots and group by date
    const availableSlots = slots.filter((s) => s.available)
    const slotsByDate: Record<string, TimeSlot[]> = {}

    availableSlots.forEach((slot) => {
      if (!slotsByDate[slot.date]) {
        slotsByDate[slot.date] = []
      }
      slotsByDate[slot.date].push(slot)
    })

    return NextResponse.json({
      success: true,
      slots: availableSlots,
      slotsByDate,
      totalAvailable: availableSlots.length,
      daysChecked: daysAhead,
      slotDuration,
    })
  } catch (error) {
    console.error('Availability error:', error)
    return NextResponse.json({ error: 'Failed to get availability' }, { status: 500 })
  }
}
