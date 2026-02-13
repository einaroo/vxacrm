import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

interface AddCompanyRequest {
  company: string      // Company name (required)
  website?: string     // Company website URL
  description?: string // Brief description
  source?: string      // Where this lead came from (e.g., "web_search")
  name?: string        // Contact name (optional)
  email?: string       // Contact email (optional)
}

/**
 * Add a company to the CRM as a lead
 * POST /api/companies
 * 
 * Body: { company: string, website?: string, description?: string, source?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body: AddCompanyRequest = await request.json()

    if (!body.company) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      )
    }

    // Check if company already exists
    const { data: existing } = await supabase
      .from('customers')
      .select('id, company, status')
      .ilike('company', body.company)
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Company already exists in CRM',
        existing: existing[0],
      }, { status: 409 })
    }

    // Extract domain from website for email placeholder
    let domain = ''
    if (body.website) {
      try {
        const url = new URL(body.website.startsWith('http') ? body.website : `https://${body.website}`)
        domain = url.hostname.replace('www.', '')
      } catch {
        // Invalid URL, ignore
      }
    }

    // Build contact name and email
    const contactName = body.name || `${body.company} Contact`
    const contactEmail = body.email || (domain ? `hello@${domain}` : '')

    // Build notes/comments from description and source
    const notes: string[] = []
    if (body.description) {
      notes.push(body.description)
    }
    if (body.website) {
      notes.push(`Website: ${body.website}`)
    }
    if (body.source) {
      notes.push(`Source: ${body.source}`)
    }
    notes.push(`Added: ${new Date().toISOString().split('T')[0]}`)

    // Insert as lead
    const { data, error } = await supabase
      .from('customers')
      .insert({
        name: contactName,
        email: contactEmail,
        company: body.company,
        status: 'lead',
        mrr_value: null,
        // Note: using a comment field approach since customers table doesn't have dedicated notes
        // The description is stored by setting it as part of the company name if needed
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to add company:', error)
      return NextResponse.json(
        { error: 'Failed to add company', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Added ${body.company} as a new lead`,
      customer: data,
    })
  } catch (error) {
    console.error('Add company error:', error)
    return NextResponse.json(
      { error: 'Invalid request', details: String(error) },
      { status: 400 }
    )
  }
}

/**
 * Search existing companies in CRM
 * GET /api/companies?q=search+term
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')

  let dbQuery = supabase
    .from('customers')
    .select('*')
    .order('updated_at', { ascending: false })

  if (query) {
    dbQuery = dbQuery.or(`company.ilike.%${query}%,name.ilike.%${query}%`)
  }

  const { data, error } = await dbQuery.limit(20)

  if (error) {
    console.error('Company search error:', error)
    return NextResponse.json(
      { error: 'Search failed', details: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({
    companies: data,
    count: data?.length || 0,
  })
}
