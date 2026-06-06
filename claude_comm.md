# Communication with Claude

*Cleared after each response cycle.*

---

## 🎯 Current Task: Build Tool 2 — Channel Creator + Prompt Factory

Tool 1 (Channel Blueprint Builder) is complete. Now building Tool 2.

### What Tool 2 does
- **Input:** JSON file exported from Tool 1 (contains channel blueprint).
- **Output:** A categorized list of professional prompts (JSON/MD), ready to be used by any AI or fed into Tool 3 later.

### Key behaviors
1. Import Tool 1's blueprint JSON → display it as context, adapt the interface dynamically based on the imported channel data.
2. Channel Settings with an "AI Fill" button — user gives a short raw instruction, Claude fills structured fields using the blueprint as context.
3. Prompt Factory (core) — mass-generate prompts by type and quantity. Allow importing previously generated prompts to avoid duplicates.
4. Each generated prompt must include a `type` field (e.g. `text_generation`, `image_generation`) so Tool 3 can route them correctly downstream.

### Constraints (non-negotiable)
- **Checkpoint System**: Full state Import/Export JSON. `window.storage` auto-save. No data loss ever.
- **Model Selector**: Haiku/Sonnet/Opus, Thinking toggle, Effort dropdown (same pattern as Tool 1 and NeuroForge).
- **Export**: JSON and/or Markdown.

### What's next after Tool 2 (context only, not building yet)
Tool 3 will be a "Content Production Studio" that takes Tool 2's prompt list and executes them — `text_generation` prompts get sent to Claude API for final content, `image_generation` prompts become a clipboard manager for Midjourney/Leonardo. See `project_info_youtube.md` Section 4 for details.

## 🚀 Action
Please build Tool 2. You decide the architecture, module split, and prompt engineering approach. The user trusts your judgment completely.
