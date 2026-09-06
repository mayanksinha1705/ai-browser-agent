// PAROKSH Content Script
// ONLY handles webpage interaction - does NOT render any UI
(function() {
  'use strict';

  function getPageSummary() {
    var title = document.title || '';
    var desc = document.querySelector('meta[name="description"]');
    var description = desc ? desc.content : '';
    var h1el = document.querySelector('h1');
    var h1 = h1el ? h1el.textContent : '';
    var body = document.body;
    var bodyText = body ? body.innerText.substring(0, 500) : '';
    var summary = 'Page: ' + title;
    if (h1) summary += ' | Heading: ' + h1;
    if (description) summary += ' | ' + description;
    return { summary: summary, title: title, url: window.location.href };
  }

  function getPageContent() {
    var body = document.body;
    var content = body ? body.innerText : '';
    return { content: content.substring(0, 5000) };
  }

  function scrollPage(direction) {
    if (direction === 'up') {
      window.scrollBy({ top: -500, behavior: 'smooth' });
    } else {
      window.scrollBy({ top: 500, behavior: 'smooth' });
    }
    return { ok: true, message: 'Scrolled ' + direction };
  }

  function clickElement(description) {
    var lower = description.toLowerCase();
    var clickables = document.querySelectorAll('a, button, [role="button"], input[type="submit"]');
    for (var i = 0; i < clickables.length; i++) {
      var el = clickables[i];
      var text = (el.textContent || el.value || el.title || '').toLowerCase();
      if (text.indexOf(lower) !== -1 || lower.indexOf(text) !== -1) {
        el.click();
        return { ok: true, message: 'Clicked: ' + text };
      }
    }
    return { ok: false, error: 'No matching element found' };
  }

  function searchOnPage(query) {
    var inputs = document.querySelectorAll('input[type="search"], input[name*="search"], input');
    for (var i = 0; i < inputs.length; i++) {
      var input = inputs[i];
      if (input.offsetParent !== null) {
        input.value = query;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        var form = input.closest('form');
        if (form) { form.submit(); return { ok: true, message: 'Searched: ' + query }; }
        return { ok: true, message: 'Entered: ' + query };
      }
    }
    return { ok: false, error: 'No search input found' };
  }

  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (!message || !message.type) return false;
    if (message.type === 'paroksh/ping') { sendResponse({ ok: true }); return false; }
    if (message.type === 'paroksh/action') {
      var action = message.action;
      if (action === 'summarize') sendResponse(getPageSummary());
      else if (action === 'readContent') sendResponse(getPageContent());
      else if (action === 'scroll') sendResponse(scrollPage(message.direction || 'down'));
      else if (action === 'click') sendResponse(clickElement(message.description || ''));
      else if (action === 'search') sendResponse(searchOnPage(message.query || ''));
      else sendResponse({ ok: false, error: 'Unknown action' });
      return false;
    }
    return false;
  });
})();