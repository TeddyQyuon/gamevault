// The public storefront has no authenticated owner session for AI automation.
// Fail closed rather than expose a configured provider key or accept execution.
export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed.' } })
  }
  return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Coder automation is unavailable on the storefront.' } })
}
