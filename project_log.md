# Project Development Log

*This file tracks the creation, updates, and bug fixes for tools developed in this repository.*

---

## 2026-06-06 — Initial Setup
- Created repository structure: `README.md`, `project_log.md`, `claude_comm.md`, `.gitignore`
- **Completed Tools**: `NeuroForge.jsx` (Storyboard Prompt Engine) — ignored in `.gitignore`

## 2026-06-06 — Co-Writer Project Planning
- Created `project_info_co_writer.md` — Full documentation of the Selorson AI Co-Writer system
- Created `required_reading.md` — File listing system for Claude token optimization
- Updated `README.md` — Added reading order instructions
- **Research completed**: Analyzed Selorson V3 backend (Rust RAG pipeline), frontend (Svelte 5), and `D:\kho github` projects
- **Key finding**: `context-router` project has relevant architecture for context budget management
- **Project goal defined**: Build a Story Writing Assistant tool for Claude Artifacts that replicates the Co-Writer RAG workflow using Claude's zero-key API

## 2026-06-06 — First Communication to Claude
- Updated `claude_comm.md` with detailed instructions for Claude
- **Key strategies communicated**:
  - Token-aware incremental development (small modules, each completable in 1-2 messages)
  - Session resilience via JSON import/export checkpoint system (non-negotiable #1 requirement)
  - Claude decides the roadmap and architecture — full trust and autonomy
  - Warning system: Claude must warn user before starting a module that might exhaust free-tier limit
- **Requested from Claude**: Development roadmap, Module 1 spec, JSON checkpoint schema, complexity estimates
- **Status**: Awaiting Claude's first response via user

## 2026-06-06 — Receiving Initial Modules (WorldBuilder & SuperPromptBuilder)
- **Files Received**: `WorldBuilder.jsx` and `SuperPromptBuilder.jsx`.
- **Analysis**:
  - Claude perfectly followed the instructions. The tool is split into self-contained modules.
  - `WorldBuilder.jsx` (Module 1): Handles entities, chapter logs, token budgets, and has a robust JSON Import/Export system. Uses `window.storage`.
  - `SuperPromptBuilder.jsx` (Module 2/3): Reads data from `WorldBuilder`, handles context assembly, AI brainstorm, SuperPrompt generation, and AI Writing.
  - Both use the zero-key `fetch` to Anthropic API.
- **Status**: Ready for user testing.

## 2026-06-06 — New Project: YouTube Channel System
- **Pivot**: User wants to build a much larger system — a professional YouTube workflow pipeline
- **Created**: `project_info_youtube.md` — Full documentation of the YouTube pipeline (Tool 1: Blueprint Builder, Tool 2: Prompt Factory)
- **Key concepts**:
  - Pipeline architecture: each tool's output is the next tool's input
  - Core philosophy: "Everything AI creates starts from a Prompt → build a Prompt Factory"
  - Tool 1 (Channel Blueprint): Hierarchical suggestion system (no API cost) + AI analysis (API cost only at final step)
  - Tool 2 (Prompt Factory): Takes blueprint → generates mass prompts for any AI
  - Nút "Update": Claude tự phát hiện model/tính năng mới của mình và cập nhật form
- **Updated**: `claude_comm.md`, `required_reading.md` for new project
- **Created**: `agent_handoff.md` (in `.gitignore`) — Internal AI context file for conversation switching
- **Status**: Awaiting Claude's response on Tool 1 architecture

## 2026-06-06 — Tool 1 Completed & Starting Tool 2
- **Completed**: `ChannelBlueprint_Tool1.jsx`. 
  - Features: 10-category multi-select UI (no API), Model Selector (Haiku/Sonnet/Opus), Thinking toggle with Effort budget, Checkpoint auto-save and Import/Export, MD file import for context.
  - Bug Fix: Added missing `exportBlueprint` function.
  - Guide created: `guide_tool1.html` (comprehensive dictionary of choices).
- **Handoff**: Updated `agent_handoff.md`, `claude_comm.md`, and `project_log.md` to instruct Claude to begin developing **Tool 2: Channel Creator + Prompt Factory**.
- **Tool 2 Goals**: Import Tool 1 Blueprint JSON, AI Fill for channel settings, mass-generate prompts UI, robust checkpoint system.

## 2026-06-06 — Tool 2 Roadmap & Tool 3 Vision
- **Roadmap discussion**: Finalized Tool 2 scope — it is purely a "Prompt Factory". It does NOT generate final content. It only produces categorized, professional prompts.
- **Tool 3 vision added**: "Content Production Studio" — takes Tool 2's prompt list and executes them. `text_generation` prompts → Claude API for scripts/titles. `image_generation` prompts → clipboard manager for Midjourney/Leonardo.
- **Design constraint for Tool 2**: Each exported prompt must include a `type` field so Tool 3 can route them downstream.
- **Updated**: `project_info_youtube.md` (added Section 4: Tool 3 vision), `.gitignore` (ignore all completed tools + inactive docs), `claude_comm.md` (rewritten: concise, non-directive, only Input/Output specs), `required_reading.md`.
- **Communication style change**: Claude is given full creative autonomy. We only specify goals, inputs, outputs, and hard constraints. No implementation directives.
- **Status**: Ready to push to Git for Claude to begin Tool 2 development.

