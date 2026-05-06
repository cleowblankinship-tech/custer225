// ── /api/img-proxy ────────────────────────────────────────────────────────────
//
// Server-side image proxy. Fetches a remote image (Wikimedia) and re-serves it
// with Access-Control-Allow-Origin: * so the client can draw it into a canvas.
//
// Usage:
//   /api/img-proxy?url=https%3A%2F%2Fcommons.wikimedia.org%2F...
//
// Only Wikimedia URLs are allowed (allowlist prevents open-proxy abuse).

const ALLOWED_ORIGINS = [
  'commons.wikimedia.org',
  'upload.wikimedia.org',
]

export default async function handler(req, res) {
  const { url } = req.query

  if (!url) {
    return res.status(400).json({ error: 'Missing url param' })
  }

  let parsed
  try {
    parsed = new URL(url)
  } catch {
    return res.status(400).json({ error: 'Invalid url' })
  }

  if (!ALLOWED_ORIGINS.some(o => parsed.hostname === o)) {
    return res.status(403).json({ error: 'Origin not allowed' })
  }

  try {
    const upstream = await fetch(url, {
      headers: { 'User-Agent': 'custer225-app/1.0 (canvas color sampling)' },
    })

    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: 'Upstream error' })
    }

    const buffer = await upstream.arrayBuffer()
    const contentType = upstream.headers.get('content-type') || 'image/jpeg'

    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800')
    res.setHeader('Content-Type', contentType)
    res.send(Buffer.from(buffer))
  } catch (err) {
    console.error('[img-proxy] fetch failed:', err?.message)
    res.status(500).json({ error: 'Proxy fetch failed' })
  }
}
