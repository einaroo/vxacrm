import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { supabase } from '@/lib/supabase'

const execAsync = promisify(exec)

export const dynamic = 'force-dynamic'

interface SendEmailRequest {
  to: string
  subject: string
  body: string
  customerId?: string
}

/**
 * Send an email via gog gmail send CLI
 * POST /api/email/send
 */
export async function POST(request: NextRequest) {
  try {
    const body: SendEmailRequest = await request.json()

    if (!body.to || !body.subject || !body.body) {
      return NextResponse.json(
        { error: 'to, subject, and body are required' },
        { status: 400 }
      )
    }

    // Escape special characters for shell
    const escapedSubject = body.subject.replace(/'/g, "'\\''")
    const escapedBody = body.body.replace(/'/g, "'\\''")

    // Send email via gog CLI
    const command = `gog gmail send --to='${body.to}' --subject='${escapedSubject}' --body='${escapedBody}' --force --json`

    try {
      const { stdout, stderr } = await execAsync(command)
      
      if (stderr && !stderr.includes('warning')) {
        console.error('gog stderr:', stderr)
      }

      // Parse response
      let result
      try {
        result = JSON.parse(stdout)
      } catch {
        // If not JSON, assume success if no error thrown
        result = { success: true, raw: stdout }
      }

      // Log the sent email
      if (body.customerId) {
        // Add to customer notes (simple logging approach)
        const { data: customer } = await supabase
          .from('customers')
          .select('name')
          .eq('id', body.customerId)
          .single()

        // Update the customer's updated_at to track activity
        await supabase
          .from('customers')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', body.customerId)

        console.log(`[Email] Sent to ${body.to} for customer ${customer?.name || body.customerId}`)
      }

      return NextResponse.json({
        success: true,
        message: 'Email sent successfully',
        result,
      })

    } catch (execError: unknown) {
      console.error('gog command failed:', execError)
      const errorMessage = execError instanceof Error ? execError.message : 'Unknown error'
      return NextResponse.json(
        { error: `Failed to send email: ${errorMessage}` },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Email send error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
