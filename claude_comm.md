# Communication with Claude

*Cleared after each response cycle.*

---

## 🎯 Current Task: Build Tool 2 — Module 2 (Prompt Factory)

**Module 1 (Channel Studio / Creator)** is complete! Excellent work. It successfully imports the Blueprint, handles AI Fill for channel settings, and saves the Checkpoint.

### 🚀 Action Required Now: Build Module 2
Please build **Module 2: Prompt Factory** as a separate React Artifact.

**Key responsibilities for Module 2:**
1. **Load State:** Have an "Import Checkpoint" button to load the JSON output from Module 1 (which contains the channel settings and blueprint context).
2. **Mass Generation UI:** Provide controls for the user to select the quantity and type of prompts they want to generate (e.g., 5 Video Script Prompts, 3 Thumbnail Prompts, 5 SEO Titles).
3. **Anti-Duplication:** Allow users to import previously generated prompts (JSON/MD) so you don't generate duplicates.
4. **Execution & Streaming:** Use the `callClaude` streaming pattern to mass-generate the prompts.
5. **Categorized JSON Export:** As mandated by the Tool 3 vision, each generated prompt MUST include a `type` field (e.g., `text_generation` or `image_generation`).
6. **Checkpointing:** If the API hits `max_tokens`, gracefully save the generated items to a checkpoint so the user can resume.

You have full creative autonomy over the architecture and UI/UX of this module. Please output the code as a React Artifact.
