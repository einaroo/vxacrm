import { supabase } from '@/lib/supabase'
import { Customer, Recruit } from '@/lib/types'

export interface AttendeeContext {
  type: 'customer' | 'recruit' | 'unknown'
  data: Customer | Recruit | null
  matchedOn: 'email' | 'name' | null
}

export interface EnrichedAttendee {
  email?: string
  name: string
  context: AttendeeContext
}

/**
 * Search customers and recruits tables for matches based on email or name
 */
export async function getMeetingContext(
  attendees: { email?: string; name: string }[]
): Promise<EnrichedAttendee[]> {
  const enrichedAttendees: EnrichedAttendee[] = []

  for (const attendee of attendees) {
    let context: AttendeeContext = {
      type: 'unknown',
      data: null,
      matchedOn: null,
    }

    // Try to match by email first (most reliable)
    if (attendee.email) {
      const emailLower = attendee.email.toLowerCase()

      // Check customers
      const { data: customerByEmail } = await supabase
        .from('customers')
        .select('*')
        .ilike('email', emailLower)
        .limit(1)
        .single()

      if (customerByEmail) {
        context = {
          type: 'customer',
          data: customerByEmail,
          matchedOn: 'email',
        }
      } else {
        // Check recruits
        const { data: recruitByEmail } = await supabase
          .from('recruits')
          .select('*')
          .ilike('email', emailLower)
          .limit(1)
          .single()

        if (recruitByEmail) {
          context = {
            type: 'recruit',
            data: recruitByEmail,
            matchedOn: 'email',
          }
        }
      }
    }

    // Fall back to name matching if no email match
    if (context.type === 'unknown' && attendee.name) {
      const nameLower = attendee.name.toLowerCase()

      // Check customers by name
      const { data: customerByName } = await supabase
        .from('customers')
        .select('*')
        .ilike('name', `%${nameLower}%`)
        .limit(1)
        .single()

      if (customerByName) {
        context = {
          type: 'customer',
          data: customerByName,
          matchedOn: 'name',
        }
      } else {
        // Check recruits by name
        const { data: recruitByName } = await supabase
          .from('recruits')
          .select('*')
          .ilike('name', `%${nameLower}%`)
          .limit(1)
          .single()

        if (recruitByName) {
          context = {
            type: 'recruit',
            data: recruitByName,
            matchedOn: 'name',
          }
        }
      }
    }

    enrichedAttendees.push({
      ...attendee,
      context,
    })
  }

  return enrichedAttendees
}

/**
 * Get a summary of CRM context for a meeting
 */
export function getMeetingContextSummary(attendees: EnrichedAttendee[]): {
  hasCustomer: boolean
  hasRecruit: boolean
  customers: EnrichedAttendee[]
  recruits: EnrichedAttendee[]
} {
  const customers = attendees.filter((a) => a.context.type === 'customer')
  const recruits = attendees.filter((a) => a.context.type === 'recruit')

  return {
    hasCustomer: customers.length > 0,
    hasRecruit: recruits.length > 0,
    customers,
    recruits,
  }
}

/**
 * Format status badge text
 */
export function formatStatus(status: string): string {
  return status
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Get status color classes
 */
export function getStatusColor(
  type: 'customer' | 'recruit',
  status: string
): string {
  if (type === 'customer') {
    const colors: Record<string, string> = {
      lead: 'bg-gray-100 text-gray-700',
      'in-contact': 'bg-blue-100 text-blue-700',
      negotiating: 'bg-yellow-100 text-yellow-700',
      won: 'bg-green-100 text-green-700',
      lost: 'bg-red-100 text-red-700',
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  } else {
    const colors: Record<string, string> = {
      lead: 'bg-gray-100 text-gray-700',
      screen: 'bg-blue-100 text-blue-700',
      interview: 'bg-yellow-100 text-yellow-700',
      offer: 'bg-purple-100 text-purple-700',
      hired: 'bg-green-100 text-green-700',
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }
}
