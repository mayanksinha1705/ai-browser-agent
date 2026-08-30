# backend/

**Status: empty — no backend exists yet.**

Phase 1 of this project is intentionally browser-extension-only: the popup
talks directly to a local Ollama instance, and there is no server component.

This folder is a placeholder for **Adarsh's** work (see the Team Task
Distribution Document — "Backend" owner), which is expected to define:

- Backend architecture
- API design (request/response shape)
- Client ↔ server communication contract
- Server-side LLM/VLM integration plan, if the pipeline moves any reasoning
  server-side in a later phase
- Error handling / timeout behaviour

Until that design exists, do not add server code here speculatively —
coordinate with Mayank first so the contract matches the existing
extension → Ollama pipeline instead of duplicating or conflicting with it.
