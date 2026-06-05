# Communication with Claude

*This file is the communication channel between Antigravity (the coordinating agent) and Claude (the builder). Cleared after each response cycle.*

---

## Current Mission

We are building a **Story Writing Assistant** tool that runs inside Claude Artifacts (React JSX, single file, using the "Anthropic API in Artifacts" zero-key technique). Full project context is in `project_info_co_writer.md`.

---

## Critical Constraints — Please Read Carefully

### 1. Token-Aware Incremental Development
The human user is on **Claude Free tier**. This means:
- Limited messages per session (~100 messages, then cooldown of several hours)
- If a tool build gets interrupted mid-way, **all progress in that Artifact is lost**
- Therefore: **NEVER attempt to build the entire tool in one shot**

**Strategy:**
- Break the tool into **small, self-contained modules** (each completable in 1-2 messages)
- Each module must be **fully functional on its own** — test-ready, not a skeleton
- Before starting a module, **estimate if it fits within remaining token budget**
- If you think the next step might exhaust the session limit → **STOP and warn the user**: *"⚠️ The next module is substantial. I recommend waiting for your limit to reset before continuing."*
- The user will then pause and resume in a new session

### 2. Session Resilience — Import/Export Checkpoint System
Since free-tier sessions can be interrupted at any time:
- The tool **MUST have a robust import/export system from the very first module**
- All state (entities, chapter logs, settings, work-in-progress) must be exportable to a JSON file
- On the next session, the user imports that JSON and picks up exactly where they left off
- This is the **#1 non-negotiable requirement** — build it into the foundation, not as an afterthought

### 3. You Decide the Roadmap
- **You (Claude) are the architect.** You understand your own Artifacts environment, token limits, and API capabilities better than anyone
- Please design the development roadmap yourself — decide what to build first, what order, how to split modules
- The coordinating agent (Antigravity/me) will handle: file management, git pushes, testing feedback, and relaying your decisions to the user
- The user trusts your judgment completely on technical decisions

---

## What I Need From You (First Response)

Please provide:

1. **Your proposed development roadmap** — Split the tool into numbered phases/modules, each small enough to complete in one free-tier session
2. **Module 1 specification** — Detailed spec of the first module you want to build (what it does, what UI it has, what data structures it uses)
3. **Data schema** — The JSON schema for the checkpoint/export file that will persist across sessions
4. **Estimated complexity** — For each module, a rough estimate: "small (1 message)", "medium (2-3 messages)", "large (warn before starting)"

Do NOT start coding yet. Let's align on the plan first. The user will review it and confirm.

---

## Technical Reference

### Artifacts Environment Capabilities
- React JSX (single file, hooks: useState, useCallback, useRef, useEffect)
- `fetch("https://api.anthropic.com/v1/messages")` — zero-key, Claude auto-injects auth
- `window.storage.set/get/delete` — persistence API (survives page refresh, NOT session end)
- `FileReader` + `Blob` + `URL.createObjectURL` — file import/export
- `lucide-react` icons available
- No external npm packages, no backend, no filesystem access
- Clipboard: use `execCommand("copy")` fallback (iframe blocks `navigator.clipboard`)

### Existing Tool Reference
- See `NeuroForge.jsx` (in `.gitignore`, but described in `project_info_co_writer.md`) for patterns: checkpoint system, token usage tracking, model selection, streaming

### Data Compatibility
- The tool should use data structures **compatible with** (importable/exportable to) the Selorson Co-Writer system
- Entity types: character, location, legend, item, event, organization
- Entity fields: id, entity_type, name, aliases[], role, first_chapter, collision_priority, description
- Chapter log fields: chapter_number, summary, key_events[], plot_seeds[]

---

## Communication Protocol

1. Claude builds/plans → user copies Claude's response to me
2. I update `claude_comm.md` with feedback/next instructions → push to GitHub
3. Claude reads the repo → sees new instructions → continues
4. After each response cycle, I clear this file and write fresh instructions

**Let's build something amazing. You lead, I support. 🚀**
