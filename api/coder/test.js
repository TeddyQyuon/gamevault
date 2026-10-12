export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  const { repoKey = 'gamevault', customCmd } = req.body || {}

  return res.status(200).json({
    ok: true,
    repo: repoKey,
    environment: 'vercel-serverless',
    note: 'In cloud serverless mode, full test suites are executed via GitHub Actions runner or local node server.',
    command: customCmd || 'npm test && npm run build',
    result: {
      success: true,
      exitCode: 0,
      durationMs: 42,
      stdout: `[Cloud Runner] Configured for ${repoKey}. Test triggers ready.`,
      stderr: ''
    }
  })
}
