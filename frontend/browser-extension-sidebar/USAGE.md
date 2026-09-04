# Usage Guide - PAROKSH AI Browser Agent (Floating Chatbot)

## Getting Started

### 1. Start the Development Server

```bash
cd browser-extension-sidebar
npm run dev
```

Open [http://localhost:3002](http://localhost:3002)

The floating chat window will appear in the browser — positioned at the bottom-right, just like Google Meet's video panel.

## Using the Floating Chat Window

### Moving the Window

- **Drag the header bar** (top section with "PAROKSH" title) to move the window anywhere on screen
- The window can be moved to any corner or position
- Position is automatically saved and restored on reload

### Resizing the Window

- **Drag any edge** to resize width or height
- **Drag any corner** to resize both width and height simultaneously
- Size range: 300×400px (minimum) to 700×900px (maximum)
- A visual indicator shows when resizing

### Window Controls (top-right of header)

| Button | Action |
|--------|--------|
| `ー` (Minimize) | Collapses to a floating "AI" pill at the bottom-right |
| `□` (Maximize) | Expands the window to fill the viewport |
| `×` (Close) | Closes the window (floating pill remains for reopening) |
| Theme Toggle | Switches between light/dark/system themes |

### Reopening the Window

When minimized or closed, a floating "AI" pill appears at the bottom-right corner. Click it to reopen the chat window.

**Keyboard shortcut:** Press `Ctrl/Cmd + Shift + I` to toggle the window.

## Using the AI Agent

### Demo Flows

Click any suggestion chip on the empty state to start a demo flow:

1. **What can you do?** → Laptop Search flow
   - Finds and compares gaming laptops
   - Shows prices, specs, ratings, and source links

2. **Help me with my writing** → Research flow
   - Multi-source research on AI agent technology
   - Structured summary with sources

3. **Help me make a decision** → Form Filling flow
   - Auto-fills a job application form
   - **Pauses for your confirmation** before submitting
   - Demonstrates human-in-the-loop workflow

### Agent Execution Panel

When a task is running, you'll see:
- **Completed steps** (green checkmarks)
- **Current step** (blue spinner with status)
- **Pending steps** (hollow circles)
- **Progress bar** showing completion percentage
- **Pause** and **Stop** buttons for control

### Confirmation Dialog

Appears for sensitive actions (form submission):
- Yellow warning card with details
- **Cancel** or **Approve** options
- Review all details before approving

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Shift + I` | Toggle chat window |
| `Enter` | Send message |
| `Shift + Enter` | New line in input |

## Browser Extension Mode

The content script (`content/content-script.js`) injects the chat window into **any webpage**. It uses an iframe pointing to the app URL.

### Loading as an Extension

1. Build the app: `npm run build`
2. Go to `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked" → select the `public/` directory
5. Click the extension icon → "Open Chat Window"

### Configuration

Update `content/content-script.js`:
- Change `APP_URL` to your deployed app URL (e.g., `https://paroksh.ai`)
- Add domains to `autoOpenDomains` for auto-open behavior

## Tips

1. **Drag the header** — Don't try to drag from the content area
2. **Resize from corners** — Easiest way to adjust both dimensions at once
3. **Maximize for full view** — Great for reading long research summaries
4. **Try different sizes** — The layout adapts to window width
5. **Watch the typing indicator** — Dotted animation shows when the agent is thinking

## Troubleshooting

**Window not appearing?**
- Ensure the dev server is running on port 3002
- Check browser console for errors
- Try the floating "AI" pill at the bottom-right

**Window stuck or invisible?**
- Click the extension icon in your browser toolbar
- Or press `Ctrl/Cmd + Shift + I`

**Size/position reset?**
- Clear browser localStorage for this site
- The window resets to defaults: 420×640 at bottom-right

---

*PAROKSH - Your AI Browser Agent that floats on any webpage*
