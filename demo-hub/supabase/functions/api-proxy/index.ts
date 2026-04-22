import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key, xi-api-key',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Authenticate the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const url = new URL(req.url)
    const parts = url.pathname.split('/').filter(Boolean) // e.g. ["api-proxy", "odata", "Conversations"]
    const service = parts[1] // service name after function name
    const remainingPath = parts.slice(2).join('/')
    const queryString = url.search

    let targetBase: string
    let forwardHeaders: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    }

    if (service === 'deepgram') {
      targetBase = 'https://api.deepgram.com'
      const authHeader = req.headers.get('Authorization')
      if (authHeader) forwardHeaders['Authorization'] = authHeader
    } else if (service === 'elevenlabs') {
      targetBase = 'https://api.elevenlabs.io'
      const xiKey = req.headers.get('xi-api-key')
      if (xiKey) forwardHeaders['xi-api-key'] = xiKey
    } else if (service === 'odata') {
      // Cognigy OData proxy — API key injected server-side
      const odataApiKey = Deno.env.get('COGNIGY_ODATA_API_KEY')
      if (!odataApiKey) {
        return new Response(JSON.stringify({ error: 'OData API key not configured' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Client sends OData request details as JSON body via POST
      const body = await req.json()
      const { baseUrl: odataBaseUrl, entity, filter, orderby, top } = body

      if (!odataBaseUrl || !entity) {
        return new Response(JSON.stringify({ error: 'Missing baseUrl or entity in request body' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Build query string manually to avoid URLSearchParams encoding $ as %24
      const queryParts: string[] = []
      if (filter) queryParts.push(`$filter=${encodeURIComponent(filter)}`)
      if (orderby) queryParts.push(`$orderby=${encodeURIComponent(orderby)}`)
      if (top) queryParts.push(`$top=${top}`)
      queryParts.push(`apikey=${encodeURIComponent(odataApiKey)}`)

      const targetUrl = `${odataBaseUrl}/${entity}?${queryParts.join('&')}`
      console.log('OData target URL:', targetUrl)

      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: forwardHeaders,
      })
      const data = await response.text()
      return new Response(data, {
        status: response.status,
        headers: {
          ...corsHeaders,
          'Content-Type': response.headers.get('Content-Type') || 'application/json',
        },
      })
    } else {
      return new Response(JSON.stringify({ error: 'Unknown service' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const targetUrl = `${targetBase}/${remainingPath}${queryString}`

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: forwardHeaders,
      body: req.method !== 'GET' ? await req.text() : undefined,
    })

    const data = await response.text()

    return new Response(data, {
      status: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
      },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
