# AI Browser Agent — Phase 1

A minimal Chrome extension (Manifest V3) that takes a screenshot of the
active tab, sends it plus a natural-language instruction to **Gemma 4
(`gemma4:31b-cloud`)** through a **local Ollama** installation, receives a
strict JSON action back, validates it, and executes it locally through
DOM APIs / Chrome extension APIs.

This is **Phase 1 only** — no OCR, no local vision model, no PII
detection, no privacy pipeline. Those are later phases.

---

## 1. Project structure

Organized by team ownership area. Folders marked *(placeholder)* contain no
code yet — see their own README for who owns that area and why it's empty.

```
ai-browser-agent/
├── manifest.json          Chrome MV3 config (paths below reflect this layout)
├── test-page.html         Local test fixture with a form, dropdowns, links, scroll content
├── README.md              This file
│
├── frontend/              Popup UI (owner: Uday, for the extension popup itself;
│   ├── popup.html         the marketing/landing page is a separate deliverable)
│   ├── popup.css
│   └── popup.js
│
├── extension-core/        Orchestration + DOM execution (owner: Mayank)
│   ├── background.js      Screenshot → Ollama → validate → execute
│   ├── content.js         Thin bridge into the page
│   └── action-executor.js CLICK/TYPE/SCROLL/SELECT DOM logic
│
├── ollama/                Ollama API client (owner: Mayank; model swaps happen here)
│   └── ollama.js          MODEL constant, system prompt, /api/chat call
│
├── backend/ (placeholder) No server exists yet — see backend/README.md (owner: Adarsh)
├── ml-models/ (placeholder) No local/on-device model yet — see ml-models/README.md (owner: Nitesh)
└── database/ (placeholder) No persistence layer planned yet — see database/README.md
```

Note: there is no literal "backend" in the client-server sense in Phase 1 —
`extension-core/` is the closest thing (the orchestration logic), but it
runs entirely inside the browser and talks straight to local Ollama. A real
backend only enters the picture if/when Adarsh's design calls for one.

### What each file does

- **manifest.json** — Declares the extension. Uses `activeTab` (not the
  broader `tabs` permission) so the extension only ever sees the tab the
  user is actively interacting with, plus `host_permissions` for
  `http://localhost:11434/*` so the background worker can call Ollama.
  Content scripts (`action-executor.js`, `content.js`) are injected into
  every page (`<all_urls>`) so CLICK/TYPE/SCROLL/SELECT work on whatever
  page you're testing.

- **popup.html / popup.css / popup.js** — The UI. `popup.js` never talks
  to Ollama and never touches the target page's DOM directly — it only
  sends `{type: "EXECUTE_INSTRUCTION", instruction}` to `background.js`
  and displays whatever status message comes back.

- **background.js** — The orchestrator and the **only** place that
  decides what happens in the browser. It:
  1. Finds the active tab.
  2. Captures a screenshot of it.
  3. Calls `ollama.js` to get Gemma's JSON action.
  4. Runs `validateAction()` — a whitelist-based validator that rejects
     anything that isn't an exact match for one of the 6 known shapes.
  5. Executes `NAVIGATE` itself via `chrome.tabs.update`, or forwards
     `CLICK` / `TYPE` / `SCROLL` / `SELECT` to the content script.

- **ollama.js** — The single place that talks to the model. Holds the
  `MODEL` constant, the system prompt, and the `fetch()` call to
  Ollama's **native** `/api/chat` endpoint.

- **action-executor.js** — Runs inside the target page (content-script
  world). Contains all DOM-search and DOM-manipulation code. Never uses
  `eval()` or `new Function()` — it only reads specific fields
  (`target`, `text`, `value`, `direction`, `amount`, `x`, `y`) that have
  already been validated in `background.js`.

- **content.js** — A ~15-line message bridge between `background.js` and
  `action-executor.js`. Kept separate so the DOM logic in
  `action-executor.js` stays independent of the messaging plumbing.

- **test-page.html** — A black-and-white local page with a Name input,
  Email input, a (disabled-by-agent) Password input, Country and Gender
  `<select>` dropdowns, Submit and Login buttons, eight filler paragraphs
  for scroll testing, and three external links.

---

## 2. Architecture & data flow

```
                 USER
                  │  types instruction, clicks EXECUTE
                  ▼
          Extension Popup (popup.html/js)
                  │  chrome.runtime.sendMessage({type: "EXECUTE_INSTRUCTION", instruction})
                  ▼
        Background Service Worker (background.js)
                  │
      1. chrome.tabs.query()          → get active tab
      2. chrome.tabs.captureVisibleTab() → screenshot (PNG, base64)
      3. ollama.js → POST http://localhost:11434/api/chat
                      model: gemma4:31b-cloud
                      messages: [system prompt, {instruction text + image}]
                      format: "json"
                  │
                  │  strict JSON string from Gemma
                  ▼
        validateAction(json)   ← untrusted input, whitelist-checked
                  │
       ┌──────────┴──────────────────┐
       ▼                              ▼
 NAVIGATE                     CLICK / TYPE / SCROLL / SELECT
 chrome.tabs.update()         chrome.tabs.sendMessage() → content.js
                                     → action-executor.js
                                     (DOM search, x/y fallback)
                  │
                  ▼
               RESULT
                  │ sendResponse(...)
                  ▼
          Popup status line
```

The model **never** executes anything. It only returns a JSON
*description* of an action. `background.js` is the trust boundary: it
validates every field before anything touches the real DOM or the tabs
API.

---

## 3. Installing and configuring Ollama

1. Install Ollama from https://ollama.com (0.6+ required for cloud
   models with image input, and this project needs a recent build for
   `gemma4:*-cloud`).
2. Sign in for cloud model access:
   ```
   ollama signin
   ```
3. Pull (register) the cloud model:
   ```
   ollama pull gemma4:31b-cloud
   ```
   This doesn't download 31B parameters to your machine — `-cloud`
   models run on Ollama's cloud infrastructure; your local `ollama`
   binary just proxies requests to it once you're signed in.
4. **Allow the extension to reach Ollama (CORS).** By default, Ollama's
   local server only accepts browser requests from a small set of known
   origins, to prevent malicious web pages from talking to your local
   Ollama instance. A Chrome extension's background worker has an origin
   like `chrome-extension://<your-extension-id>`, which is *not* in that
   default allow-list, so you must explicitly allow it:

   - **macOS/Linux:**
     ```
     OLLAMA_ORIGINS="chrome-extension://*" ollama serve
     ```
   - **Windows (PowerShell):**
     ```
     $env:OLLAMA_ORIGINS="chrome-extension://*"; ollama serve
     ```
   If you're running Ollama as a background app rather than via
   `ollama serve` in a terminal, set `OLLAMA_ORIGINS` as a persistent
   environment variable and restart the Ollama app.

5. Verify it's reachable:
   ```
   curl http://localhost:11434/api/tags
   ```
   You should see `gemma4:31b-cloud` in the list once pulled.

## 4. Configuring the model

The model is configured in exactly one place, `ollama.js`:

```js
export const MODEL = "gemma4:31b-cloud";
```

Change this single line to point at a different Ollama model (local or
cloud). Everything else in the extension is model-agnostic as long as
the model supports image input via Ollama's `images` field.

---

## 5. How each stage works

### Screenshot capture
`background.js` calls `chrome.tabs.captureVisibleTab(windowId, {format:
"png"})`. This captures **only the visible viewport of the currently
active tab** — no other tabs, no full-page scroll capture, no
cross-tab data. It returns a `data:image/png;base64,...` URL; we strip
the `data:image/png;base64,` prefix before sending the raw base64 to
Ollama.

### Screenshot → Gemma
`ollama.js` POSTs to `http://localhost:11434/api/chat` (Ollama's
**native** chat endpoint, not the OpenAI-compatible one — see
"Limitations" below for why) with:
```json
{
  "model": "gemma4:31b-cloud",
  "format": "json",
  "messages": [
    { "role": "system", "content": "<strict system prompt>" },
    { "role": "user", "content": "<instruction>", "images": ["<base64 PNG>"] }
  ]
}
```
`images` is Ollama's documented field for attaching an image to a chat
message for any multimodal model; the server handles converting that
into whatever Gemma 4's native format expects. `format: "json"` tells
Ollama to constrain generation so the output is always syntactically
valid JSON (it does not guarantee our *specific* schema — that's what
validation is for).

### Gemma → JSON
Gemma looks at the screenshot and the instruction and returns one JSON
object matching one of the six shapes defined in the system prompt
(`CLICK`, `TYPE`, `SCROLL`, `SELECT`, `NAVIGATE`, `ERROR`).

### JSON validation
`validateAction()` in `background.js`:
- Rejects anything that isn't a plain object.
- Rejects any `action` value not in the fixed whitelist.
- For each action type, requires the exact fields (`target`, `text`,
  `value`, `direction`, `url`, etc.) to be present and of the correct
  type, discarding anything else the model might have added.
- Normalizes `x`/`y`/`confidence` to numbers or `null`.
- Sanitizes `NAVIGATE` URLs with the `URL` constructor and only accepts
  `http:`/`https:` protocols — `javascript:`, `data:`, and `file:` are
  rejected outright.
- Never calls `eval()` or `new Function()` on anything from the model.

### CLICK execution
`action-executor.js` collects all visible `button`, `[role="button"]`,
`input[type=submit|button]`, `a`, and `[onclick]` elements, then tries,
in order: (1) exact case-insensitive text/label match, (2) match after
stripping punctuation/spacing, (3) substring match — checking
`innerText`, `aria-label`, `title`, `id`, `name`, and `value`. If no DOM
match is found, it falls back to `document.elementFromPoint(x, y)`
using Gemma's coordinates. If neither works, it throws (which
becomes `✗ Could not find "<target>"` in the popup).

### TYPE execution
Same 3-tier matching, but candidates are `input` (except `hidden`),
`textarea`, and `[contenteditable=true]`, matched via `placeholder`,
`aria-label`, `name`, `id`, and any associated `<label>` (both
`label[for=id]` and a wrapping `<label>`). Password inputs are
explicitly rejected before anything is written, per the spec:
*"Typing into password fields is disabled in this prototype."* On a
match, the element is focused, its value is set through the native
`HTMLInputElement`/`HTMLTextAreaElement` value setter (so frameworks
that listen for real input events still notice the change), and
`input`/`change` events are dispatched.

### SCROLL execution
`window.scrollBy({top: direction === "up" ? -amount : amount})`.
Defaults to `500` pixels if the model omits `amount` or gives an
invalid one.

### SELECT execution
Only native `<select>` elements are supported (per Phase 1 scope —
custom JS dropdowns are out of scope). The same label-matching tiers
locate the `<select>`, then its `<option>`s are matched by visible text
first, then by `value` attribute, then by a normalized/partial match.
`select.value` is set and `input`/`change` events are dispatched.

### NAVIGATE execution
Handled entirely in `background.js` (not the content script), because
navigation is a tab-level browser action, not a DOM action:
`chrome.tabs.update(tabId, {url})`. The URL has already been validated
to be `http:`/`https:` only.

---

## 6. Loading the extension

1. Open `chrome://extensions`.
2. Enable **Developer mode** (top-right toggle).
3. Click **Load unpacked** and select the `ai-browser-agent/` folder.
4. Pin the extension so its icon is visible in the toolbar.
5. If you plan to open `test-page.html` directly via a `file://` URL,
   click **Details** on the extension and enable **"Allow access to
   file URLs"** — Chrome blocks extensions from file:// pages by
   default. (Alternatively, serve `test-page.html` from any local HTTP
   server, e.g. `npx serve .`, and skip this step.)

## 7. Testing

With Ollama running (`OLLAMA_ORIGINS` set as above) and the extension
loaded:

1. Open `test-page.html`.
2. Click the extension icon to open the popup.
3. Try each of these instructions, clicking **EXECUTE** each time:
   1. `Click the Submit button`
   2. `Click Login`
   3. `Type Mayank into Name`
   4. `Type hello@example.com into Email`
   5. `Select India from Country`
   6. `Select Male from Gender`
   7. `Scroll down`
   8. `Scroll down 800 pixels`
   9. `Scroll up`
   10. `Go to https://google.com`
4. Watch the **Status** line in the popup for `✓ ...` / `✗ ...`
   messages.

---

## 8. Error handling

| Situation | Popup shows |
|---|---|
| Ollama not running / unreachable | `✗ Could not connect to Ollama at http://localhost:11434...` |
| Model not pulled | `✗ Model "gemma4:31b-cloud" was not found by Ollama. Run "ollama pull ..."` |
| Request takes too long | `✗ Ollama request timed out after 45s...` |
| Gemma returns non-JSON text | `✗ Gemma returned malformed JSON: ...` |
| Gemma returns an unknown/missing action | `✗ Gemma returned an invalid action...` |
| Gemma itself can't figure out the instruction | `✗ Unable to determine requested action` (or its own `reason`) |
| Target element not found | `✗ Could not find "Submit"` |
| Unsafe/invalid NAVIGATE URL | `✗ Blocked unsafe URL scheme "javascript:"...` |
| Password field TYPE attempt | `✗ Typing into password fields is disabled in this prototype.` |
| chrome:// / extensions page | `✗ This page is a browser-internal page and cannot be automated...` |
| Screenshot capture fails | `✗ Screenshot capture failed: ...` |

On success: `✓ Clicked "Submit"`, `✓ Typed "Mayank" into "Name"`,
`✓ Selected "India" in "Country"`, `✓ Scrolled down 500px`,
`✓ Navigated to https://google.com`.

---

## 9. Security notes

- The model's output is **never** executed as code. No `eval()`, no
  `new Function()`, no `innerHTML` of model text.
- Every field from the model passes through `validateAction()`, which
  only accepts the exact, pre-defined shapes.
- URLs are parsed with the `URL` constructor and restricted to
  `http:`/`https:`.
- Password fields are hard-blocked for `TYPE`.
- The extension only reads the **active** tab (`activeTab` permission)
  — no cookies, browsing history, localStorage, or other tabs are ever
  read or sent anywhere.
- The screenshot is the only page context sent off-device (to your
  local Ollama, which then forwards it to Ollama's cloud for the
  `-cloud` model). Nothing else about the page is transmitted.

---

## 10. Known limitations (read before filing bugs)

- **`gemma4:31b-cloud` is a very recently released model** (June 2026)
  and, being a "-cloud" model, requires an internet connection and an
  Ollama account — it is not a fully local/offline model. If you want a
  fully offline Phase 1 for testing, swap `MODEL` in `ollama.js` for a
  locally-pulled vision model (e.g. `gemma3:4b` or `gemma3:12b`) that
  you've pulled with `ollama pull`.
- **Endpoint choice matters.** We call Ollama's native `/api/chat`
  endpoint rather than its OpenAI-compatible `/v1/chat/completions`
  endpoint. There are documented issues with images being dropped or
  mishandled by some Ollama cloud vision models specifically when
  accessed through the OpenAI-compatible endpoint (this was fixed for
  `gemma3` cloud models but is a good reason to avoid that endpoint
  generally for vision). The native endpoint with the `images` field is
  the officially documented, reliable path and is what this project
  uses throughout.
- **Coordinates are a fallback, not the primary mechanism.** Gemma 4 is
  a general vision-language model, not a model specifically trained for
  pixel-precise GUI grounding. DOM text/label matching is tried first
  for exactly this reason; `x`/`y` are only used via
  `document.elementFromPoint()` when DOM matching fails, and may be
  imprecise on complex or densely-packed layouts.
- **No full-page screenshots.** `captureVisibleTab` only captures the
  visible viewport, so Gemma cannot "see" content below the fold. This
  is intentional for Phase 1 simplicity, per the "screenshot is the
  only webpage context" requirement.
- **Custom (non-native) dropdowns are not supported** — only real
  `<select>` elements, per spec.
- **Chrome-internal pages cannot be automated** (`chrome://`,
  `chrome-extension://`, the Chrome Web Store, `about:`, etc.) — this is
  a hard Chrome platform restriction, not a bug: content scripts are
  never allowed to run on these pages, no workaround exists or is
  attempted here.
- **Manifest V3 service workers are ephemeral.** `background.js` may be
  unloaded by Chrome when idle and re-started on the next message; this
  is normal and handled correctly here since the whole pipeline runs
  inside a single `chrome.runtime.onMessage` handler with no state kept
  between calls.
- **Chrome only for Phase 1**, as specified. The code avoids
  Chrome-only APIs where trivially possible, but no Firefox
  `manifest.json` variant or `browser.*` polyfill is included yet.
- **First-party trust, not sandboxing.** This prototype validates the
  *shape* of the model's output but does not attempt to detect, e.g., a
  visually-similar phishing overlay tricking Gemma into clicking the
  wrong "Submit" button. That class of problem is explicitly out of
  scope for Phase 1.

---

## 11. What's deliberately NOT in Phase 1

Per the phased plan: no DOM-aware context beyond simple label matching,
no confidence-based confirmation UI, no local/on-device vision model, no
OCR, no PII detection or redaction, no privacy-preserving transmission
pipeline, no multi-agent orchestration, no database, no auth. These are
Phases 2–4.
#   a i - b r o w s e r - a g e n t  
 