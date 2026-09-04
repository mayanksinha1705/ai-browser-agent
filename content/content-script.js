/**
 * PAROKSH Content Script
 *
 * Injects a floating, draggable, resizable AI chat window into any webpage.
 * The chat window loads the React/Next.js app via an iframe overlay.
 *
 * In development, the iframe points to http://localhost:3002
 * In production, update APP_URL to point to your deployed extension web app.
 */
(() => {
  const APP_URL = 'http://localhost:3002';

  let iframeContainer = null;
  let isOpen = false;

  function createIframeContainer() {
    const container = document.createElement('div');
    container.id = 'paroksh-agent-container';
    container.style.cssText = `
      position: fixed !important;
      bottom: 24px !important;
      right: 24px !important;
      width: 420px !important;
      height: 640px !important;
      z-index: 999999 !important;
      pointer-events: none !important;
    `;

    const iframe = document.createElement('iframe');
    iframe.id = 'paroksh-agent-iframe';
    iframe.src = APP_URL + '/?embed=extension';
    iframe.style.cssText = `
      width: 100% !important;
      height: 100% !important;
      border: none !important;
      border-radius: 16px !important;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
      pointer-events: auto !important;
    `;

    container.appendChild(iframe);
    document.body.appendChild(container);

    return container;
  }

  function toggleChat() {
    if (!isOpen) {
      iframeContainer = createIframeContainer();
      isOpen = true;
    } else {
      if (iframeContainer && iframeContainer.parentNode) {
        iframeContainer.parentNode.removeChild(iframeContainer);
      }
      isOpen = false;
    }
  }

  // Check if already injected
  if (document.getElementById('paroksh-agent-container')) {
    return;
  }

  // Listen for toggle messages from the popup or keyboard shortcut
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'toggleChat') {
      toggleChat();
      sendResponse({ isOpen });
    }
    if (request.action === 'openChat') {
      if (!isOpen) toggleChat();
      sendResponse({ isOpen: true });
    }
    if (request.action === 'closeChat') {
      if (isOpen) toggleChat();
      sendResponse({ isOpen: false });
    }
  });

  // Listen for postMessage from the iframe (for position/size sync)
  window.addEventListener('message', (event) => {
    if (event.data?.source === 'paroksh-agent') {
      if (event.data.action === 'resize-to') {
        if (iframeContainer) {
          iframeContainer.style.width = event.data.width + 'px';
          iframeContainer.style.height = event.data.height + 'px';
        }
      }
      if (event.data.action === 'move-to') {
        if (iframeContainer) {
          iframeContainer.style.bottom = event.data.bottom + 'px';
          iframeContainer.style.right = event.data.right + 'px';
        }
      }
    }
  });

  // Auto-open on specific domains (configurable)
  const currentUrl = window.location.href;
  const autoOpenDomains = [];

  // Optional: Auto-open based on domain rules
  // autoOpenDomains.forEach(domain => {
  //   if (currentUrl.includes(domain)) {
  //     setTimeout(toggleChat, 1000);
  //   }
  // });

  // Keyboard shortcut: Ctrl/Cmd + Shift + I to toggle
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'i') {
      e.preventDefault();
      toggleChat();
    }
  });

  console.log('[PAROKSH] Content script loaded. Press Ctrl/Cmd+Shift+I to toggle chat.');
})();
