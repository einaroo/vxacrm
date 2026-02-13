import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { supabase } from '@/lib/supabase'

const execAsync = promisify(exec)

export const dynamic = 'force-dynamic'

interface BookingRequest {
  customerId: string
  startTime: string // ISO string
  endTime: string // ISO string
  name?: string
  email?: string
  notes?: string
}

/**
 * Book a meeting slot - creates calendar event and updates customer
 * POST /api/booking/book
 */
export async function POST(request: NextRequest) {
  try {
    const body: BookingRequest = await request.json()

    if (!body.customerId || !body.startTime || !body.endTime) {
      return NextResponse.json(
        { error: 'customerId, startTime, and endTime are required' },
        { status: 400 }
      )
    }

    // Fetch customer details
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', body.customerId)
      .single()

    if (customerError || !customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Use provided name/email or fall back to customer data
    const attendeeName = body.name || customer.name || 'Guest'
    const attendeeEmail = body.email || customer.email

    // Format times for gog CLI (RFC3339)
    const summary = `VXA Meeting: ${attendeeName}${customer.company ? ` (${customer.company})` : ''}`
    const description = `Booking from VXA CRM

Customer: ${attendeeName}
Company: ${customer.company || 'N/A'}
Email: ${attendeeEmail || 'N/A'}
${body.notes ? `\nNotes: ${body.notes}` : ''}

---
Booked via VXA CRM booking link`

    // Create calendar event using gog CLI
    const escapedSummary = summary.replace(/'/g, "'\\''")
    const escapedDesc = description.replace(/'/g, "'\\''")

    const command = `gog calendar create primary --summary='${escapedSummary}' --from='${body.startTime}' --to='${body.endTime}' --description='${escapedDesc}'${attendeeEmail ? ` --attendees='${attendeeEmail}'` : ''} --with-meet --json`

    try {
      const { stdout, stderr } = await execAsync(command)

      if (stderr && !stderr.includes('warning')) {
        console.error('gog calendar stderr:', stderr)
      }

      let eventResult
      try {
        eventResult = JSON.parse(stdout)
      } catch {
        eventResult = { success: true, raw: stdout }
      }

      // Update customer status to 'in-contact' if they were just a lead
      if (customer.status === 'lead') {
        await supabase
          .from('customers')
          .update({
            status: 'in-contact',
            updated_at: new Date().toISOString(),
          })
          .eq('id', body.customerId)
      } else {
        // Just update the timestamp
        await supabase
          .from('customers')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', body.customerId)
      }

      // Format the meeting time for display
      const startDate = new Date(body.startTime)
      const meetingTime = startDate.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Stockholm',
      })

      return NextResponse.json({
        success: true,
        message: 'Meeting booked successfully!',
        booking: {
          summary,
          startTime: body.startTime,
          endTime: body.endTime,
          meetingTime,
          customerName: attendeeName,
          customerCompany: customer.company,
          meetUrl: eventResult.hangoutLink || eventResult.conferenceData?.entryPoints?.[0]?.uri,
        },
        calendarEvent: eventResult,
      })
    } catch (execError) {
      console.error('gog calendar create failed:', execError)
      return NextResponse.json(
        { error: 'Failed to create calendar event' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Booking error:', error)
    return NextResponse.json({ error: 'Failed to process booking' }, { status: 500 })
  }
}
