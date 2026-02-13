import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

interface AddRecruitRequest {
  name: string
  email?: string
  role?: string
  position?: string
  stage?: 'lead' | 'screen' | 'interview' | 'offer' | 'hired'
  comments?: string
  technical_role?: boolean
}

/**
 * Add a recruit to the CRM
 * POST /api/recruits
 */
export async function POST(request: NextRequest) {
  try {
    const body: AddRecruitRequest = await request.json()

    if (!body.name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    // Check if recruit already exists
    const { data: existing } = await supabase
      .from('recruits')
      .select('id, name, stage')
      .ilike('name', body.name)
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Recruit already exists',
        existing: existing[0],
      }, { status: 409 })
    }

    // Insert recruit
    const { data, error } = await supabase
      .from('recruits')
      .insert({
        name: body.name,
        email: body.email || null,
        role: body.role || null,
        position: body.position || null,
        stage: body.stage || 'lead',
        comments: body.comments || null,
        technical_role: body.technical_role || false,
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to add recruit:', error)
      return NextResponse.json(
        { error: 'Failed to add recruit', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Added ${body.name} as a new recruit`,
      recruit: data,
    })
  } catch (error) {
    console.error('Add recruit error:', error)
    return NextResponse.json(
      { error: 'Invalid request', details: String(error) },
      { status: 400 }
    )
  }
}

/**
 * Get recruits
 * GET /api/recruits?stage=interview&q=search
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const stage = searchParams.get('stage')
  const query = searchParams.get('q')

  let dbQuery = supabase
    .from('recruits')
    .select('*')
    .order('updated_at', { ascending: false })

  if (stage) {
    dbQuery = dbQuery.eq('stage', stage)
  }

  if (query) {
    dbQuery = dbQuery.or(`name.ilike.%${query}%,role.ilike.%${query}%`)
  }

  const { data, error } = await dbQuery.limit(50)

  if (error) {
    console.error('Recruit query error:', error)
    return NextResponse.json(
      { error: 'Query failed', details: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({
    recruits: data,
    count: data?.length || 0,
  })
}
