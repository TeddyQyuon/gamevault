export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  const { repoKey = 'gamevault', issueTitle, issueBody, githubToken, repoOwner, repoName } = req.body || {}
  const title = issueTitle || `feat(mobile): Autonomous task via phone PWA`
  const body = issueBody || `Task triggered from Antigravity Mobile Browser App shortcut.\n\nTarget Repo: ${repoKey}\nTimestamp: ${new Date().toISOString()}`

  if (githubToken && repoOwner && repoName) {
    try {
      const ghRes = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/issues`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${githubToken}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Antigravity-Mobile-PWA'
        },
        body: JSON.stringify({
          title,
          body,
          labels: ['mobile-agent', 'autonomous']
        })
      })

      const ghData = await ghRes.json()
      if (!ghRes.ok) {
        return res.status(ghRes.status).json({
          ok: false,
          error: { code: 'GITHUB_API_ERROR', message: ghData.message || 'GitHub API error' }
        })
      }

      return res.status(200).json({
        ok: true,
        method: 'api',
        issueUrl: ghData.html_url,
        issueNumber: ghData.number,
        message: 'GitHub Mobile cloud runner triggered successfully via Issue!'
      })
    } catch (err) {
      return res.status(500).json({
        ok: false,
        error: { code: 'DISPATCH_ERROR', message: err.message }
      })
    }
  }

  const defaultRepo = 'wai-yan-hein/GameVault'
  const encodedTitle = encodeURIComponent(title)
  const encodedBody = encodeURIComponent(body)
  const mobileIssueUrl = `https://github.com/${defaultRepo}/issues/new?title=${encodedTitle}&body=${encodedBody}`

  return res.status(200).json({
    ok: true,
    method: 'direct_url',
    mobileIssueUrl,
    workflowFile: '.github/workflows/agent-mobile-coder.yml',
    instructions: 'Opening this URL in the GitHub Mobile app or browser will create an issue that instantly wakes up the cloud runner while your laptop is off.'
  })
}
