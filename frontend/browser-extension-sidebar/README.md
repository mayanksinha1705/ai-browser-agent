# PAROKSH - AI Browser Agent (Floating Chatbot Extension)

A floating, draggable, resizable AI browser agent that works as a chatbot on any webpage. Inspired by ChatGPT's voice orb, it supports text, voice, photo, and file inputs.

**Live demo:** http://localhost:3002

## Features

### Floating Window
- **Draggable** — Grab the header bar and move anywhere on screen
- **Resizable** — Drag any edge or corner; minimum 10px, maximum 700×900px
- **Minimize** — Collapses to a small floating "AI" pill at bottom-right
- **Maximize** — Fills the viewport
- **Close** — Hides the window; click the "AI" pill to reopen
- **Keyboard shortcut** — `Ctrl/Cmd + Shift + I` toggles the window

### Chat Interface
- Clean text-based chat bubbles (no heavy boxes)
- Agent messages have light grey background with border
- Auto-scroll to bottom on new messages
- Works in small window sizes

### Voice Agent (Orb Style)
- **Toggle mic** — Single click to start/stop listening
- **CSS Orb animation** — ChatGPT-style orb with:
  - Radial gradient background
  - Spinning conic gradient
  - Floating particles
  - Pulsing rings
  - Float + pulse animations
- **No blur** — Extension tabs remain visible while orb is active
- **Cancel button** — X icon to stop the voice agent
- **Speech-to-text** — Uses Web Speech API
- **Text-to-speech** — Agent responds with audio playback
- **VAD** — Voice Activity Detection via Web Audio API

### Input Composer
- **Photo upload** — Image icon (blue accent)
- **File attach** — Paperclip icon
- **Microphone** — Mic button on the right side
- **Send** — Send button next to mic
- **Enter** to send, **Shift+Enter** for new line

### Demo Flow
- Type "laptop" or "find laptop" to trigger the laptop search demo
- Shows step-by-step processing (current step only)
- Returns laptop comparison results with prices, specs, and ratings

### Header Controls
- **New Session** (＋) — Clears chat and stops audio
- **Settings** (⚙) — Dropdown with:
  - Reset size
  - Maximize/Restore
  - Close
  - Theme toggle (light/dark/system)

## Project Structure

```
browser-extension-sidebar/
├── app/
│   ├── page.js                  # Main chat page with voice agent
│   ├── layout.js                # Root layout with ThemeProvider
│   └── globals.css              # Tailwind + orb CSS animations
├── components/
│   ├── sidebar/
│   │   ├── FloatingChatWindow.jsx   # Main draggable/resizable container
│   │   ├── ChatHeader.jsx           # Header with drag bar + controls
│   │   ├── ChatInterface.jsx        # Chat bubbles + auto-scroll
│   │   ├── InputComposer.jsx        # Text input + photo/file/mic buttons
│   │   ├── VoiceButton.jsx          # Mic toggle button
│   │   ├── VoiceVisualizer.jsx      # CSS orb voice agent overlay
│   │   ├── AgentExecutionPanel.jsx  # Current step display
│   │   ├── EmptyState.jsx           # "Hello, Username" greeting
│   │   ├── ResizeHandle.jsx         # 8-direction resize handles
│   │   └── ThemeToggle.jsx          # Light/dark/system theme
│   └── ui/                        # shadcn/ui components
├── hooks/
│   ├── useDraggable.js            # Window drag logic + position persistence
│   ├── useResizable.js            # Window resize logic + size persistence
│   ├── useSpeechRecognition.js    # Web Speech API wrapper
│   └── useVoiceAgent.js           # Voice agent state machine + VAD + TTS
├── lib/
│   ├── constants.js               # Window sizes, agent status config
│   ├── laptop-search-flow.js      # Laptop search demo flow
│   └── utils.js                   # cn() helper
├── content/
│   ├── content-script.js          # Injects chat into any webpage
│   └── content-script.css
└── public/
    ├── manifest.json              # Chrome Extension V3 manifest
    ├── popup.html                 # Browser action popup
    └── icons/                     # Extension icons
```

## Tech Stack

- **Next.js 15** — App router
- **React 18** — UI components
- **Tailwind CSS** — Styling
- **Framer Motion** — Animations
- **Lucide React** — Icons
- **Web Speech API** — Speech recognition + TTS
- **Web Audio API** — Voice Activity Detection
- **Chrome Extension Manifest V3** — Content script injection

## Getting Started

### Install Dependencies
```bash
cd browser-extension-sidebar
npm install
```

### Development
```bash
npm run dev
```
Open http://localhost:3002

### Build
```bash
npm run build
```

### Browser Extension
1. Build the project
2. Go to `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked" → select `public/` folder
5. Click the extension icon to open the chat window

## Voice Agent States

| State | Description |
|-------|-------------|
| `idle` | Default state, mic button available |
| `listening` | Mic active, waiting for speech |
| `recording` | Speech detected, recording |
| `processing` | Processing voice input |
| `speaking` | Agent is speaking via TTS |
| `streaming` | Streaming response text |

## Customization

- **Window size:** Edit `WINDOW_SIZE` in `lib/constants.js`
- **Orb size:** Change `width/height` in `VoiceVisualizer.jsx`
- **Voice agent threshold:** Adjust `vadThreshold` in `useVoiceAgent.js`
- **Demo flow:** Modify `LAPTOP_SEARCH_FLOW` in `lib/laptop-search-flow.js`

## Backend Integration

The frontend is ready for backend integration. The `useVoiceAgent` hook accepts an `onResponse` callback. Replace the mock responses in `app/page.js` with real API calls to your backend.

---

Built with Next.js, Tailwind CSS, and Framer Motion.
