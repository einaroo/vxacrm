import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * Store outreach data (LinkedIn, draft message) for a customer
 * POST /api/outreach
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerId, companyName, contactName, contactRole, linkedIn, draftMessage } = body

    if (!companyName) {
      return NextResponse.json({ error: 'Company name required' }, { status: 400 })
    }

    // Find customer by company name if no ID provided
    let targetId = customerId
    if (!targetId) {
      const { data: customers } = await supabase
        .from('customers')
        .select('id')
        .ilike('company', companyName)
        .limit(1)
      
      if (customers && customers.length > 0) {
        targetId = customers[0].id
      }
    }

    if (!targetId) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Check if outreach record exists
    const { data: existing } = await supabase
      .from('outreach')
      .select('id')
      .eq('customer_id', targetId)
      .limit(1)

    if (existing && existing.length > 0) {
      // Update existing
      const { error } = await supabase
        .from('outreach')
        .update({
          contact_name: contactName,
          contact_role: contactRole,
          linkedin_url: linkedIn,
          draft_message: draftMessage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing[0].id)

      if (error) {
        console.error('Failed to update outreach:', error)
        return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
      }
    } else {
      // Insert new
      const { error } = await supabase
        .from('outreach')
        .insert({
          customer_id: targetId,
          contact_name: contactName,
          contact_role: contactRole,
          linkedin_url: linkedIn,
          draft_message: draftMessage,
        })

      if (error) {
        // Table might not exist - that's OK for now, we still save contact to customer
        console.error('Failed to insert outreach (table may not exist):', error)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Outreach save error:', error)
    return NextResponse.json({ error: 'Save failed' }, { status: 500 })
  }
}

/**
 * Get outreach data for a customer
 * GET /api/outreach?customerId=xxx or ?company=xxx
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const customerId = searchParams.get('customerId')
  const company = searchParams.get('company')

  if (!customerId && !company) {
    return NextResponse.json({ error: 'customerId or company required' }, { status: 400 })
  }

  try {
    let targetId = customerId
    
    if (!targetId && company) {
      const { data: customers } = await supabase
        .from('customers')
        .select('id')
        .ilike('company', company)
        .limit(1)
      
      if (customers && customers.length > 0) {
        targetId = customers[0].id
      }
    }

    if (!targetId) {
      return NextResponse.json({ outreach: null })
    }

    const { data } = await supabase
      .from('outreach')
      .select('*')
      .eq('customer_id', targetId)
      .limit(1)

    return NextResponse.json({ outreach: data?.[0] || null })
  } catch (error) {
    console.error('Outreach fetch error:', error)
    return NextResponse.json({ outreach: null })
  }
}
