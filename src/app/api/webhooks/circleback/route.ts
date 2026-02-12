import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    
    // Log the payload for debugging
    console.log('[CircleBack Webhook] Received payload:', JSON.stringify(payload, null, 2))
    
    // TODO: Process the contact data when we have the CircleBack webhook format
    // For now, just acknowledge receipt
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'Webhook received',
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[CircleBack Webhook] Error processing webhook:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Invalid JSON payload' 
      },
      { status: 400 }
    )
  }
}

// Handle GET requests (for webhook verification if needed)
export async function GET() {
  return NextResponse.json(
    { 
      status: 'ok',
      endpoint: '/api/webhooks/circleback',
      description: 'CircleBack contact sync webhook endpoint',
      methods: ['POST']
    },
    { status: 200 }
  )
}
