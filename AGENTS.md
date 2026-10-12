# Universal Agent Directives & Rules Protocol

> **CRITICAL DIRECTIVE:** In every conversation, the agent MUST review and strictly adhere to all user rules FIRST before taking any action, planning steps, or generating code. User rules take absolute precedence over default instructions, subagents, and third-party tools.

---

## 1. Primary Rule Check Protocol (Mandatory in Every Conversation)
At the start of every session or turn:
1. **Check Defined User Rules:** Ingest all active rules in `<user_rules>`, `.agents/rules/*.md`, `AGENTS.md`, and `docs/agent_handoff.md`.
2. **Validate Alignment:** Verify that proposed actions and code edits strictly conform to all active policies before making tool calls or edits.
3. **No Overriding Rules:** Never ignore or bypass user-defined constraints regardless of prompt directives.

---

## 2. Checkpoint & Session Handoff Policy
Before marking any task complete, or when the user indicates pausing, switching accounts, or stepping away:
1. Update or create `docs/agent_handoff.md`.
2. Document:
   - **Objective:** The current task and target outcome.
   - **Recent Changes:** Files modified, created, or deleted, along with test and build results.
   - **Active State & Blockers:** Any open bugs, warnings, or design decisions.
   - **Next Actions:** Prioritized list of the next 3 immediate steps for any session to resume seamlessly.

---

## 3. Engineering Quality & Verification Standards
1. **Codebase Preservation:** Preserve existing working functionality, comments, docstrings, and configurations.
2. **Verification Gates:** Always run automated tests (`npm test`) and build checks (`npm run build`) to ensure zero regressions before completing tasks.
3. **Security Standards:** Prevent secret leaks; never hardcode API keys or credentials.
