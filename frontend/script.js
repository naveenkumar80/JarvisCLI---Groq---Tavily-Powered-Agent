// script.js
(function() {
  document.addEventListener('DOMContentLoaded', () => {
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendBtn') || document.querySelector('footer button:last-child');
    const responseDiv = document.getElementById('response');
    const voiceButton = document.querySelector('footer button[aria-label="Voice"]');
    const browseButton = document.querySelector('footer button[aria-label="Browse"]');
    const attachButton = document.querySelector('footer button[aria-label="Attach file"]');
    const menuButton = document.querySelector('header button[aria-label="Menu"]');
    const hero = document.getElementById('hero');

    let chatStarted = false;
    function startChat() {
        if(!chatStarted) {
            hero.style.display = 'none';
            chatStarted = true;
        }
    }

    const API_URL = 'http://localhost:3000/chat';
    let conversationHistory = [];   // stores { role, content }
    let isProcessing = false;

    function escapeHtml(str) {
      if (!str) return '';
      return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
      });
    }

    function initResponseContainer() {
      responseDiv.classList.remove('hidden');
      responseDiv.classList.add('flex', 'flex-col', 'gap-4', 'overflow-y-auto', 'max-h-[60vh]', 'p-4', 'mb-4');
      responseDiv.style.scrollBehavior = 'smooth';
      responseDiv.innerHTML = '';
    }

    function addMessage(sender, text) {
      const messageDiv = document.createElement('div');
      messageDiv.classList.add('flex', 'w-full');
      if (sender === 'user') {
        messageDiv.classList.add('justify-end');
        messageDiv.innerHTML = `
          <div class="max-w-[80%] rounded-2xl bg-white/10 px-4 py-2 text-sm text-zinc-100 shadow-sm border border-white/5">
            <div class="text-xs text-zinc-400 mb-1">You</div>
            <div class="whitespace-pre-wrap break-words">${escapeHtml(text)}</div>
          </div>
        `;
      } else {
        messageDiv.classList.add('justify-start');
        messageDiv.innerHTML = `
          <div class="max-w-[80%] rounded-2xl bg-[#1e2430]/80 backdrop-blur-sm px-4 py-2 text-sm text-zinc-100 shadow-sm border border-white/10">
            <div class="text-xs text-indigo-300 mb-1">Jarvis AI</div>
            <div class="whitespace-pre-wrap break-words">${escapeHtml(text)}</div>
          </div>
        `;
      }
      responseDiv.appendChild(messageDiv);
      responseDiv.scrollTop = responseDiv.scrollHeight;
    }

    function showLoading() {
      const loader = document.createElement('div');
      loader.id = 'loading-indicator';
      loader.classList.add('flex', 'w-full', 'justify-start');
      loader.innerHTML = `
        <div class="max-w-[80%] rounded-2xl bg-[#1e2430]/80 backdrop-blur-sm px-4 py-3 text-sm text-zinc-300 border border-white/10">
          <div class="flex items-center gap-2">
            <span>Jarvis is thinking</span>
            <span class="flex gap-1">
              <span class="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style="animation-delay: 0ms"></span>
              <span class="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style="animation-delay: 150ms"></span>
              <span class="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style="animation-delay: 300ms"></span>
            </span>
          </div>
        </div>
      `;
      responseDiv.appendChild(loader);
      responseDiv.scrollTop = responseDiv.scrollHeight;
    }

    function removeLoading() {
      const loader = document.getElementById('loading-indicator');
      if (loader) loader.remove();
    }

    async function sendToBackend(userMessage) {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: conversationHistory
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data.reply;
    }

    async function processUserMessage() {
      if (isProcessing) return;
      const rawMessage = userInput.value.trim();
      if (!rawMessage) return;

      isProcessing = true;
      userInput.disabled = true;
      if (sendButton) sendButton.disabled = true;

      addMessage('user', rawMessage);
      conversationHistory.push({ role: 'user', content: rawMessage });
      userInput.value = '';
      showLoading();

      try {
        const aiReply = await sendToBackend(rawMessage);
        removeLoading();
        addMessage('assistant', aiReply);
        conversationHistory.push({ role: 'assistant', content: aiReply });
      } catch (err) {
        removeLoading();
        addMessage('assistant', `Error: ${err.message}. Is the backend running on ${API_URL}?`);
      } finally {
        isProcessing = false;
        userInput.disabled = false;
        if (sendButton) sendButton.disabled = false;
        userInput.focus();
      }
    }

    function clearConversation() {
      conversationHistory = [];
      responseDiv.innerHTML = '';
      addMessage('assistant', 'Conversation cleared. Ask me anything!');
    }

    // Voice input (optional)
    function initVoice() {
      if (!voiceButton) return;
      if (!('webkitSpeechRecognition' in window)) {
        voiceButton.style.opacity = '0.5';
        return;
      }
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      let listening = false;
      voiceButton.addEventListener('click', () => {
        if (listening) {
          recognition.stop();
          return;
        }
        recognition.start();
        listening = true;
        voiceButton.style.backgroundColor = 'rgba(255,255,255,0.2)';
      });
      recognition.onresult = (e) => {
        userInput.value = e.results[0][0].transcript;
        listening = false;
        voiceButton.style.backgroundColor = '';
        userInput.focus();
      };
      recognition.onerror = () => {
        listening = false;
        voiceButton.style.backgroundColor = '';
      };
      recognition.onend = () => {
        listening = false;
        voiceButton.style.backgroundColor = '';
      };
    }

    // File upload
    function setupFileReader(btn) {
      if (!btn) return;
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.txt,.js,.html,.css,.json,.md';
      fileInput.style.display = 'none';
      document.body.appendChild(fileInput);
      btn.addEventListener('click', () => fileInput.click());
      fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          let content = ev.target.result;
          if (content.length > 2000) content = content.slice(0, 2000) + '\n… [truncated]';
          userInput.value = content;
          userInput.focus();
          addMessage('assistant', `📄 Loaded "${file.name}". You can edit or send.`);
        };
        reader.onerror = () => addMessage('assistant', '⚠️ Failed to read file.');
        reader.readAsText(file, 'UTF-8');
        fileInput.value = '';
      };
    }

    // Initialize
    initResponseContainer();
    addMessage('assistant', 'Jarvis AI is connected. Ask me anything!');
    if (sendButton) sendButton.addEventListener('click', processUserMessage);
    userInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        processUserMessage();
        startChat();
      }
      
    });
    initVoice();
    setupFileReader(attachButton);
    setupFileReader(browseButton);
    if (menuButton) menuButton.addEventListener('click', clearConversation);
    userInput.focus();
  });
})();