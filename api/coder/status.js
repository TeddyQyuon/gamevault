export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')

  const clientKey = req?.headers?.['x-gemini-key'] || req?.query?.apiKey || req?.body?.apiKey
  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY || clientKey)

  const colab20SubagentsSnippet = `# 🚀 Antigravity 20-Subagent Autonomous Worker Cluster in Google Colab
import asyncio
from google import genai

client = genai.Client()  # Uses GEMINI_API_KEY from Colab Secrets

async def worker(agent_id, repo, task):
    print(f"[Agent {agent_id:02d}] Booting sandbox for {repo}...")
    try:
        interaction = client.interactions.create(
            agent="antigravity-preview-05-2026",
            input=f"Agent #{agent_id}: Execute subtask on {repo}: {task}",
            environment="remote"
        )
        print(f"[Agent {agent_id:02d}] Done: {interaction.output_text[:80]}...")
        return interaction.output_text
    except Exception as e:
        print(f"[Agent {agent_id:02d}] Worker notice: {e}")
        return str(e)

async def main():
    print("Launching 20 parallel Antigravity subagents in cloud...")
    tasks = [worker(i, "GameVault", "Autonomous code & verification audit") for i in range(1, 21)]
    results = await asyncio.gather(*tasks)
    print(f"All 20 subagent routines complete! ({len(results)} outputs)")

asyncio.run(main())`

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
        githubRepo: 'TeddyQyuon/gamevault',
        path: 'c:/Users/waiya/Downloads/GameValut',
        type: 'fullstack',
        testCmd: 'npm test && npm run build',
        description: 'Digital marketplace for subscriptions and keys (Vite + React + Node/Express)'
      },
      portfolio: {
        key: 'portfolio',
        name: 'Teddy Qyuon Portfolio',
        githubRepo: 'TeddyQyuon/TeddyQyuonPortfolio',
        path: 'c:/Users/waiya/Downloads/TeddyQyuonPortfolio',
        type: 'frontend',
        testCmd: 'npm run build && npm run test:security',
        description: 'Personal Developer Portfolio (Vite + React + Tailwind CSS)'
      },
      meterwise: {
        key: 'meterwise',
        name: 'MeterWise AI Energy',
        githubRepo: 'TeddyQyuon/meterwise',
        path: 'c:/Users/waiya/Downloads/meterwise',
        type: 'python-ml',
        testCmd: 'npm test',
        description: 'AI/ML Smart Energy Intelligence (FastAPI + LightGBM + React JS)'
      }
    },
    cloudExecution: {
      githubActionAvailable: true,
      colabNotebookPath: 'c:\\Users\\waiya\\Downloads\\Get_started_managed_agents_mobile.ipynb',
      colabDirectUrl: 'https://colab.research.google.com/',
      colabManagedAgentsUrl: 'https://colab.research.google.com/github/google-gemini/cookbook/blob/main/quickstarts/Get_started_managed_agents.ipynb',
      colab20SubagentsSnippet
    }
  })
}
