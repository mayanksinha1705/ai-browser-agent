// PAROKSH Browser Extension Window Application
(function () {
  'use strict';

  var state = {
    messages: [],
    isListening: false,
    recognition: null,
    activeTab: null,
    voiceRunning: false,
    isSpeaking: false
  };
  var el = {};

  var DEFAULT_W = 380;
  var DEFAULT_H = 600;

  function init() {
    el.chatForm = document.getElementById('chat-form');
    el.chatInput = document.getElementById('chat-input');
    el.btnSend = document.getElementById('btn-send');
    el.btnClose = document.getElementById('btn-close');
    el.btnNewChat = document.getElementById('btn-new-chat');
    el.btnImage = document.getElementById('btn-image');
    el.btnAttach = document.getElementById('btn-attach');
    el.btnMic = document.getElementById('btn-mic');
    el.btnSettings = document.getElementById('btn-settings');
    el.imageInput = document.getElementById('image-input');
    el.fileInput = document.getElementById('file-input');
    el.voiceOverlay = document.getElementById('voice-overlay');
    el.btnVoiceClose = document.getElementById('btn-voice-close');
    el.voiceStatus = document.getElementById('voice-status');
    el.voiceTranscript = document.getElementById('voice-transcript');
    el.voiceResponse = document.getElementById('voice-response');
    el.voiceOrb = document.getElementById('voice-orb');
    el.settingsMenu = document.getElementById('settings-menu');
    el.btnResetSize = document.getElementById('btn-reset-size');
    el.btnMaximize = document.getElementById('btn-maximize');
    el.btnTheme = document.getElementById('btn-theme');
    el.messagesList = document.getElementById('messages-list');
    el.emptyState = document.getElementById('empty-state');
    el.messages = document.getElementById('messages');

    el.chatForm.addEventListener('submit', handleSubmit);
    el.chatInput.addEventListener('input', handleInput);
    el.chatInput.addEventListener('keydown', handleKeyDown);
    el.btnClose.addEventListener('click', handleClose);
    el.btnNewChat.addEventListener('click', handleNewChat);
    el.btnImage.addEventListener('click', function () { el.imageInput.click(); });
    el.imageInput.addEventListener('change', handleImageUpload);
    el.btnAttach.addEventListener('click', function () { el.fileInput.click(); });
    el.fileInput.addEventListener('change', handleFileUpload);
    el.btnMic.addEventListener('click', toggleVoice);
    el.btnVoiceClose.addEventListener('click', exitVoiceMode);
    el.btnSettings.addEventListener('click', function (e) {
      e.stopPropagation();
      el.settingsMenu.classList.toggle('hidden');
    });
    el.btnResetSize.addEventListener('click', resetWindowSize);
    el.btnMaximize.addEventListener('click', maximizeWindow);
    el.btnTheme.addEventListener('click', toggleTheme);
    document.addEventListener('click', function () {
      if (!el.settingsMenu.classList.contains('hidden')) {
        el.settingsMenu.classList.add('hidden');
      }
    });
    el.settingsMenu.addEventListener('click', function (e) { e.stopPropagation(); });

    // Disable mic if speech recognition is unavailable
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      el.btnMic.disabled = true;
      el.btnMic.classList.add('disabled');
    }

    loadTheme();
    loadState();
    updateActiveTab();
    setupTabListener();
    chrome.runtime.sendMessage({ type: 'paroksh/window-ready' });
    saveBounds();
  }

  // ---------------- Input ----------------
  function handleInput(e) {
    var text = e.target.value.trim();
    el.btnSend.disabled = !text;
    var ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    var text = el.chatInput.value.trim();
    if (!text) return;
    el.chatInput.value = '';
    el.chatInput.style.height = 'auto';
    el.btnSend.disabled = true;
    sendMessage(text);
  }

  // ---------------- Window controls ----------------
  function handleClose() {
    saveBounds();
    chrome.runtime.sendMessage({ type: 'paroksh/window-closed' });
    window.close();
  }

  function handleNewChat() {
    state.messages = [];
    saveState();
    renderMessages();
  }

  // Persist chat messages so they survive window close/reopen
  function saveState() {
    try {
      chrome.storage.local.set({ paroksh_messages: state.messages });
    } catch (e) { /* storage unavailable - continue */ }
  }

  // Restore chat messages on window open
  function loadState() {
    try {
      chrome.storage.local.get(['paroksh_messages'], function (r) {
        if (r && r.paroksh_messages && Array.isArray(r.paroksh_messages)) {
          state.messages = r.paroksh_messages;
          renderMessages();
        }
      });
    } catch (e) { /* storage unavailable - continue */ }
  }

  function saveBounds() {
    chrome.windows.getCurrent(function (w) {
      if (!w || w.id === chrome.windows.WINDOW_ID_NONE) return;
      chrome.storage.local.set({
        paroksh_bounds: {
          width: w.width,
          height: w.height,
          left: w.left,
          top: w.top,
          state: w.state || 'normal'
        }
      });
    });
  }

  function resetWindowSize() {
    chrome.windows.getCurrent(function (w) {
      if (!w) return;
      chrome.windows.update(w.id, { state: 'normal', width: DEFAULT_W, height: DEFAULT_H }, function () {
        saveBounds();
      });
    });
    el.settingsMenu.classList.add('hidden');
  }

  function maximizeWindow() {
    chrome.windows.getCurrent(function (w) {
      if (!w) return;
      chrome.storage.local.get('paroksh_bounds', function (r) {
        var saved = r.paroksh_bounds || { width: DEFAULT_W, height: DEFAULT_H };
        if (w.state === 'maximized') {
          chrome.windows.update(w.id, {
            state: 'normal',
            width: saved.width || DEFAULT_W,
            height: saved.height || DEFAULT_H,
            left: saved.left,
            top: saved.top
          }, function () {
            saveBounds();
          });
        } else {
          chrome.windows.update(w.id, { state: 'maximized' }, function () {
            saveBounds();
          });
        }
      });
    });
    el.settingsMenu.classList.add('hidden');
  }

  // ---------------- Theme ----------------
  function toggleTheme() {
    var cur = document.documentElement.getAttribute('data-theme');
    var next = cur === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    chrome.storage.local.set({ paroksh_theme: next });
    el.settingsMenu.classList.add('hidden');
  }

  function loadTheme() {
    chrome.storage.local.get('paroksh_theme', function (r) {
      if (r.paroksh_theme) document.documentElement.setAttribute('data-theme', r.paroksh_theme);
    });
  }

  // ---------------- Voice Agent (ChatGPT-style) ----------------
  // State: voiceRunning (overlay on), listening (recognition active)
  function toggleVoice() {
    if (state.voiceRunning) {
      exitVoiceMode();
      return;
    }
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      addMessage('agent', 'Voice input is not supported in this browser.');
      return;
    }
    state.voiceRunning = true;
    el.voiceOverlay.classList.remove('hidden');
    el.btnMic.classList.add('listening');
    setVoiceStatus('Listening...');
    el.voiceTranscript.textContent = '';
    el.voiceResponse.textContent = '';
    listenOnce();
  }

  function exitVoiceMode() {
    state.voiceRunning = false;
    stopRecognition();
    stopSpeaking();
    el.voiceOverlay.classList.add('hidden');
    el.btnMic.classList.remove('listening');
  }

  function startListening() {
    if (!state.voiceRunning) return;
    setVoiceStatus('Listening...');
    el.voiceTranscript.textContent = '';
    el.voiceOrb.classList.remove('speaking');
    listenOnce();
  }

  function listenOnce() {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR || !state.voiceRunning) return;
    stopRecognition();
    try {
      var rec = new SR();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = function (e) {
        var interim = '';
        var finalText = '';
        for (var i = e.resultIndex; i < e.results.length; i++) {
          var t = e.results[i][0].transcript;
          if (e.results[i].isFinal) finalText += t;
          else interim += t;
        }
        var show = finalText || interim;
        if (show && show.trim()) {
          el.voiceTranscript.textContent = show.trim();
          el.voiceTranscript.scrollTop = el.voiceTranscript.scrollHeight;
        }
        if (finalText && finalText.trim()) {
          handleVoiceIntent(finalText.trim());
        }
      };

      rec.onerror = function (e) {
        if (!state.voiceRunning) return;
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          setVoiceStatus('Microphone not allowed');
          setTimeout(function() {
            if (state.voiceRunning) exitVoiceMode();
          }, 1200);
        } else if (e.error === 'no-speech') {
          listenOnce();
        } else {
          listenOnce();
        }
      };

      rec.onend = function () {
        // Only restart if user hasn't exited and we're not mid-speaking
        if (state.voiceRunning && !state.isSpeaking) {
          setTimeout(function() { listenOnce(); }, 300);
        }
      };

      state.recognition = rec;
      rec.start();
    } catch (err) {
      if (state.voiceRunning) setTimeout(listenOnce, 300);
    }
  }

  function stopRecognition() {
    if (state.recognition) {
      try { state.recognition.onresult = null; state.recognition.onerror = null; state.recognition.onend = null; state.recognition.stop(); } catch (e) {}
      state.recognition = null;
    }
  }

  function setVoiceStatus(text) {
    if (el.voiceStatus) el.voiceStatus.textContent = text;
  }

  // Handle a recognized voice command like a typed message, then speak the reply
  function handleVoiceIntent(text) {
    if (!state.voiceRunning) return;
    addMessage('user', text);
    saveState();
    showTypingIndicator();

    var replyText;
    var isCommand = false;
    var lower = text.toLowerCase();

    if (lower.indexOf('search') !== -1 || lower.indexOf('find') !== -1 || lower.indexOf('buy') !== -1) {
      isCommand = true;
      handleSearch(text);
      return; // reply comes from async handler
    }
    if (lower.indexOf('click') !== -1) {
      isCommand = true;
      handleClick(text);
      return;
    }
    if (lower.indexOf('scroll') !== -1) {
      isCommand = true;
      handleScroll(text);
      return;
    }
    if (lower.indexOf('summarize') !== -1 || lower.indexOf('summary') !== -1) {
      isCommand = true;
      handleSummarize();
      return;
    }
    if (lower.indexOf('read') !== -1 || lower.indexOf('content') !== -1) {
      isCommand = true;
      handleReadContent();
      return;
    }

    removeTypingIndicator();
    replyText = generateAgentReply(text);
    addMessage('agent', replyText);
    speakReply(replyText);
  }

  // Speak a reply via TTS, then resume listening (ChatGPT-style hands-free)
  function speakReply(text) {
    if (!state.voiceRunning) return;
    if (!('speechSynthesis' in window)) {
      startListening();
      return;
    }
    var clean = stripToSpeakable(text);
    if (!clean) { startListening(); return; }
    setVoiceStatus('Speaking...');
    el.voiceOrb.classList.add('speaking');
    el.voiceResponse.textContent = clean;
    state.isSpeaking = true;
    stopSpeaking();
    window.speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(clean);
    u.rate = 1;
    u.pitch = 1;
    u.volume = 1;
    u.lang = 'en-US';
    u.onend = function () {
      state.isSpeaking = false;
      if (state.voiceRunning) {
        setTimeout(startListening, 400);
      }
    };
    u.onerror = function () {
      state.isSpeaking = false;
      if (state.voiceRunning) startListening();
    };
    speechSynthesis.speak(u);
  }

  function stopSpeaking() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    state.isSpeaking = false;
    if (el.voiceOrb) el.voiceOrb.classList.remove('speaking');
  }

  // Keep only the first few sentences that sound natural when read aloud
  function stripToSpeakable(text) {
    if (!text) return '';
    var s = String(text);
    s = s.replace(/[^a-zA-Z0-9 .,!?₹$%:;'"-]/g, '');
    // Trim long command-echo prefixes like "Page:" / "Content: ..." for TTS brevity
    if (s.length > 240) s = s.substring(0, 240);
    return s;
  }

  // ---------------- Message flow ----------------
  function sendMessage(text) {
    addMessage('user', text);
    saveState();
    showTypingIndicator();
    processMessage(text);
  }

  function processMessage(text) {
    var lower = text.toLowerCase();
    try {
      if (lower.indexOf('search') !== -1 || lower.indexOf('find') !== -1 || lower.indexOf('buy') !== -1) {
        handleSearch(text);
      } else if (lower.indexOf('click') !== -1) {
        handleClick(text);
      } else if (lower.indexOf('scroll') !== -1) {
        handleScroll(text);
      } else if (lower.indexOf('summarize') !== -1 || lower.indexOf('summary') !== -1) {
        handleSummarize();
      } else if (lower.indexOf('read') !== -1 || lower.indexOf('content') !== -1) {
        handleReadContent();
      } else {
        var delay = Math.min(600 + text.length * 8, 1500);
        setTimeout(function () {
          removeTypingIndicator();
          var reply = generateAgentReply(text);
          addMessage('agent', reply);
          if (state.voiceRunning) speakReply(reply);
        }, delay);
      }
    } catch (err) {
      removeTypingIndicator();
      addMessage('agent', 'Sorry, I encountered an error.');
    }
  }

  // ---------------- Commands (run on the active tab) ----------------
  function withActiveTab(action) {
    getActiveTab().then(function (tab) {
      if (!tab) {
        removeTypingIndicator();
        var msg1 = 'No active tab detected. Open a webpage first.';
        addMessage('agent', msg1);
        if (state.voiceRunning) speakReply(msg1);
        return;
      }
      action(tab);
    }).catch(function () {
      removeTypingIndicator();
      var msg2 = 'Cannot reach this page. Try a regular website.';
      addMessage('agent', msg2);
      if (state.voiceRunning) speakReply(msg2);
    });
  }

  function handleSearch(query) {
    withActiveTab(function (tab) {
      var term = query.replace(/search|find|buy|for|me|laptops|laptop/gi, '').trim();
      if (!term) term = query.trim();
      sendToTab(tab.id, { type: 'paroksh/action', action: 'search', query: term }).then(function () {
        removeTypingIndicator();
        var reply = 'Searching for "' + term + '" on the page...';
        addMessage('agent', reply);
        if (state.voiceRunning) speakReply(reply);
      }).catch(function (err) {
        removeTypingIndicator();
        var reply = 'Cannot reach this page. ' + (err && err.message ? err.message : '');
        addMessage('agent', reply);
        if (state.voiceRunning) speakReply(reply);
      });
    });
  }

  function handleClick(desc) {
    withActiveTab(function (tab) {
      var want = desc.replace(/click|on|the|please/gi, '').trim();
      sendToTab(tab.id, { type: 'paroksh/action', action: 'click', description: want }).then(function (resp) {
        removeTypingIndicator();
        var reply;
        if (resp && resp.ok) reply = 'Clicked: ' + (resp.message || 'element');
        else reply = 'Could not find that element on the page.';
        addMessage('agent', reply);
        if (state.voiceRunning) speakReply(reply);
      }).catch(function () {
        removeTypingIndicator();
        var reply = 'Cannot reach this page. Try a regular website.';
        addMessage('agent', reply);
        if (state.voiceRunning) speakReply(reply);
      });
    });
  }

  function handleScroll(dir) {
    withActiveTab(function (tab) {
      var scrollDir = dir.indexOf('up') !== -1 ? 'up' : 'down';
      sendToTab(tab.id, { type: 'paroksh/action', action: 'scroll', direction: scrollDir }).then(function () {
        removeTypingIndicator();
        var reply = 'Scrolling ' + scrollDir + '...';
        addMessage('agent', reply);
        if (state.voiceRunning) speakReply(reply);
      }).catch(function () {
        removeTypingIndicator();
        var reply = 'Cannot reach this page. Try a regular website.';
        addMessage('agent', reply);
        if (state.voiceRunning) speakReply(reply);
      });
    });
  }

  function handleSummarize() {
    withActiveTab(function (tab) {
      sendToTab(tab.id, { type: 'paroksh/action', action: 'summarize' }).then(function (resp) {
        removeTypingIndicator();
        var reply = (resp && resp.summary) ? resp.summary : ('Page: ' + (tab.title || 'Unknown'));
        addMessage('agent', reply);
        if (state.voiceRunning) speakReply(reply);
      }).catch(function () {
        removeTypingIndicator();
        var reply = 'Cannot reach this page. Try a regular website.';
        addMessage('agent', reply);
        if (state.voiceRunning) speakReply(reply);
      });
    });
  }

  function handleReadContent() {
    withActiveTab(function (tab) {
      sendToTab(tab.id, { type: 'paroksh/action', action: 'readContent' }).then(function (resp) {
        removeTypingIndicator();
        var reply;
        if (resp && resp.content) {
          reply = 'Content: ' + resp.content.substring(0, 300) + '...';
        } else {
          reply = 'Unable to read page content.';
        }
        addMessage('agent', reply);
        if (state.voiceRunning) speakReply(reply);
      }).catch(function () {
        removeTypingIndicator();
        var reply = 'Cannot reach this page. Try a regular website.';
        addMessage('agent', reply);
        if (state.voiceRunning) speakReply(reply);
      });
    });
  }

  // ---------------- Image / File upload ----------------
  function handleImageUpload(e) {
    var file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (ev) {
      addMessage('user', 'Uploaded image: ' + file.name, 'image', ev.target.result);
      saveState();
      showTypingIndicator();
      setTimeout(function () {
        removeTypingIndicator();
        var reply = 'I received your image "' + file.name + '" (' + formatBytes(file.size) + '). To analyze it visually, connect a backend that supports image processing — meanwhile I can search, click, scroll, or summarize the current page.';
        addMessage('agent', reply);
        if (state.voiceRunning) speakReply(reply);
      }, 900);
    };
    reader.readAsDataURL(file);
  }

  function handleFileUpload(e) {
    var file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    addMessage('user', 'Uploaded file: ' + file.name);
    saveState();
    showTypingIndicator();
    setTimeout(function () {
      removeTypingIndicator();
      var reply = 'I received "' + file.name + '" (' + formatBytes(file.size) + '). Let me know how you want me to process it.';
      addMessage('agent', reply);
      if (state.voiceRunning) speakReply(reply);
    }, 900);
  }

  function formatBytes(bytes) {
    if (!bytes) return '0 B';
    var units = ['B', 'KB', 'MB', 'GB'];
    var i = 0;
    var n = bytes;
    while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
    return n.toFixed(n >= 10 || i === 0 ? 0 : 1) + ' ' + units[i];
  }

  // ---------------- Active tab (resolved by background, robust in popup) ----------------
  function getActiveTab() {
    return new Promise(function (resolve) {
      chrome.runtime.sendMessage({ type: 'paroksh/get-active-tab' }, function (resp) {
        if (chrome.runtime.lastError || !resp || !resp.ok || !resp.tab) {
          resolve(null);
          return;
        }
        resolve(resp.tab);
      });
    });
  }

  function sendToTab(tabId, message) {
    return new Promise(function (resolve, reject) {
      chrome.tabs.sendMessage(tabId, message, function (resp) {
        if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
        else resolve(resp);
      });
    });
  }

  // ---------------- Rendering ----------------
  function addMessage(role, content, type, data) {
    var msg = { role: role, content: content, timestamp: new Date().toISOString() };
    if (type) msg.type = type;
    if (data) msg.data = data;
    state.messages.push(msg);
    renderMessage(msg);
    updateEmptyState();
  }

  function renderMessage(msg) {
    var div = document.createElement('div');
    div.className = 'message ' + msg.role;
    var time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    var icon = msg.role === 'user'
      ? '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z"/></svg>'
      : '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>';
    var body = '<div class="message-bubble">' + escapeHtml(msg.content);
    if (msg.type === 'image' && msg.data) {
      body += '<img class="message-image" src="' + msg.data + '" alt="uploaded image" />';
    }
    body += '</div>';
    div.innerHTML = '<div class="message-avatar">' + icon + '</div>' +
      '<div class="message-content">' + body +
      '<div class="message-time">' + time + '</div></div>';
    el.messagesList.appendChild(div);
    scrollToBottom();
  }

  function renderMessages() {
    el.messagesList.innerHTML = '';
    for (var i = 0; i < state.messages.length; i++) renderMessage(state.messages[i]);
    updateEmptyState();
  }

  function showTypingIndicator() {
    removeTypingIndicator();
    var div = document.createElement('div');
    div.id = 'typing-indicator';
    div.className = 'message agent';
    div.innerHTML = '<div class="message-avatar"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg></div><div class="message-content"><div class="message-bubble"><div class="typing-indicator"><span></span><span></span><span></span></div></div></div>';
    el.messagesList.appendChild(div);
    scrollToBottom();
  }

  function removeTypingIndicator() {
    var ind = document.getElementById('typing-indicator');
    if (ind) ind.remove();
  }

  function updateEmptyState() {
    var has = state.messages.length > 0;
    el.emptyState.classList.toggle('hidden', has);
    el.messagesList.classList.toggle('hidden', !has);
  }

  function scrollToBottom() {
    el.messages.scrollTop = el.messages.scrollHeight;
  }

  function escapeHtml(text) {
    var d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
  }

  // The agent ALWAYS replies. Generate a smart, intent-aware reply.
  function generateAgentReply(text) {
    if (!text || !text.trim()) return getDefaultResponse();
    var lower = text.toLowerCase().trim();

    // --- Greetings ---
    if (/\b(hello|hi|hii|hey|namaste|yo|hiya|good morning|good evening)\b/.test(lower)) {
      return "Hello UDAY! 👋 I'm PAROKSH, your AI browser agent. You can ask me to search, click, scroll, summarize, or read the page — just type or speak it!";
    }

    // --- How are you ---
    if (lower.indexOf('how are you') !== -1 || lower.indexOf("how r u") !== -1 || lower.indexOf("how's it going") !== -1 || lower.indexOf('how do you do') !== -1) {
      return "I'm running great and ready to browse the web for you! What would you like me to do on the current page?";
    }

    // --- Who/what are you ---
    if (lower.indexOf('who are you') !== -1 || lower.indexOf('what are you') !== -1 || lower.indexOf('your name') !== -1 || lower.indexOf('tell me about yourself') !== -1) {
      return "I'm PAROKSH — an AI browser agent living in this extension. I watch your active tab and can search, click elements, scroll, summarize articles, and extract page content for you.";
    }

    // --- Thanks ---
    if (lower.indexOf('thank') !== -1 || lower.indexOf('thx') !== -1 || lower.indexOf('thanks') !== -1) {
      return "You're welcome, UDAY! 😊 I'm always here — tap the mic or type a command whenever you need me.";
    }

    // --- Goodbye ---
    if (/\b(bye|goodbye|see you|gotta go|tata|exit)\b/.test(lower)) {
      return "Goodbye UDAY! 👋 I'll stay right here in the extension. Come back anytime you need a hand with browsing.";
    }

    // --- Help / capabilities ---
    if (lower.indexOf('help') !== -1 || lower.indexOf('what can you do') !== -1 || lower.indexOf('capabilities') !== -1 || lower.indexOf('how do i use') !== -1) {
      return "Here's what I can do: \n• \"search laptops\" — find & fill a search box\n• \"click the first link\" — click an element\n• \"scroll down\" / \"scroll up\" — move the page\n• \"summarize this page\" — extract key info\n• \"read the content\" — pull page text\nTry one now!";
    }

    // --- Questions (contains ?) ---
    if (lower.indexOf('?') !== -1) {
      return "Great question! I can help you answer that by searching the page, clicking relevant links, or extracting content. Try: \"search " + extractTopic(text, 5) + "\" or \"summarize this page\".";
    }

    // --- Topic echo: acknowledge what user said ---
    var topic = extractTopic(text, 8);
    if (topic && topic.length > 2) {
      return "I hear you — \"" + topic + "\". I can act on that right away! Try adding one of these: \n• \"search " + topic + "\"\n• \"click " + topic + "\"\n• \"summarize this page\"";
    }

    // --- Fallback ack: last-resort but never silent ---
    return "I'm here! To put that into action, try: \"search laptops\", \"click first link\", \"scroll down\", or \"summarize this page\".";
  }

  // Pull a short meaningful phrase from the user's message for echoing back
  function extractTopic(text, maxWords) {
    if (!text) return '';
    var stop = ['a','an','the','please','can','you','do','i','we','me','my','is','are','was','were','of','to','for','on','in','at','and','or','but','with','about','it','this','that','there','then','so','just','want','wanna','like','really','very','might','should','could','would','will','going','go','tell','show','what','when','how','why','who','which','help','some','any','thing','stuff'];
    var words = text.replace(/[^a-zA-Z0-9 ]/g, ' ').split(/\s+/).filter(function (w) {
      return w && stop.indexOf(w.toLowerCase()) === -1;
    });
    if (words.length === 0) words = text.split(/\s+/).filter(Boolean);
    var topic = words.slice(0, maxWords).join(' ');
    return topic;
  }

  function getDefaultResponse() {
    var r = [
      "I've got that noted! For the current page I can search, click, scroll, or summarize. What's next?",
      "I'm here and listening! Tell me to search, click, scroll, summarize, or read the page.",
      "Understood! If you want action, try \"search laptops\", \"click the first link\", \"scroll down\", or \"summarize this page\".",
      "Got it! I'm able to interact with the active tab — just give me a command like search, click, scroll, or summarize."
    ];
    return r[Math.floor(Math.random() * r.length)];
  }

  // ---------------- Tab / window listeners ----------------
  function updateActiveTab() {
    getActiveTab().then(function (tab) {
      if (tab) state.activeTab = tab;
    });
  }

  function setupTabListener() {
    chrome.runtime.onMessage.addListener(function (message) {
      if (!message || typeof message !== 'object') return;
      if (message.type === 'paroksh/active-tab-changed' && message.tab) {
        state.activeTab = message.tab;
      }
    });
  }

  window.addEventListener('beforeunload', saveBounds);

  document.addEventListener('DOMContentLoaded', init);
})();