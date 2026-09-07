// PAROKSH Content Script
// -------------------------------------------------------------------
// The content script owns the floating window chrome: a draggable
// header bar ("PAROKSH AI") plus resizable edges/corner nub. It hosts
// the chat UI in an iframe that fills the window below the header。
//
//  - DRAG   : hold the header bar and move anywhere on the page
//  - RESIZE : drag the bottom edge, right edge,or corner nub
//  - Position & size are remembered per browser (chrome.storage)
// -------------------------------------------------------------------

(() => {
  if (window.__parokshContentInjected) return;
  window.__parokshContentInjected = true;

  const APP_URL = 'http://localhost:3002';
  const EDGE_PAD = 12;
  const HEADER_H = 40;
  const DEFAULT_W = 400;
  const DEFAULT_H = 560;
  const MIN_W = 300;
  const MIN_H = 380;

  const MAX_W = () => Math.max(MIN_W, window.innerWidth - EDGE_PAD * 2);
  const MAX_H = () => Math.max(MIN_H, window.innerHeight - EDGE_PAD * 2);

  let host = null;
  let iframe = null;

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
  function setStyle(el, obj) { Object.assign(el.style, obj); }

  function makeHeader() {
    const bar = document.createElement('div');
    bar.id = 'paroksh-header';
    bar.setAttribute('title', 'Drag to move');
    setStyle(bar, {
      height: HEADER_H + 'px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 6px 0 14px',
      cursor: 'grab',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      background: 'hsl(240, 10%, 5%)',
      color: '#fff',
      fontSize: '13px',
      fontWeight: '600',
      letterSpacing: '0.3px',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      boxSizing: 'border-box',
      flexShrink: '0',
    });

    const brand = document.createElement('div');
    brand.style.display = 'flex';
    brand.style.alignItems = 'center';
    brand.style.gap = '7px';
    brand.innerHTML = '<span style="font-size:14px">✨</span><span>PAROKSH AI</span>';
    bar.appendChild(brand);

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.textContent = '×';
    closeBtn.title = 'Close';
    setStyle(closeBtn, {
      border: 'none',
      background: 'transparent',
      color: 'inherit',
      fontSize: '18px',
      lineHeight: '1',
      width: '28px',
      height: '28px',
      borderRadius: '6px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    });
    closeBtn.addEventListener('mouseenter', () => { closeBtn.style.background = 'rgba(128,128,128,0.25)'; });
    closeBtn.addEventListener('mouseleave', () => { closeBtn.style.background = 'transparent'; });
    closeBtn.addEventListener('click', (e) => { e.stopPropagation(); hide(); });
    bar.appendChild(closeBtn);

    bar.addEventListener('mousedown', (e) => {
      if (e.target === closeBtn) return;
      startDrag(e);
    });

    return bar;
  }

  function makeResizeHandles(container) {
    const mk = (dir, styleProps, hoverProps, title) => {
      const el = document.createElement('div');
      el.style.position = 'absolute';
      setStyle(el, styleProps);
      el.style.transition = 'background 0.15s';
      el.addEventListener('mouseenter', () => { if (hoverProps) setStyle(el, hoverProps); });
      el.addEventListener('mouseleave', () => { setStyle(el, styleProps); });
      if (title) el.title = title;
      el.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        startResize(e, dir);
      });
      container.appendChild(el);
      return el;
    };

    mk('s', {
      left: '0',
      right: '20px',
      bottom: '0',
      height: '8px',
      cursor: 'ns-resize',
      background: 'rgba(255,255,255,0.06)',
    }, { background: 'rgba(96,165,250,0.35)' }, 'Resize (drag)');

    mk('e', {
      top: HEADER_H + 'px',
      bottom: '20px',
      right: '0',
      width: '8px',
      cursor: 'ew-resize',
      background: 'rgba(255,255,255,0.06)',
    }, { background: 'rgba(96,165,250,0.35)' }, 'Resize (drag)');

    mk('se', {
      right: '0',
      bottom: '0',
      width: '18px',
      height: '18px',
      cursor: 'nwse-resize',
      background: 'linear-gradient(135deg, transparent 50%, rgba(255,255,255,0.45) 50%)',
    }, null, 'Resize (drag)');
  }

  function startDrag(e) {
    e.preventDefault();
    if (iframe) iframe.style.pointerEvents = 'none';
    const startX = e.clientX, startY = e.clientY;
    const startLeft = parseFloat(host.style.left) || EDGE_PAD;
    const startTop = parseFloat(host.style.top) || EDGE_PAD;

    const onMove = (ev) => {
      const nx = clamp(startLeft + (ev.clientX - startX), EDGE_PAD, window.innerWidth - host.offsetWidth - EDGE_PAD);
      const ny = clamp(startTop + (ev.clientY - startY), EDGE_PAD, window.innerHeight - host.offsetHeight - EDGE_PAD);
      host.style.left = nx + 'px';
      host.style.top = ny + 'px';
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      saveState();
      if (iframe) iframe.style.pointerEvents = 'auto';
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  function startResize(e, mode) {
    e.preventDefault();
    if (iframe) iframe.style.pointerEvents = 'none';
    const startX = e.clientX, startY = e.clientY;
    const startW = host.offsetWidth, startH = host.offsetHeight;
    const maxW = MAX_W(), maxH = MAX_H();

    const onMove = (ev) => {
      const dx = ev.clientX - startX, dy = ev.clientY - startY;
      let w = startW, h = startH;
      if (mode === 'e') w = clamp(startW + dx, MIN_W, maxW);
      else if (mode === 's') h = clamp(startH + dy, MIN_H, maxH);
      else if (mode === 'se') {
        w = clamp(startW + dx, MIN_W, maxW);
        h = clamp(startH + dy, MIN_H, maxH);
      }
      host.style.width = w + 'px';
      host.style.height = h + 'px';
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      saveState();
      if (iframe) iframe.style.pointerEvents = 'auto';
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  function ensureMounted() {
    if (host && document.body.contains(host)) return;

    if (!document.getElementById('paroksh-style')) {
      const style = document.createElement('style');
      style.id = 'paroksh-style';
      style.textContent = `\n        #paroksh-host { all: initial; position: fixed; display: flex; flex-direction: column; overflow: hidden; }\n        #paroksh-host * { box-sizing: border-box; }\n        #paroksh-frame { color-scheme: normal; }\n      `;
      (document.head || document.documentElement).appendChild(style);
    }

    host = document.createElement('div');
    host.id = 'paroksh-host';
    setStyle(host, {
      position: 'fixed',
      left: (window.innerWidth - DEFAULT_W - EDGE_PAD) + 'px',
      top: (window.innerHeight - DEFAULT_H - EDGE_PAD) + 'px',
      width: DEFAULT_W + 'px',
      height: DEFAULT_H + 'px',
      zIndex: '2147483647',
      borderRadius: '14px',
      border: '1px solid rgba(255,255,255,0.12)',
      boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
      background: 'hsl(240, 10%, 5%)',
      display: 'none',
    });

    host.appendChild(makeHeader());
    makeResizeHandles(host);

    iframe = document.createElement('iframe');
    iframe.id = 'paroksh-frame';
    iframe.src = APP_URL + '?embed=extension';
    iframe.allow = 'microphone; camera';
    setStyle(iframe, {
      width: '100%',
      flex: '1',
      border: '0',
      display: 'block',
      background: 'transparent',
    });
    host.appendChild(iframe);
    document.body.appendChild(host);
  }

  function applyState(restored) {
    if (!host || !restored) return;
    const w = clamp(restored.width || DEFAULT_W, MIN_W, MAX_W());
    const h = clamp(restored.height || DEFAULT_H, MIN_H, MAX_H());
    const maxX = window.innerWidth - w - EDGE_PAD;
    const maxY = window.innerHeight - h - EDGE_PAD;
    host.style.left = clamp((restored.left != null ? restored.left: window.innerWidth - w - EDGE_PAD), EDGE_PAD, Math.max(EDGE_PAD, maxX)) + 'px';
    host.style.top = clamp((restored.top != null ? restored.top: window.innerHeight - h - EDGE_PAD), EDGE_PAD, Math.max(EDGE_PAD, maxY)) + 'px';
    host.style.width = w + 'px';
    host.style.height = h + 'px';
  }

  function saveState() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.set({
          paroksh_window_state: {
            left: parseFloat(host.style.left) || EDGE_PAD,
            top: parseFloat(host.style.top) || EDGE_PAD,
            width: host.offsetWidth,
            height: host.offsetHeight,
          },
        });
      }
    } catch (e) { /* storage unavailable */ }
  }

  function loadState(cb) {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        chrome.storage.local.get('paroksh_window_state', function (r) {
          if (chrome.runtime?.lastError) { cb(null); return; }
          cb(r && r.paroksh_window_state ? r.paroksh_window_state : null);
        });
        return;
      }
    } catch (e) { /* fall through */ }
    cb(null);
  }

  function show() {
    ensureMounted();
    if (!host) return;
    loadState(function (st) { applyState(st); host.style.display = 'flex'; saveState(); });
  }

  function hide() { if (host) host.style.display = 'none'; }
  function toggle() {
    if (host && host.style.display === 'flex') { hide(); return false; }
    show();
    return true;
  }

  // Theme sync: the embedded app posts its resolved theme so the window
  // chrome (header bar, frame background, corner grip) matches light/dark.
  function applyChromeTheme(theme) {
    if (!host) return;
    const dark = theme !== 'light';
    const bg = dark ? 'hsl(240, 10%, 5%)' : 'hsl(0, 0%, 100%)';
    const fg = dark ? '#ffffff' : 'hsl(240, 10%, 3.9%)';
    const line = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
    host.style.background = bg;
    const bar = document.getElementById('paroksh-header');
    if (bar) {
      bar.style.background = bg;
      bar.style.color = fg;
      bar.style.borderBottom = '1px solid ' + line;
    }
    const corner = host.querySelector('[style*="nwse-resize"]');
    if (corner) {
      corner.style.background = dark
        ? 'linear-gradient(135deg, transparent 50%, rgba(255,255,255,0.45) 50%)'
        : 'linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.35) 50%)';
    }
  }

  window.addEventListener('message', (ev) => {
    if (!iframe || ev.source !== iframe.contentWindow) return;
    const data = ev.data;
    if (data && typeof data === 'object' && data.type === 'paroksh/theme') {
      applyChromeTheme(data.theme);
    }
  });

  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((msg,_sender,sendResponse) => {
      if (!msg || typeof msg !== 'object') return false;
      if (msg.type === 'paroksh/toggle') { const visible = toggle(); sendResponse({ ok: true, visible }); return false; }
      if (msg.type === 'paroksh/show') { show(); sendResponse({ ok: true }); return false; }
      if (msg.type === 'paroksh/hide') { hide(); sendResponse({ ok: true }); return false; }
      if (msg.type === 'paroksh/ping') { sendResponse({ ok: true, visible: host ? host.style.display === 'flex' : false }); return false; }
      return false;
    });
  }

  // Auto-show on load so someone sees the panel immediately.
  ensureMounted();
  show();
})();