# PAROKSH - AI Browser Agent (Floating Chatbot)

A floating, draggable, resizable AI browser agent that works as a chatbot on **any webpage** — just like the Google Meet overlay.

## What Changed

The extension has been transformed from a **fixed sidebar** to a **floating chatbot window** that:

- **Floats over any webpage** via a content script (works on Google Meet, Gmail, docs, etc.)
- **Draggable anywhere** — grab the header and move it freely across the screen
- **Resizable in all directions** — drag any edge or corner to resize width, height, or both
- **Chatbot-style UI** — Gemini-inspired message bubbles, typing indicators, gradient accents
- **Window controls** — minimize (collapse to floating "AI" pill), maximize, close
- **Position & size persistence** — remembers your preferred position and size via localStorage

## Quick Start

### Development (UI Preview)

```bash
cd browser-extension-sidebar
npm run dev
```

Open [http://localhost:3002](http://localhost:3002) — the floating chat window appears in the browser like it would on any webpage.

### Browser Extension (Content Script)

1. Build the project:
   ```bash
   npm run build
   ```

2. Load the extension in Chrome:
   - Go to `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `browser-extension-sidebar/public` directory
   - **Note:** Update `APP_URL` in `content/content-script.js` to point to your deployed app URL (or `http://localhost:3002` for local dev)

3. Click the extension icon → "Open Chat Window" or press `Ctrl/Cmd + Shift + I`

## Project Structure

```
browser-extension-sidebar/
├── app/
│   ├── page.js                  # Main page (embed detection, state management)
│   ├── layout.js                # Root layout (ThemeProvider)
│   └── globals.css              # Tailwind + custom chatbot styles
├── components/
│   ├── sidebar/
│   │   ├── FloatingChatWindow.jsx   # Main floating window (drag, resize, maximize)
│   │   ├── ChatHeader.jsx           # Draggable header with window controls
│   │   ├── ResizeHandle.jsx         # 8-direction resize handles
│   │   ├── ChatInterface.jsx        # Chat bubbles + typing indicator
│   │   ├── InputComposer.jsx        # Message input bar
│   │   ├── EmptyState.jsx           # Welcome screen with suggestion chips
│   │   ├── AgentExecutionPanel.jsx  # Agent step timeline
│   │   ├── BrowserActivityLog.jsx   # Browser action log
│   │   ├── ConfirmationDialog.jsx   # Confirmation prompt
│   │   ├── TaskCompletion.jsx       # Task complete screen
│   │   ├── ThemeToggle.jsx          # Light/dark/system toggle
│   │   └── CurrentPageContext.jsx   # Current page info
│   └── ui/                        # shadcn/ui primitives
├── hooks/
│   ├── useDraggable.js            # Drag logic with position persistence
│   ├── useResizable.js            # Resize logic (all 8 directions)
│   └── use-local-storage.js       # Local storage hooks
├── lib/
│   ├── constants.js              # Agent/window constants
│   ├── mock-agent.js             # Mock agent (demo)
│   ├── agent-emitter.js          # Event emitter
│   ├── demo-flows.js             # Demo flows (laptop search, form fill)
│   └── research-flow.js          # Research demo flow
├── content/
│   ├── content-script.js         # Injects floating chat into any webpage
│   └── content-script.css
├── public/
│   ├── manifest.json             # Chrome extension manifest V3
│   ├── popup.html                # Browser action popup
│   └── icons/                    # Extension icons
└── package.json
```

## Features

### Floating Window Controls

| Action | How |
|--------|-----|
| **Drag** | Grab the header bar and move anywhere |
| **Resize** | Drag any edge or corner handle |
| **Minimize** | Click the `ー` button (collapses to floating "AI" pill) |
| **Maximize** | Click the `□` button (fills viewport) |
| **Close** | Click the `×` button (minimizes to floating pill) |
| **Toggle via shortcut** | `Ctrl/Cmd + Shift + I` |

### Window Sizes

- **Default:** 420 × 640 px
- **Minimum:** 300 × 400 px
- **Maximum:** 700 × 900 px
- Position and size are saved to localStorage

### Demo Flows

1. **Laptop Search** — Finds and compares gaming laptops with results
2. **Form Filling** — Auto-fills forms with human confirmation
3. **Research** — Multi-source research with structured summary

## Tech Stack

- **Next.js 15** — App router, React Server Components
- **React 18** — UI with hooks
- **Tailwind CSS** — Styling
- **Framer Motion** — Animations
- **Lucide React** — Icons
- **Chrome Extension Manifest V3** — Content script injection

## Backend Integration

The architecture is event-driven via `lib/agent-emitter.js`. Replace the mock agent in `lib/mock-agent.js` with real backend calls. Key integration points are marked with comments.
