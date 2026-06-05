# Communication with Claude

*Cleared after each response cycle.*

---

## Mission

Build a **Story Writing Assistant** tool for Claude Artifacts. Full context in `project_info_co_writer.md`.

## Key Concerns

1. **User is on Free tier** — sessions can be interrupted anytime. The tool MUST have import/export JSON checkpoint from day one. No progress should ever be lost.

2. **Build incrementally** — one small, self-contained module per session. Each module must be fully functional, not a skeleton. If the next step risks exhausting the session limit, warn the user instead of starting it.

3. **You decide everything** — roadmap, architecture, module order, data structures. You know your Artifacts environment and limits best. I (Antigravity) handle file management, git, and feedback relay.

4. **Data compatibility** — the tool should be able to exchange data (import/export) with the existing Selorson Co-Writer system described in `project_info_co_writer.md`.

## First Request

Please provide your proposed **development roadmap** — how you'd split this tool into modules, what order, and what Module 1 would look like. Don't code yet, just plan. The user will review and confirm.

---

**You lead, I support. 🚀**
