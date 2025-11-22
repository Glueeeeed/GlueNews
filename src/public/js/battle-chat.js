const input = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const chat = document.getElementById('chat');
let autoScroll = true;
const SCROLL_THRESHOLD = 100;
chat.addEventListener('scroll', () => {
    const distanceFromBottom = chat.scrollHeight - chat.clientHeight - chat.scrollTop;
    autoScroll = distanceFromBottom < SCROLL_THRESHOLD;
});

input.addEventListener('input', () => {
    sendBtn.disabled = input.value.trim() === '';
    input.style.height = 'auto';
    input.style.height = Math.min(120, input.scrollHeight) + 'px';
});

function createMessage(text, sender, nickname) {
    const container = document.createElement('div');
    container.className = 'max-w-[70%] flex flex-col break-words';
    container.className += sender === 'me' ? ' self-end items-end' : ' self-start items-start';

    const nameEl = document.createElement('div');
    nameEl.textContent = nickname || (sender === 'me' ? 'You' : 'User');
    nameEl.className = 'text-xs font-semibold mb-1';
    nameEl.className += sender === 'me' ? ' text-amber-900' : ' text-gray-600';

    const bubble = document.createElement('div');
    bubble.textContent = text;
    bubble.className = 'p-3 rounded-xl break-words';
    if (sender === 'me') {
        bubble.className += ' bg-amber-500 text-white rounded-tr-none';
    } else if (sender === 'system') {
        bubble.className += ' bg-blue-500 text-white rounded-tr-none';
    } else {
        bubble.className += ' bg-gray-300 text-gray-900 rounded-tl-none';
    }

    container.appendChild(nameEl);
    container.appendChild(bubble);
    return container;
}

function addMessage(text, sender, nickname) {
    chat.appendChild(createMessage(text, sender,nickname));
    if (autoScroll) {
        scrollToBottom();
    }
}

function scrollToBottom(smooth = true) {
    chat.scrollTo({ top: chat.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
}



function sendMessage() {
    const text = input.value.trim();
    if (!text) return;
    addMessage(text, 'me', 'Ty');
    input.value = '';
    sendBtn.disabled = true;
    input.style.height = 'auto';
    input.focus();
}

function formatTime(seconds) {
    const mins = Math.floor(Math.abs(seconds) / 60).toString().padStart(2, '0');
    const secs = (Math.abs(seconds) % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
}