import type { ExtensionResponse } from '../shared/messages.js';

const statusDot = document.getElementById('status-dot')!;
const statusText = document.getElementById('status-text')!;
const shortcutLine = document.getElementById('shortcut-line')!;
const fillBtn = document.getElementById('fill-btn') as HTMLButtonElement;
const optionsBtn = document.getElementById('options-btn') as HTMLButtonElement;
const resultEl = document.getElementById('result')!;

async function send<T extends ExtensionResponse>(
  type: 'FILL_ACTIVE_TAB' | 'CHECK_CONNECTION' | 'GET_SHORTCUT' | 'OPEN_OPTIONS',
): Promise<T> {
  return chrome.runtime.sendMessage({ type }) as Promise<T>;
}

function showResult(ok: boolean, text: string) {
  resultEl.hidden = false;
  resultEl.className = `result ${ok ? 'ok' : 'bad'}`;
  resultEl.textContent = text;
}

async function refreshStatus() {
  const connection = await send('CHECK_CONNECTION');
  if (connection.ok && connection.connected) {
    statusDot.className = 'dot ok';
    statusText.textContent = 'Server connected';
    fillBtn.disabled = false;
  } else {
    statusDot.className = 'dot bad';
    statusText.textContent = 'Server offline';
    fillBtn.disabled = false; // still allow attempt (shows error)
  }

  const shortcut = await send('GET_SHORTCUT');
  if (shortcut.ok && shortcut.shortcut) {
    shortcutLine.textContent = `Shortcut: ${shortcut.shortcut}`;
  }
}

fillBtn.addEventListener('click', async () => {
  fillBtn.disabled = true;
  showResult(true, 'Filling…');
  const response = await send('FILL_ACTIVE_TAB');
  if (response.ok) {
    showResult(true, response.message ?? `Filled ${response.filled ?? 0} fields`);
  } else {
    showResult(false, response.error);
  }
  fillBtn.disabled = false;
  void refreshStatus();
});

optionsBtn.addEventListener('click', () => {
  void send('OPEN_OPTIONS');
});

void refreshStatus();
