export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')

  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY)
  res.status(200).json({
    ok: true,
    service: 'Antigravity Mobile Autonomous Coder (Cloud Serverless)',
    version: '1.0.0',
    platform: process.platform,
    geminiConfigured,
    environment: 'vercel-serverless',
    activePresets: {
      gamevault: {
        key: 'gamevault',
        name: 'GameVault Marketplace',
        path: 'c:/Users/waiya/Downloads/GameValut',
        type: 'fullstack',
        testCmd: 'npm test && npm run build',
        description: 'Digital marketplace for subscriptions and keys (Vite + React + Node/Express)'
      },
      portfolio: {
        key: 'portfolio',
        name: 'Teddy Qyuon Portfolio',
        path: 'c:/Users/waiya/Downloads/TeddyQyuonPortfolio',
        type: 'frontend',
        testCmd: 'npm run build',
        description: 'Personal Developer Portfolio (Vite + React + Tailwind CSS)'
      },
      meterwise: {
        key: 'meterwise',
        name: 'MeterWise AI Energy',
        path: 'c:/Users/waiya/Downloads/meterwise',
        type: 'python-ml',
        testCmd: 'npm run build && pytest',
        description: 'AI/ML Smart Energy Intelligence (FastAPI + LightGBM + React JS)'
      }
    },
    cloudExecution: {
      githubActionAvailable: true,
      colabNotebookPath: 'c:\\Users\\waiya\\Downloads\\Get_started_managed_agents_mobile.ipynb',
      colabDirectUrl: 'https://colab.research.google.com/'
    }
  })
}
