import test from 'node:test'
import assert from 'node:assert/strict'
import {
  resolveRepo,
  runCommand,
  inspectGit,
  coderController
} from '../src/controllers/coderController.js'

test('coder controller: repository resolution', () => {
  const gv = resolveRepo('gamevault')
  assert.equal(gv.key, 'gamevault')
  assert.match(gv.path, /GameValut/i)

  const pf = resolveRepo('portfolio')
  assert.equal(pf.key, 'portfolio')
  assert.match(pf.path, /TeddyQyuonPortfolio/i)
  assert.equal(pf.testCmd, 'npm run build && npm run test:security')

  const mw = resolveRepo('meterwise')
  assert.equal(mw.key, 'meterwise')
  assert.match(mw.path, /meterwise/i)
  assert.equal(mw.testCmd, 'npm test')

  // Default fallback is gamevault
  const def = resolveRepo(null)
  assert.equal(def.key, 'gamevault')
})

test('coder controller: runCommand execution', async () => {
  const res = await runCommand('node -e "console.log(\'coder-test-ok\')"', process.cwd())
  assert.equal(res.success, true)
  assert.equal(res.exitCode, 0)
  assert.match(res.stdout, /coder-test-ok/)
  assert.ok(res.durationMs >= 0)
})

test('coder controller: inspectGit on current directory', async () => {
  const gitInfo = await inspectGit(process.cwd())
  assert.equal(gitInfo.hasGit, true)
  assert.ok(typeof gitInfo.branch === 'string')
  assert.ok(typeof gitInfo.clean === 'boolean')
})

test('coder controller: status endpoint response', async () => {
  const coder = coderController()
  let jsonResult = null
  const mockRes = {
    json: (data) => {
      jsonResult = data
    }
  }

  await coder.status({}, mockRes)
  assert.ok(jsonResult)
  assert.equal(jsonResult.ok, true)
  assert.equal(jsonResult.service, 'Antigravity Mobile Autonomous Coder')
  assert.ok(jsonResult.activePresets.gamevault)
  assert.ok(jsonResult.activePresets.portfolio)
  assert.ok(jsonResult.activePresets.meterwise)
  assert.equal(jsonResult.cloudExecution.githubActionAvailable, true)
  assert.ok(jsonResult.cloudExecution.colabManagedAgentsUrl)
  assert.match(jsonResult.cloudExecution.colab20SubagentsSnippet, /20 parallel Antigravity subagents/)
  assert.match(jsonResult.cloudExecution.colab20SubagentsSnippet, /antigravity-preview-05-2026/)
})

test('coder controller: test endpoint execution', async () => {
  const coder = coderController()
  let jsonResult = null
  const mockRes = {
    json: (data) => {
      jsonResult = data
    }
  }

  const mockReq = {
    body: {
      repoKey: 'gamevault',
      customCmd: 'node -e "console.log(\'custom-test-passed\')"'
    }
  }

  await coder.runTest(mockReq, mockRes)
  assert.ok(jsonResult)
  assert.equal(jsonResult.ok, true)
  assert.equal(jsonResult.result.success, true)
  assert.match(jsonResult.result.stdout, /custom-test-passed/)
})

test('coder controller: executeAutonomousTask validates empty task', async () => {
  const coder = coderController()
  let statusCode = 200
  let jsonResult = null
  const mockRes = {
    status: (code) => {
      statusCode = code
      return {
        json: (data) => {
          jsonResult = data
        }
      }
    }
  }

  const mockReq = { body: { task: '' } }
  await coder.executeAutonomousTask(mockReq, mockRes)
  assert.equal(statusCode, 400)
  assert.equal(jsonResult.ok, false)
  assert.equal(jsonResult.error.code, 'EMPTY_TASK')
})

test('coder controller: executeAutonomousTask executes deterministic protocol', async () => {
  const coder = coderController()
  let jsonResult = null
  const mockRes = {
    json: (data) => {
      jsonResult = data
    }
  }

  const mockReq = {
    body: {
      repoKey: 'gamevault',
      task: 'Verify autonomous test protocol runner',
      autoVerify: false // skip heavy nested test during unit run
    }
  }

  await coder.executeAutonomousTask(mockReq, mockRes)
  assert.ok(jsonResult)
  assert.equal(jsonResult.ok, true)
  assert.equal(jsonResult.verified, true)
  assert.ok(Array.isArray(jsonResult.executionLog))
  assert.ok(jsonResult.executionLog.some((l) => l.step === 'START'))
  assert.ok(jsonResult.executionLog.some((l) => l.step === 'FINISH'))
})

test('coder controller: githubDispatch URL generation', async () => {
  const coder = coderController()
  let jsonResult = null
  const mockRes = {
    json: (data) => {
      jsonResult = data
    }
  }

  // 1. Meterwise
  const mockReqMw = {
    body: {
      repoKey: 'meterwise',
      issueTitle: 'feat(mobile): add cyclical diurnal solar temperature feature'
    }
  }

  await coder.githubDispatch(mockReqMw, mockRes)
  assert.ok(jsonResult)
  assert.equal(jsonResult.ok, true)
  assert.equal(jsonResult.method, 'direct_url')
  assert.match(jsonResult.mobileIssueUrl, /github\.com\/TeddyQyuon\/meterwise\/issues\/new/)
  assert.match(jsonResult.mobileIssueUrl, /feat\(mobile\)/)
  assert.equal(jsonResult.workflowFile, '.github/workflows/agent-mobile-coder.yml')

  // 2. Default GameVault
  const mockReqGv = {
    body: {
      repoKey: 'gamevault',
      issueTitle: 'feat(mobile): autonomous verify'
    }
  }
  await coder.githubDispatch(mockReqGv, mockRes)
  assert.match(jsonResult.mobileIssueUrl, /github\.com\/TeddyQyuon\/gamevault\/issues\/new/)

  // 3. Portfolio
  const mockReqPf = {
    body: {
      repoKey: 'portfolio',
      issueTitle: 'feat(mobile): portfolio update'
    }
  }
  await coder.githubDispatch(mockReqPf, mockRes)
  assert.match(jsonResult.mobileIssueUrl, /github\.com\/TeddyQyuon\/TeddyQyuonPortfolio\/issues\/new/)

  // 4. Case-insensitivity check (e.g. METERWISE uppercase)
  const mockReqUpper = {
    body: {
      repoKey: 'METERWISE',
      issueTitle: 'feat(mobile): uppercase test'
    }
  }
  await coder.githubDispatch(mockReqUpper, mockRes)
  assert.match(jsonResult.mobileIssueUrl, /github\.com\/TeddyQyuon\/meterwise\/issues\/new/)

  // 5. Explicit full repository slug check
  const mockReqSlug = {
    body: {
      repoKey: 'TeddyQyuon/gamevault',
      issueTitle: 'feat(mobile): full slug test'
    }
  }
  await coder.githubDispatch(mockReqSlug, mockRes)
  assert.match(jsonResult.mobileIssueUrl, /github\.com\/TeddyQyuon\/gamevault\/issues\/new/)

  // 6. Empty repoKey fallback to default TeddyQyuon/gamevault
  const mockReqDefault = {
    body: {
      issueTitle: 'feat(mobile): default test'
    }
  }
  await coder.githubDispatch(mockReqDefault, mockRes)
  assert.match(jsonResult.mobileIssueUrl, /github\.com\/TeddyQyuon\/gamevault\/issues\/new/)
})
