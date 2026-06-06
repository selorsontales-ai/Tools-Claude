# Communication with Claude

*Cleared after each response cycle.*

---

## New Project: YouTube Channel System

We're starting a new project. Full context is in `project_info_youtube.md`.

**In short:** Build a pipeline of tools for professional YouTube channel creation. Start with:

1. **Tool 1 — Channel Blueprint Builder**: A hierarchical suggestion system (no API cost) where users pick from nested categories (niche, format, audience, monetization, etc.). Each big choice expands into smaller sub-choices. Users can also write free-form ideas and import .md files. When ready, one button press sends everything to Claude API → generates a complete channel blueprint (JSON).

2. **Tool 2 — Channel Creator + Prompt Factory**: Takes the blueprint JSON, lets users fill in channel details (with AI Fill option), then **mass-generates prompts** (the core function). Users choose how many prompts, what type, export as JSON/MD. Can import existing prompts to avoid duplicates.

Both tools need: checkpoint system, import/export JSON, model selection (like NeuroForge), thinking mode toggle.

## ⚠️ Iron Rule: Checkpoint System

**Every tool MUST have a robust Checkpoint Import/Export system.** This is non-negotiable.

Why: The user has multiple Claude free accounts. If a tool runs out of tokens mid-operation → switch to another account (that already has the tool installed) → import checkpoint → continue immediately. Or wait a few hours for limit reset → reopen tool → import checkpoint → continue.

The checkpoint must save the COMPLETE current state: all selections, user inputs, AI outputs, progress, everything. No data should ever be lost.

## What I Need

Please design **Tool 1 first**. Propose how you'd split it into buildable modules, and start with Module 1 when ready. Remember: the hierarchical suggestion UI must NOT cost API calls — only the final "Generate Blueprint" button calls the API.

The user trusts your judgment on architecture and module splitting. Reference `NeuroForge.jsx` patterns for model selection and checkpoint system.
