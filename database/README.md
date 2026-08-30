# database/

**Status: empty — no database exists, and none is currently planned.**

Being direct about this one rather than just calling it "not built yet":
nothing in the Phase 1–4 plan for this project (browser extension → Ollama
→ local execution → later on-device vision/privacy pipeline) currently
requires persistent storage. There's no user account system, no saved
history, and no server-side state — everything happens live, per tab, per
instruction.

Keep this folder only if the team decides to add something that genuinely
needs persistence later — for example:

- Logging instruction/action history for evaluation or a demo dashboard
- Storing user preferences or saved macros across sessions
- Any backend Adarsh's design ends up needing to persist state for

If no such need comes up, it's fine (and more honest) to simply delete this
folder rather than keep an empty placeholder in the repo.
