// background.js
// Orchestrator for Phase 1. This is the ONLY file that decides what actually
// happens in the browser. Gemma's output is treated as untrusted data and
// must pass validateAction() before anything is executed.

import { getActionFromGemma } from "../ollama/ollama.js";

const ALLOWED_ACTIONS = ["CLICK", "TYPE", "SCROLL", "SELECT", "NAVIGATE", "ERROR"];
const UNSUPPORTED_URL_PREFIXES = [
  "chrome://",
  "chrome-extension://",
  "edge://",
  "about:",
  "devtools://",
  "chrome-search://",
  "https://chrome.google.com/webstore"
];

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.type === "EXECUTE_INSTRUCTION") {
    handleInstruction(message.instruction)
      .then((result) => sendResponse(result))
      .catch((err) =>
        sendResponse({ success: false, message: err.message || String(err) })
      );
    return true; // keep the message channel open for the async response
  }
  return false;
});

async function handleInstruction(instruction) {
  // 1. Find the active tab in the current window.
  const tab = await getActiveTab();

  if (!tab || !tab.id) {
    throw new Error("Could not find the active browser tab.");
  }

  if (!isSupportedUrl(tab.url)) {
    throw new Error(
      "This page is a browser-internal page and cannot be automated (try a normal http/https page)."
    );
  }

  // 2. Capture a screenshot of only the visible area of the active tab.
  const screenshotDataUrl = await captureScreenshot(tab.windowId);
  const base64Image = screenshotDataUrl.split(",")[1];

  // 3. Ask Gemma (via Ollama) which action to take.
  const rawAction = await getActionFromGemma(instruction, base64Image);

  // 4. Validate the model's output before trusting any of it.
  const action = validateAction(rawAction);

  if (action.action === "ERROR") {
    throw new Error(action.reason || "Gemma could not determine an action.");
  }

  // 5. Execute.
  if (action.action === "NAVIGATE") {
    return executeNavigate(tab.id, action);
  }

  return executeViaContentScript(tab.id, action);
}

// ---------------------------------------------------------------------------
// Tab / screenshot helpers
// ---------------------------------------------------------------------------

function getActiveTab() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(tabs && tabs[0]);
    });
  });
}

function isSupportedUrl(url) {
  if (!url) return false;
  return !UNSUPPORTED_URL_PREFIXES.some((prefix) => url.startsWith(prefix));
}

function captureScreenshot(windowId) {
  return new Promise((resolve, reject) => {
    chrome.tabs.captureVisibleTab(windowId, { format: "png" }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        reject(
          new Error(
            "Screenshot capture failed: " + chrome.runtime.lastError.message
          )
        );
        return;
      }
      if (!dataUrl) {
        reject(new Error("Screenshot capture returned no data."));
        return;
      }
      resolve(dataUrl);
    });
  });
}

// ---------------------------------------------------------------------------
// Command validation layer
// The model's output is UNTRUSTED. We never eval() it, never execute
// arbitrary code from it, and only pass through known, type-checked fields.
// ---------------------------------------------------------------------------

function validateAction(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Gemma returned an invalid action (not a JSON object).");
  }

  const action = raw.action;
  if (typeof action !== "string" || !ALLOWED_ACTIONS.includes(action)) {
    throw new Error(
      "Gemma returned an invalid action" +
        (typeof action === "string" ? `: "${action}"` : ".")
    );
  }

  switch (action) {
    case "CLICK": {
      requireString(raw, "target");
      return {
        action: "CLICK",
        target: raw.target.trim(),
        x: toFiniteNumberOrNull(raw.x),
        y: toFiniteNumberOrNull(raw.y),
        confidence: toFiniteNumberOrNull(raw.confidence)
      };
    }

    case "TYPE": {
      requireString(raw, "target");
      requireString(raw, "text");
      return {
        action: "TYPE",
        target: raw.target.trim(),
        text: raw.text,
        x: toFiniteNumberOrNull(raw.x),
        y: toFiniteNumberOrNull(raw.y),
        confidence: toFiniteNumberOrNull(raw.confidence)
      };
    }

    case "SCROLL": {
      const direction = raw.direction;
      if (direction !== "up" && direction !== "down") {
        throw new Error('SCROLL action must have direction "up" or "down".');
      }
      let amount = toFiniteNumberOrNull(raw.amount);
      if (amount === null || amount <= 0) amount = 500;
      return { action: "SCROLL", direction, amount };
    }

    case "SELECT": {
      requireString(raw, "target");
      requireString(raw, "value");
      return {
        action: "SELECT",
        target: raw.target.trim(),
        value: raw.value.trim(),
        x: toFiniteNumberOrNull(raw.x),
        y: toFiniteNumberOrNull(raw.y),
        confidence: toFiniteNumberOrNull(raw.confidence)
      };
    }

    case "NAVIGATE": {
      requireString(raw, "url");
      const url = sanitizeUrl(raw.url.trim());
      return { action: "NAVIGATE", url };
    }

    case "ERROR": {
      return {
        action: "ERROR",
        reason:
          typeof raw.reason === "string"
            ? raw.reason
            : "Unable to determine requested action"
      };
    }

    default:
      // Unreachable due to the ALLOWED_ACTIONS check above.
      throw new Error("Gemma returned an invalid action.");
  }
}

function requireString(obj, field) {
  if (typeof obj[field] !== "string" || obj[field].trim() === "") {
    throw new Error(`Gemma's ${obj.action} action is missing a valid "${field}".`);
  }
}

function toFiniteNumberOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function sanitizeUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch (_) {
    throw new Error(`Gemma returned an invalid URL: "${url}"`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(
      `Blocked unsafe URL scheme "${parsed.protocol}". Only http/https are allowed.`
    );
  }
  return parsed.href;
}

// ---------------------------------------------------------------------------
// Execution
// ---------------------------------------------------------------------------

function executeNavigate(tabId, action) {
  return new Promise((resolve, reject) => {
    chrome.tabs.update(tabId, { url: action.url }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error("Navigation failed: " + chrome.runtime.lastError.message));
        return;
      }
      resolve({ success: true, message: `Navigated to ${action.url}` });
    });
  });
}

function executeViaContentScript(tabId, action) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(
      tabId,
      { type: "EXECUTE_ACTION", action },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(
            new Error(
              "Could not reach the page (try reloading the tab): " +
                chrome.runtime.lastError.message
            )
          );
          return;
        }
        if (!response) {
          reject(new Error("No response from the page's content script."));
          return;
        }
        if (response.success) {
          resolve({ success: true, message: response.message });
        } else {
          reject(new Error(response.message || "Action failed on the page."));
        }
      }
    );
  });
}
