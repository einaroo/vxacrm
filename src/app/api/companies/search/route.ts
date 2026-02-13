import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface SearchResult {
  title: string
  url: string
  description: string
  domain: string
}

/**
 * Search for companies using Brave Search API
 * GET /api/companies/search?q=AI+marketing+companies+Stockholm
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json(
      { error: 'Missing search query. Use ?q=your+search+terms' },
      { status: 400 }
    )
  }

  const braveApiKey = process.env.BRAVE_API_KEY

  if (!braveApiKey) {
    // Fallback: return mock data for development/demo
    console.warn('BRAVE_API_KEY not set, returning demo results')
    return NextResponse.json({
      results: getDemoResults(query),
      source: 'demo',
      query,
    })
  }

  try {
    const searchUrl = new URL('https://api.search.brave.com/res/v1/web/search')
    searchUrl.searchParams.set('q', query)
    searchUrl.searchParams.set('count', '10')

    const response = await fetch(searchUrl.toString(), {
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': braveApiKey,
      },
    })

    if (!response.ok) {
      throw new Error(`Brave API error: ${response.status}`)
    }

    const data = await response.json()
    
    // Transform Brave results to our format
    const results: SearchResult[] = (data.web?.results || []).map((r: {
      title: string
      url: string
      description: string
    }) => ({
      title: r.title,
      url: r.url,
      description: r.description,
      domain: new URL(r.url).hostname.replace('www.', ''),
    }))

    return NextResponse.json({
      results,
      source: 'brave',
      query,
    })
  } catch (error) {
    console.error('Brave search error:', error)
    return NextResponse.json(
      { error: 'Search failed', details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * Demo results for development without API key
 */
function getDemoResults(query: string): SearchResult[] {
  const q = query.toLowerCase()
  
  // Generate contextual demo results based on query
  if (q.includes('ai') || q.includes('marketing')) {
    return [
      {
        title: 'Jasper AI - AI Marketing Platform',
        url: 'https://jasper.ai',
        description: 'AI-powered content creation platform for marketing teams. Create ads, social posts, and more.',
        domain: 'jasper.ai',
      },
      {
        title: 'Copy.ai - AI Copywriting Tool',
        url: 'https://copy.ai',
        description: 'Generate marketing copy in seconds with AI. Blog posts, product descriptions, ad copy.',
        domain: 'copy.ai',
      },
      {
        title: 'Phrasee - AI Marketing Language',
        url: 'https://phrasee.co',
        description: 'AI-powered brand language optimization for email, push, SMS, and web.',
        domain: 'phrasee.co',
      },
    ]
  }
  
  if (q.includes('saas') || q.includes('b2b')) {
    return [
      {
        title: 'Notion - All-in-one Workspace',
        url: 'https://notion.so',
        description: 'A new tool that blends your everyday work apps into one. Notes, docs, wikis.',
        domain: 'notion.so',
      },
      {
        title: 'Linear - Issue Tracking',
        url: 'https://linear.app',
        description: 'Streamline software projects, sprints, tasks, and bug tracking.',
        domain: 'linear.app',
      },
    ]
  }
  
  // Generic fallback
  return [
    {
      title: `Search result for: ${query}`,
      url: 'https://example.com',
      description: 'This is a demo result. Add BRAVE_API_KEY to .env.local for real search.',
      domain: 'example.com',
    },
  ]
}
