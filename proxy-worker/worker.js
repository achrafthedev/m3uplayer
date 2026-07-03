// Minimal CORS proxy for Cloudflare Workers.
//
// Many Xtream/IPTV panels don't send Access-Control-Allow-Origin headers, so
// browsers block reading their responses cross-origin even though the
// request itself succeeds. This worker re-fetches the target URL server-side
// (no CORS restrictions apply there) and re-serves it with permissive CORS
// headers added.
//
// Deploy: `npx wrangler deploy` (see ../README.md for the full walkthrough),
// then set the resulting https://<name>.<subdomain>.workers.dev/ URL as the
// "CORS proxy" in the app's Settings panel.
//
// Anyone who knows this worker's URL can use it to fetch arbitrary http(s)
// URLs through your Cloudflare account — treat the deployed URL like a
// secret, and consider adding an allowlist below if you make it public.

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() })
    }

    const url = new URL(request.url)
    const target = url.pathname.slice(1) + url.search

    if (!/^https?:\/\//i.test(target)) {
      return new Response('Usage: https://<this-worker>/<full target URL>', { status: 400 })
    }

    const upstream = await fetch(target, {
      method: request.method,
      headers: { 'User-Agent': request.headers.get('User-Agent') ?? 'Mozilla/5.0' },
    })

    const response = new Response(upstream.body, upstream)
    for (const [key, value] of Object.entries(corsHeaders())) {
      response.headers.set(key, value)
    }
    return response
  },
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  }
}
