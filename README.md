# 🤖 AI Browser Agent — Phase 1

> A minimal Chrome Manifest V3 browser agent that converts natural-language instructions into validated browser actions using **Gemma 4** through **local Ollama**.

The agent captures the active tab, sends the screenshot and user instruction to `gemma4:31b-cloud`, receives a strict JSON action, validates it against a fixed schema, and executes the action locally through Chrome Extension APIs and DOM APIs.

**Phase 1 is intentionally minimal.** OCR, PII detection/redaction, local vision models, privacy pipelines, multi-agent orchestration, authentication, and persistence are planned for later phases.

---

## ✨ Features

* 🧠 Natural-language browser instructions
* 📸 Active-tab screenshot understanding
* 🤖 Gemma 4 vision-language reasoning
* 🦙 Local Ollama integration
* 🔒 Strict JSON action validation
* 🌐 Safe URL navigation
* 🖱️ DOM-based clicking
* ⌨️ Text input automation
* 📜 Page scrolling
* 🔽 Native `<select>` dropdown selection
* 🛡️ Password-field protection
* 🚫 No `eval()` or `new Function()`
* 🔌 Chrome Manifest V3 architecture
* 💻 No application backend required in Phase 1

---

# 🏗️ Architecture

```text
                         USER
                          │
                          │ Natural-language instruction
                          ▼
                ┌─────────────────────┐
                │   Extension Popup   │
                │ popup.html/js/css    │
                └──────────┬──────────┘
                           │
                           │ EXECUTE_INSTRUCTION
                           ▼
                ┌─────────────────────┐
                │ Background Worker   │
                │   background.js     │
                └──────────┬──────────┘
                           │
             ┌─────────────┴─────────────┐
             │                           │
             ▼                           ▼
   captureVisibleTab()            ollama.js
             │                           │
             │ Screenshot                │ POST /api/chat
             │                           ▼
             │                    ┌──────────────┐
             │                    │   Ollama     │
             │                    │ gemma4:31b   │
             │                    │    -cloud    │
             │                    └──────┬───────┘
             │                           │
             │                           │ Strict JSON
             │                           ▼
             │                    validateAction()
             │                           │
             │                 ┌─────────┴─────────┐
             │                 │                   │
             │                 ▼                   ▼
             │            NAVIGATE         DOM ACTIONS
             │                 │           CLICK / TYPE
             │                 │           SCROLL / SELECT
             │                 ▼                   │
             │         chrome.tabs.update()       │
             │                                     ▼
             │                              content.js
             │                                     │
             │                                     ▼
             │                              action-executor.js
             │                                     │
             └─────────────────────────────────────┘
                                                   │
                                                   ▼
                                                RESULT
                                                   │
                                                   ▼
                                             Popup Status
```

### 🔑 Trust Boundary

The model **never directly executes browser actions**.

Gemma only produces a JSON description of the requested action. `background.js` acts as the trust boundary and validates the model output before any DOM or Chrome API operation is performed.

```text
Gemma
  │
  │ Untrusted JSON
  ▼
validateAction()
  │
  │ Validated action
  ▼
Browser APIs / DOM
```

---

# 📁 Project Structure

```text
ai-browser-agent/
│
├── manifest.json
├── test-page.html
├── README.md
│
├── frontend/
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
│
├── extension-core/
│   ├── background.js
│   ├── content.js
│   └── action-executor.js
│
├── ollama/
│   └── ollama.js
│
├── backend/
│   └── README.md
│
├── ml-models/
│   └── README.md
│
└── database/
    └── README.md
```

## Component Responsibilities

| Component         | Responsibility                            | Owner  |
| ----------------- | ----------------------------------------- | ------ |
| `frontend/`       | Extension popup UI                        | Uday   |
| `extension-core/` | Orchestration and DOM execution           | Mayank |
| `ollama/`         | Ollama API client and model configuration | Mayank |
| `backend/`        | Future backend architecture               | Adarsh |
| `ml-models/`      | Future on-device models                   | Nitesh |
| `database/`       | Future persistence layer                  | —      |

> `backend/`, `ml-models/`, and `database/` are intentionally placeholders in Phase 1.

---

# 🔄 How It Works

## 1. User Instruction

The user enters a natural-language instruction in the extension popup:

```text
Type Mayank into Name
```

The popup sends:

```js
{
  type: "EXECUTE_INSTRUCTION",
  instruction: "Type Mayank into Name"
}
```

to `background.js`.

---

## 2. Active Tab Detection

`background.js` identifies the currently active tab.

The extension uses the `activeTab` permission rather than broad tab access wherever possible.

---

## 3. Screenshot Capture

The visible viewport is captured using:

```js
chrome.tabs.captureVisibleTab(windowId, {
  format: "png"
});
```

Only the currently visible portion of the active tab is captured.

The resulting:

```text
data:image/png;base64,...
```

URL is converted to raw Base64 before being sent to Ollama.

---

## 4. Gemma Reasoning

`ollama.js` sends the instruction and screenshot to Ollama's native `/api/chat` endpoint.

Example request:

```json
{
  "model": "gemma4:31b-cloud",
  "format": "json",
  "messages": [
    {
      "role": "system",
      "content": "<strict action-generation prompt>"
    },
    {
      "role": "user",
      "content": "Type Mayank into Name",
      "images": [
        "<base64 screenshot>"
      ]
    }
  ]
}
```

Gemma returns a structured action rather than executable code.

---

# 📋 Supported Actions

Phase 1 supports six action types:

| Action     | Purpose                                               |
| ---------- | ----------------------------------------------------- |
| `CLICK`    | Click a visible page element                          |
| `TYPE`     | Enter text into an input                              |
| `SCROLL`   | Scroll the page                                       |
| `SELECT`   | Select an option from a native dropdown               |
| `NAVIGATE` | Navigate to an HTTP/HTTPS URL                         |
| `ERROR`    | Report that the requested action cannot be determined |

Example:

```json
{
  "action": "CLICK",
  "target": "Submit"
}
```

Another example:

```json
{
  "action": "TYPE",
  "target": "Name",
  "text": "Mayank"
}
```

---

# 🛡️ Action Validation

Model output is considered **untrusted input**.

Before execution, `validateAction()`:

* Verifies the response is a plain object.
* Checks the `action` against a fixed whitelist.
* Requires the correct fields for each action.
* Rejects unexpected or malformed fields.
* Normalizes numeric values such as `x`, `y`, and `confidence`.
* Validates navigation URLs.
* Allows only:

  * `http:`
  * `https:`
* Rejects dangerous schemes such as:

  * `javascript:`
  * `data:`
  * `file:`
* Prevents password-field typing.

No model-generated value is executed as JavaScript.

### ❌ Never used

```js
eval(modelOutput);
```

```js
new Function(modelOutput);
```

---

# 🖱️ DOM Action Execution

DOM operations are handled by:

```text
content.js
     │
     ▼
action-executor.js
```

`content.js` is intentionally kept as a thin messaging bridge.

The actual DOM logic lives in `action-executor.js`.

---

## CLICK

The executor searches visible clickable elements such as:

```text
button
[role="button"]
input[type="submit"]
input[type="button"]
a
[onclick]
```

Matching occurs in multiple stages:

1. Exact case-insensitive match
2. Normalized text match
3. Partial/substring match

The following properties may be considered:

```text
innerText
aria-label
title
id
name
value
```

If DOM matching fails, Gemma-provided `x/y` coordinates may be used as a fallback through:

```js
document.elementFromPoint(x, y);
```

DOM matching is preferred because Gemma is a general VLM rather than a pixel-perfect GUI-grounding model.

---

# ⌨️ TYPE

Supported targets include:

```text
input
textarea
[contenteditable=true]
```

Inputs are matched using:

```text
placeholder
aria-label
name
id
label
```

Both explicit labels:

```html
<label for="name">Name</label>
```

and wrapping labels are supported.

The prototype explicitly blocks password fields.

```text
Password fields → ❌ BLOCKED
```

Text is inserted using the native input/textarea value setter, followed by:

```text
input
change
```

events so frameworks listening for normal input events can respond.

---

# 📜 SCROLL

Scrolling uses the browser's native API:

```js
window.scrollBy({
  top: direction === "up" ? -amount : amount
});
```

Default amount:

```text
500px
```

Example:

```json
{
  "action": "SCROLL",
  "direction": "down",
  "amount": 800
}
```

---

# 🔽 SELECT

Phase 1 supports native HTML:

```html
<select>
```

elements only.

Options are matched by:

1. Visible option text
2. `value`
3. Normalized/partial matching

After selection:

```text
input
change
```

events are dispatched.

Custom JavaScript dropdowns are outside the Phase 1 scope.

---

# 🌐 NAVIGATE

Navigation is handled directly by `background.js`:

```js
chrome.tabs.update(tabId, {
  url
});
```

Before navigation, the URL is parsed using the `URL` constructor.

Only:

```text
http://
https://
```

are allowed.

---

# 🦙 Ollama Setup

## Requirements

* Google Chrome
* Ollama `0.6+`
* Ollama account for cloud models
* Internet connection for `-cloud` models

Install Ollama from:

[Ollama](https://ollama.com?utm_source=chatgpt.com)

---

## 1. Sign in

```bash
ollama signin
```

---

## 2. Pull the model

```bash
ollama pull gemma4:31b-cloud
```

> `gemma4:31b-cloud` does **not** download 31B parameters to the local machine. The `-cloud` model is served through Ollama's cloud infrastructure.

---

## 3. Configure CORS

Chrome extensions have origins such as:

```text
chrome-extension://<extension-id>
```

Therefore, Ollama must allow the extension origin.

### macOS / Linux

```bash
OLLAMA_ORIGINS="chrome-extension://*" ollama serve
```

### Windows PowerShell

```powershell
$env:OLLAMA_ORIGINS="chrome-extension://*"; ollama serve
```

If Ollama is running as a background application, configure `OLLAMA_ORIGINS` as a persistent environment variable and restart Ollama.

---

## 4. Verify Ollama

```bash
curl http://localhost:11434/api/tags
```

The response should include:

```text
gemma4:31b-cloud
```

---

# ⚙️ Model Configuration

The model is intentionally configured in a single location:

```text
ollama/ollama.js
```

```js
export const MODEL = "gemma4:31b-cloud";
```

To use another compatible Ollama vision model, change only this value.

For example:

```js
export const MODEL = "gemma3:12b";
```

The rest of the agent remains model-agnostic as long as the selected model supports image input through Ollama.

---

# 🧩 Installing the Extension

### 1. Open Chrome Extensions

Navigate to:

```text
chrome://extensions
```

### 2. Enable Developer Mode

Enable **Developer mode** in the top-right corner.

### 3. Load the project

Click:

```text
Load unpacked
```

and select:

```text
ai-browser-agent/
```

### 4. Pin the extension

Pin the extension to the Chrome toolbar for easier testing.

---

# 🧪 Testing

The repository includes:

```text
test-page.html
```

The test fixture contains:

* Name input
* Email input
* Password input
* Country dropdown
* Gender dropdown
* Submit button
* Login button
* Scrollable content
* External links

Open `test-page.html` and try:

```text
1. Click the Submit button
2. Click Login
3. Type Mayank into Name
4. Type hello@example.com into Email
5. Select India from Country
6. Select Male from Gender
7. Scroll down
8. Scroll down 800 pixels
9. Scroll up
10. Go to https://google.com
```

Expected results include:

```text
✓ Clicked "Submit"
✓ Clicked "Login"
✓ Typed "Mayank" into "Name"
✓ Selected "India" in "Country"
✓ Scrolled down 500px
✓ Navigated to https://google.com
```

---

# ⚠️ Error Handling

| Condition                   | Result                                         |
| --------------------------- | ---------------------------------------------- |
| Ollama unavailable          | `✗ Could not connect to Ollama...`             |
| Model unavailable           | `✗ Model "gemma4:31b-cloud" was not found...`  |
| Request timeout             | `✗ Ollama request timed out after 45s...`      |
| Invalid JSON                | `✗ Gemma returned malformed JSON...`           |
| Invalid action              | `✗ Gemma returned an invalid action...`        |
| Action cannot be determined | `✗ Unable to determine requested action`       |
| Element not found           | `✗ Could not find "..."`                       |
| Unsafe URL                  | `✗ Blocked unsafe URL scheme...`               |
| Password input              | `✗ Typing into password fields is disabled...` |
| Chrome internal page        | `✗ This page is a browser-internal page...`    |
| Screenshot failure          | `✗ Screenshot capture failed...`               |

---

# 🔐 Security & Privacy

Phase 1 follows a **model-as-untrusted-input** design.

### Security principles

* ❌ No `eval()`
* ❌ No `new Function()`
* ❌ No model-generated JavaScript execution
* ✅ Fixed action whitelist
* ✅ Strict action validation
* ✅ URL protocol validation
* ✅ Password-field protection
* ✅ DOM APIs for execution
* ✅ Chrome APIs for browser-level actions

### Data flow

The only webpage context sent to the model pipeline is the screenshot:

```text
Active Tab
    │
    ▼
Screenshot
    │
    ▼
Local Ollama
    │
    ▼
Ollama Cloud
    │
    ▼
Gemma 4
```

> **Important:** `gemma4:31b-cloud` is not fully on-device. Although the extension communicates with a local Ollama instance, the cloud model processes the request remotely. A future local vision model will be required for a fully on-device privacy pipeline.

The extension does not intentionally read:

* Cookies
* Browsing history
* Other tabs
* LocalStorage
* Page databases
* Password values

---

# 🚧 Phase 1 Limitations

### Visible viewport only

`captureVisibleTab()` captures only the visible viewport.

The agent does not capture the entire page or automatically scroll through the page to build a full screenshot.

### Coordinate accuracy

Coordinates are only a fallback.

DOM matching is preferred because general-purpose VLMs may not provide pixel-perfect GUI grounding.

### Native dropdowns only

Only standard HTML `<select>` elements are supported.

Custom JavaScript dropdowns are not supported.

### Chrome only

Phase 1 targets Chrome Manifest V3.

No Firefox-specific manifest or `browser.*` compatibility layer is included.

### Chrome internal pages

The extension cannot automate pages such as:

```text
chrome://
chrome-extension://
Chrome Web Store
about:
```

This is enforced by Chrome's extension security model.

### Ephemeral service worker

Manifest V3 service workers can be unloaded and restarted by Chrome.

Phase 1 does not depend on persistent in-memory state between executions.

---

# 🗺️ Roadmap

Phase 1 establishes the basic browser-agent loop:

```text
Instruction
     ↓
Screenshot
     ↓
Vision-Language Model
     ↓
Structured Action
     ↓
Validation
     ↓
Browser Execution
```

Future phases will extend this foundation.

| Phase       | Planned Capability                                           |
| ----------- | ------------------------------------------------------------ |
| **Phase 1** | Screenshot → Gemma → validated browser action                |
| **Phase 2** | Better DOM/context awareness, confidence handling            |
| **Phase 3** | On-device visual perception, OCR, local models               |
| **Phase 4** | PII detection, redaction, privacy-preserving pipeline        |
| **Future**  | Multi-agent orchestration, backend, database, authentication |

---

# 🎯 Phase 1 Scope

### Included

```text
Natural-language instructions
        ↓
Active-tab screenshot
        ↓
Gemma 4 reasoning
        ↓
Strict JSON action
        ↓
Whitelist validation
        ↓
Local browser execution
```

### Not Included

```text
❌ OCR
❌ PII detection
❌ PII redaction
❌ Local vision model
❌ Privacy-preserving transmission
❌ Multi-agent orchestration
❌ Database
❌ Authentication
❌ Confidence-based confirmation UI
❌ Advanced DOM context
```

---

# 🧠 Design Philosophy

The core principle of Phase 1 is:

> **The model decides what should happen; the browser decides whether it is safe to execute.**

Gemma provides **reasoning and action selection**, while deterministic extension code provides **validation and execution**.

This separation keeps the LLM outside the execution trust boundary and provides a foundation for progressively adding local perception and privacy mechanisms in later phases.

---

## 📌 Status

**Phase 1 — Prototype**

The current implementation is intended for controlled testing and experimentation rather than unrestricted browser automation.

---
