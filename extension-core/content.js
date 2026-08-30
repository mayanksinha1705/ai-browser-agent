// content.js
// Thin message bridge between the background service worker and
// action-executor.js (loaded just before this file, exposes
// window.AIAgentExecutor). Contains no DOM logic of its own.

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.type === "EXECUTE_ACTION") {
    try {
      if (!window.AIAgentExecutor) {
        throw new Error("Action executor not loaded on this page.");
      }
      const resultMessage = window.AIAgentExecutor.execute(message.action);
      sendResponse({ success: true, message: resultMessage });
    } catch (err) {
      sendResponse({ success: false, message: err.message || String(err) });
    }
    return true;
  }
  return false;
});
