# ml-models/

**Status: empty — no local/on-device ML model exists yet.**

Phase 1 uses only `gemma4:31b-cloud` via Ollama for visual reasoning — there
is no local vision model, OCR, or on-device inference in this codebase.

This folder is a placeholder for **Nitesh's** work (see the Team Task
Distribution Document — "ML Models / Libraries / Latency" owner), which is
expected to produce:

- A lightweight vision model recommendation (with size/accuracy/latency
  trade-offs)
- A recommended inference library (ONNX Runtime Web, WebGPU, Transformers.js,
  etc.)
- Any OCR component (e.g. Tesseract.js), if adopted

This work belongs to a **later phase** (local/on-device vision + privacy
architecture) — do not wire a model into `extension-core/` or `ollama/`
until the recommendation is finalized and agreed with Mayank, so it slots
into the existing pipeline rather than becoming a second, competing path.
