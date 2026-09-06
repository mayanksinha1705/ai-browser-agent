// PAROKSH Background Service Worker
// Creates + manages the separate PAROKSH popup window, tracks the real
// active tab across all browser windows, and routes messages to content scripts.

const PAROKSH_WINDOW_KEY = 'paroksh_window_id';
const PAROKSH_BOUNDS_KEY = 'paroksh_bounds';
const DEFAULT_WIDTH = 380;
const DEFAULT_HEIGHT = 600;
const MIN_WIDTH = 300;
const MIN_HEIGHT = 400;
const MAX_WIDTH = 1200;
const MAX_HEIGHT = 1000;

// Tracked "real" active tab (the one the user is looking at, not our popup).
let activeTabId = null;
let activeTabInfo = null;

function clamp(v, fallback, min, max) {
  if (typeof v !== 'number' || isNaN(v)) return fallback;
  return Math.min(max, Math.max(min, v));
}

function getBounds(cb) {
  chrome.storage.local.get(PAROKSH_BOUNDS_KEY, (r) => cb(r[PAROKSH_BOUNDS_KEY] || null));
}

function saveBounds(bounds) {
  if (!bounds || !bounds.width || !bounds.height) return;
  chrome.storage.local.set({
    [PAROKSH_BOUNDS_KEY]: {
      width: bounds.width,
      height: bounds.height,
      left: bounds.left,
      top: bounds.top,
      state: bounds.state || 'normal'
    }
  });
}

// ---- Window management ----
async function createOrFocusWindow() {
  const stored = await new Promise((resolve) => {
    chrome.storage.local.get([PAROKSH_WINDOW_KEY], (r) => resolve(r[PAROKSH_WINDOW_KEY]));
  });

  if (stored) {
    try {
      await chrome.windows.get(stored);
      await chrome.windows.update(stored, { focused: true });
      return;
    } catch (e) {
      await chrome.storage.local.remove(PAROKSH_WINDOW_KEY);
    }
  }

  const currentWin = await new Promise((resolve) => chrome.windows.getCurrent(resolve));
  const bounds = await new Promise((resolve) => getBounds(resolve));

  const width = clamp(bounds && bounds.width, DEFAULT_WIDTH, MIN_WIDTH, MAX_WIDTH);
  const height = clamp(bounds && bounds.height, DEFAULT_HEIGHT, MIN_HEIGHT, MAX_HEIGHT);

  const baseLeft = currentWin && currentWin.left != null ? currentWin.left : 0;
  const baseTop = currentWin && currentWin.top != null ? currentWin.top : 0;
  const baseWidth = currentWin && currentWin.width ? currentWin.width : 1440;

  const left = bounds && bounds.left != null ? bounds.left : Math.max(0, baseLeft + (baseWidth - width - 32));
  const top = bounds && bounds.top != null ? bounds.top : Math.max(0, baseTop + 32);

  const win = await chrome.windows.create({
    url: 'paroksh-app/index.html',
    type: 'popup',
    width: Math.round(width),
    height: Math.round(height),
    left: Math.round(left),
    top: Math.round(top)
  });

  await chrome.storage.local.set({ [PAROKSH_WINDOW_KEY]: win.id });
}

// ---- Active tab tracking ----
function broadcastActiveTab() {
  if (!activeTabInfo) return;
  chrome.runtime.sendMessage({
    type: 'paroksh/active-tab-changed',
    tab: { id: activeTabInfo.id, url: activeTabInfo.url, title: activeTabInfo.title }
  }).catch(() => {});
}

function trackTab(tab) {
  if (!tab) return;
  activeTabId = tab.id;
  activeTabInfo = { id: tab.id, url: tab.url, title: tab.title };
  broadcastActiveTab();
}

function isParokshWindow(windowId) {
  return new Promise((resolve) => {
    chrome.storage.local.get([PAROKSH_WINDOW_KEY], (r) => {
      resolve(r[PAROKSH_WINDOW_KEY] === windowId);
    });
  });
}

async function handleTabActivated(tabId, windowId) {
  if (windowId === chrome.windows.WINDOW_ID_NONE) return;
  if (await isParokshWindow(windowId)) return; // ignore our popup
  try {
    const tab = await chrome.tabs.get(tabId);
    trackTab(tab);
  } catch (e) {}
}

async function handleWindowFocus(windowId) {
  if (windowId === chrome.windows.WINDOW_ID_NONE) return;
  if (await isParokshWindow(windowId)) return; // popup focused - keep previous active tab
  chrome.tabs.query({ active: true, windowId }, (tabs) => {
    if (tabs && tabs.length > 0) trackTab(tabs[0]);
  });
}

// ---- Event listeners ----

// Extension icon clicked -> open/focus PAROKSH window
chrome.action.onClicked.addListener(() => {
  createOrFocusWindow();
});

// Track active tab changes
chrome.tabs.onActivated.addListener(({ tabId, windowId }) => {
  handleTabActivated(tabId, windowId);
});

// Track window focus changes (switching windows)
chrome.windows.onFocusChanged.addListener((windowId) => {
  handleWindowFocus(windowId);
});

// Track URL changes in tabs
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url && tabId === activeTabId) {
    if (activeTabInfo) activeTabInfo.url = changeInfo.url;
    broadcastActiveTab();
  }
});

// Track bounds changes to remember window size/position
if (chrome.windows.onBoundsChanged) {
  chrome.windows.onBoundsChanged.addListener((window) => {
    if (!window || window.type !== 'popup') return;
    saveBounds(window);
  });
}

// Window closed - clean up stored id
chrome.windows.onRemoved.addListener((windowId) => {
  chrome.storage.local.get([PAROKSH_WINDOW_KEY], (r) => {
    if (r[PAROKSH_WINDOW_KEY] === windowId) {
      chrome.storage.local.remove(PAROKSH_WINDOW_KEY);
    }
  });
});

// Resolve the active tab lazily at startup
chrome.runtime.onStartup.addListener(() => {
  chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
    if (tabs && tabs.length > 0) trackTab(tabs[0]);
  });
});

// ---- Message routing ----
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message !== 'object') return false;

  // PAROKSH window ready
  if (message.type === 'paroksh/window-ready') {
    if (message.windowId) {
      chrome.storage.local.set({ [PAROKSH_WINDOW_KEY]: message.windowId });
    }
    sendResponse({ ok: true });
    return false;
  }

  // PAROKSH window closed
  if (message.type === 'paroksh/window-closed') {
    chrome.storage.local.remove(PAROKSH_WINDOW_KEY);
    sendResponse({ ok: true });
    return false;
  }

  // Return the tracked active tab
  if (message.type === 'paroksh/get-active-tab') {
    const respond = (tab) => {
      if (tab && tab.id) {
        sendResponse({ ok: true, tab: { id: tab.id, url: tab.url, title: tab.title } });
      } else {
        sendResponse({ ok: false, error: 'No active tab found' });
      }
    };
    if (activeTabInfo && activeTabId != null) {
      respond(activeTabInfo);
    } else {
      chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
        const tab = tabs && tabs.length > 0 ? tabs[0] : null;
        if (tab && tab.id) trackTab(tab);
        respond(tab);
      });
    }
    return true;
  }

  // Forward an action payload to the tracked active tab's content script
  if (message.type === 'paroksh/send-to-tab') {
    const targetId = activeTabId;
    if (targetId == null) {
      sendResponse({ ok: false, error: 'No active tab tracked' });
      return false;
    }
    chrome.tabs.sendMessage(targetId, message.payload, (resp) => {
      if (chrome.runtime.lastError) {
        sendResponse({ ok: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse(resp || { ok: false, error: 'No response from page' });
      }
    });
    return true;
  }

  return false;
});