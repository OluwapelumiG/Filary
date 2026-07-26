import { apiUrl, getSettings, saveSettings } from '../shared/settings.js';
import type { FilaryLocale, FilarySettings } from '../shared/types.js';

const form = document.getElementById('settings-form') as HTMLFormElement;
const serverUrl = document.getElementById('server-url') as HTMLInputElement;
const fillMode = document.getElementById('fill-mode') as HTMLSelectElement;
const includePasswords = document.getElementById('include-passwords') as HTMLInputElement;
const defaultPasswordField = document.getElementById('default-password-field')!;
const defaultPassword = document.getElementById('default-password') as HTMLInputElement;
const locale = document.getElementById('locale') as HTMLSelectElement;
const emailDomains = document.getElementById('email-domains') as HTMLInputElement;
const testBtn = document.getElementById('test-btn') as HTMLButtonElement;
const testResult = document.getElementById('test-result')!;
const shortcutValue = document.getElementById('shortcut-value')!;
const shortcutBtn = document.getElementById('shortcut-btn') as HTMLButtonElement;
const saveStatus = document.getElementById('save-status')!;

function syncPasswordFieldVisibility() {
  defaultPasswordField.hidden = !includePasswords.checked;
}

function readForm(): FilarySettings {
  return {
    serverUrl: serverUrl.value.trim().replace(/\/+$/, ''),
    fillMode: fillMode.value as FilarySettings['fillMode'],
    includePasswords: includePasswords.checked,
    defaultPassword: includePasswords.checked ? defaultPassword.value : '',
    locale: locale.value as FilaryLocale,
    emailDomains:
      emailDomains.value.trim() || 'gmail.com, yahoo.com, outlook.com',
  };
}

function writeForm(settings: FilarySettings) {
  serverUrl.value = settings.serverUrl;
  fillMode.value = settings.fillMode;
  includePasswords.checked = settings.includePasswords;
  defaultPassword.value = settings.defaultPassword;
  locale.value = settings.locale;
  emailDomains.value = settings.emailDomains;
  syncPasswordFieldVisibility();
}

async function loadShortcut() {
  const response = await chrome.runtime.sendMessage({ type: 'GET_SHORTCUT' });
  if (response?.ok && response.shortcut) {
    shortcutValue.textContent = response.shortcut;
  } else {
    shortcutValue.textContent = 'Not set';
  }
}

includePasswords.addEventListener('change', syncPasswordFieldVisibility);

testBtn.addEventListener('click', async () => {
  testResult.className = 'inline-status';
  testResult.textContent = 'Testing…';
  const url = apiUrl(serverUrl.value.trim(), '/health');
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    await response.json();
    testResult.className = 'inline-status ok';
    testResult.textContent = 'Connected';
  } catch (error) {
    testResult.className = 'inline-status bad';
    testResult.textContent =
      error instanceof Error ? error.message : 'Connection failed';
  }
});

shortcutBtn.addEventListener('click', () => {
  void chrome.runtime.sendMessage({ type: 'OPEN_SHORTCUTS' });
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const settings = readForm();
  await saveSettings(settings);
  saveStatus.className = 'inline-status ok';
  saveStatus.textContent = 'Saved';
  window.setTimeout(() => {
    saveStatus.textContent = '';
  }, 2000);
});

const settings = await getSettings();
writeForm(settings);
await loadShortcut();
