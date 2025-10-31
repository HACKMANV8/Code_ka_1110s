import { NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('[ML Proxy] Received frame, forwarding to ML server...')
    
    // Forward the request to the ML server's HTTP endpoint
    const response = await fetch(`${process.env.ML_SERVER_URL}/analyze-frame`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      console.error('[ML Proxy] ML server error:', response.status, response.statusText)
      return Response.json(
        { success: false, error: `ML server error: ${response.statusText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('[ML Proxy] ML response:', data.success ? '✅ Success' : '❌ Failed', `Focus: ${data.focus_score}`)
    
    return Response.json(data)
  } catch (error) {
    console.error('[ML Proxy] Error:', error)
    return Response.json(
      { success: false, error: 'Failed to connect to ML server' },
      { status: 500 }
    )
  }
}
