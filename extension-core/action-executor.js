// action-executor.js
// Runs in the page's content-script world. Contains ALL DOM manipulation
// logic. Never evaluates any string from the model as code — it only reads
// specific, type-checked fields (target, text, value, direction, amount,
// x, y) and maps them to real DOM API calls.

(function () {
  const CLICKABLE_SELECTOR =
    'button, [role="button"], input[type="submit"], input[type="button"], a, [onclick]';
  const TYPABLE_SELECTOR =
    'input:not([type="hidden"]), textarea, [contenteditable="true"]';
  const SELECT_SELECTOR = "select";

  function normalize(text) {
    return String(text || "")
      .trim()
      .toLowerCase();
  }

  function normalizeStrict(text) {
    // strips everything except letters/numbers for a looser "normalized exact" match
    return normalize(text).replace(/[^a-z0-9]/g, "");
  }

  function candidateLabelsForClickable(el) {
    return [
      el.innerText,
      el.getAttribute && el.getAttribute("aria-label"),
      el.getAttribute && el.getAttribute("title"),
      el.id,
      el.getAttribute && el.getAttribute("name"),
      el.value
    ].filter(Boolean);
  }

  function labelForFormField(el) {
    const labels = [];
    if (el.placeholder) labels.push(el.placeholder);
    const ariaLabel = el.getAttribute && el.getAttribute("aria-label");
    if (ariaLabel) labels.push(ariaLabel);
    if (el.name) labels.push(el.name);
    if (el.id) labels.push(el.id);

    // <label for="id">Text</label>
    if (el.id) {
      const forLabel = document.querySelector(`label[for="${cssEscape(el.id)}"]`);
      if (forLabel && forLabel.innerText) labels.push(forLabel.innerText);
    }

    // <label>Text <input></label>
    const parentLabel = el.closest && el.closest("label");
    if (parentLabel && parentLabel.innerText) labels.push(parentLabel.innerText);

    return labels;
  }

  function cssEscape(value) {
    if (window.CSS && CSS.escape) return CSS.escape(value);
    return String(value).replace(/[^a-zA-Z0-9_-]/g, "\\$&");
  }

  /**
   * Finds the best-matching element among `candidates` for `target`, using
   * a 3-tier strategy: exact match -> normalized exact match -> partial
   * match. `getLabels(el)` returns the list of candidate text strings for
   * an element.
   */
  function findBestMatch(candidates, target, getLabels) {
    const targetNorm = normalize(target);
    const targetStrict = normalizeStrict(target);

    // Tier 1: exact (case-insensitive, trimmed) match
    for (const el of candidates) {
      if (getLabels(el).some((label) => normalize(label) === targetNorm)) {
        return el;
      }
    }

    // Tier 2: normalized exact match (ignoring punctuation/spacing)
    for (const el of candidates) {
      if (
        getLabels(el).some((label) => normalizeStrict(label) === targetStrict)
      ) {
        return el;
      }
    }

    // Tier 3: partial / substring match
    for (const el of candidates) {
      if (
        getLabels(el).some(
          (label) =>
            normalize(label).includes(targetNorm) ||
            targetNorm.includes(normalize(label))
        )
      ) {
        return el;
      }
    }

    return null;
  }

  /**
   * Like document.querySelectorAll, but also descends into OPEN shadow
   * roots. Many modern sites (YouTube's ytd-* components, various design
   * systems) render real buttons/inputs inside shadow DOM, which plain
   * querySelectorAll cannot see. Closed shadow roots are not accessible
   * from a content script and remain a genuine limitation (see README).
   */
  function deepQuerySelectorAll(selector, root = document) {
    const results = Array.from(root.querySelectorAll(selector));
    const allElements = root.querySelectorAll("*");
    for (const el of allElements) {
      if (el.shadowRoot) {
        results.push(...deepQuerySelectorAll(selector, el.shadowRoot));
      }
    }
    return results;
  }

  function isVisible(el) {
    if (!el || !(el instanceof Element)) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return false;
    const style = window.getComputedStyle(el);
    return style.visibility !== "hidden" && style.display !== "none";
  }

  function elementAtCoordinates(x, y) {
    if (typeof x !== "number" || typeof y !== "number") return null;
    const el = document.elementFromPoint(x, y);
    return el || null;
  }

  // ---------------------------------------------------------------------
  // CLICK
  // ---------------------------------------------------------------------
  function doClick(action) {
    const candidates = deepQuerySelectorAll(CLICKABLE_SELECTOR).filter(isVisible);

    let el = findBestMatch(candidates, action.target, candidateLabelsForClickable);

    if (!el) {
      el = elementAtCoordinates(action.x, action.y);
    }

    if (!el) {
      throw new Error(`Could not find "${action.target}"`);
    }

    el.scrollIntoView({ block: "center", behavior: "auto" });
    el.click();
    return `Clicked "${action.target}"`;
  }

  // ---------------------------------------------------------------------
  // TYPE
  // ---------------------------------------------------------------------
  function setNativeValue(element, value) {
    const proto =
      element.tagName === "TEXTAREA"
        ? window.HTMLTextAreaElement.prototype
        : window.HTMLInputElement.prototype;
    const descriptor = Object.getOwnPropertyDescriptor(proto, "value");
    if (descriptor && descriptor.set) {
      descriptor.set.call(element, value);
    } else {
      element.value = value;
    }
  }

  function doType(action) {
    const candidates = deepQuerySelectorAll(TYPABLE_SELECTOR).filter(isVisible);

    let el = findBestMatch(candidates, action.target, labelForFormField);

    if (!el) {
      const atPoint = elementAtCoordinates(action.x, action.y);
      if (atPoint && atPoint.matches(TYPABLE_SELECTOR)) el = atPoint;
    }

    if (!el) {
      throw new Error(`Could not find field "${action.target}"`);
    }

    if (el.tagName === "INPUT" && el.type === "password") {
      throw new Error(
        "Typing into password fields is disabled in this prototype."
      );
    }

    el.scrollIntoView({ block: "center", behavior: "auto" });
    el.focus();

    if (el.isContentEditable) {
      el.textContent = action.text;
    } else {
      setNativeValue(el, action.text);
    }

    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));

    return `Typed "${action.text}" into "${action.target}"`;
  }

  // ---------------------------------------------------------------------
  // SCROLL
  // ---------------------------------------------------------------------
  function isWindowScrollable() {
    const el = document.scrollingElement || document.documentElement;
    return el.scrollHeight > el.clientHeight + 10;
  }

  function findInnerScrollableContainer() {
    const all = deepQuerySelectorAll("*");
    let best = null;
    let bestArea = 0;

    for (const el of all) {
      const style = window.getComputedStyle(el);
      const overflowY = style.overflowY;
      const canScroll =
        (overflowY === "auto" || overflowY === "scroll") &&
        el.scrollHeight > el.clientHeight + 10;

      if (!canScroll) continue;

      const rect = el.getBoundingClientRect();
      const area = rect.width * rect.height;
      // Prefer the largest visible scrollable region - usually the main
      // content pane rather than a small sidebar/menu.
      if (area > bestArea) {
        best = el;
        bestArea = area;
      }
    }

    return best;
  }

  function doScroll(action) {
    const amount = action.amount || 500;
    const delta = action.direction === "up" ? -amount : amount;

    if (isWindowScrollable()) {
      window.scrollBy({ top: delta, left: 0, behavior: "auto" });
      return `Scrolled ${action.direction} ${amount}px`;
    }

    const container = findInnerScrollableContainer();
    if (container) {
      container.scrollBy({ top: delta, left: 0, behavior: "auto" });
      return `Scrolled ${action.direction} ${amount}px (inner panel)`;
    }

    throw new Error("Could not find a scrollable area on this page.");
  }

  // ---------------------------------------------------------------------
  // SELECT (native <select> only, per Phase 1 scope)
  // ---------------------------------------------------------------------
  function labelForSelect(el) {
    const labels = [];
    const ariaLabel = el.getAttribute && el.getAttribute("aria-label");
    if (ariaLabel) labels.push(ariaLabel);
    if (el.name) labels.push(el.name);
    if (el.id) labels.push(el.id);
    if (el.id) {
      const forLabel = document.querySelector(`label[for="${cssEscape(el.id)}"]`);
      if (forLabel && forLabel.innerText) labels.push(forLabel.innerText);
    }
    const parentLabel = el.closest && el.closest("label");
    if (parentLabel && parentLabel.innerText) labels.push(parentLabel.innerText);
    return labels;
  }

  function doSelect(action) {
    const candidates = deepQuerySelectorAll(SELECT_SELECTOR).filter(isVisible);

    let selectEl = findBestMatch(candidates, action.target, labelForSelect);

    if (!selectEl) {
      const atPoint = elementAtCoordinates(action.x, action.y);
      if (atPoint) selectEl = atPoint.closest("select");
    }

    if (!selectEl) {
      throw new Error(`Could not find dropdown "${action.target}"`);
    }

    const options = Array.from(selectEl.options);
    const valueNorm = normalize(action.value);
    const valueStrict = normalizeStrict(action.value);

    let option =
      options.find((o) => normalize(o.text) === valueNorm) ||
      options.find((o) => normalize(o.value) === valueNorm) ||
      options.find((o) => normalizeStrict(o.text) === valueStrict) ||
      options.find((o) => normalize(o.text).includes(valueNorm));

    if (!option) {
      throw new Error(
        `Could not find option "${action.value}" in "${action.target}"`
      );
    }

    selectEl.scrollIntoView({ block: "center", behavior: "auto" });
    selectEl.value = option.value;
    selectEl.dispatchEvent(new Event("input", { bubbles: true }));
    selectEl.dispatchEvent(new Event("change", { bubbles: true }));

    return `Selected "${option.text.trim()}" in "${action.target}"`;
  }

  // ---------------------------------------------------------------------
  // Public entry point
  // ---------------------------------------------------------------------
  function execute(action) {
    switch (action.action) {
      case "CLICK":
        return doClick(action);
      case "TYPE":
        return doType(action);
      case "SCROLL":
        return doScroll(action);
      case "SELECT":
        return doSelect(action);
      default:
        throw new Error(`Unsupported action type: ${action.action}`);
    }
  }

  window.AIAgentExecutor = { execute };
})();
