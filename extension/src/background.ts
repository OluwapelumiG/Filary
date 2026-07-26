import type { ExtensionMessage, ExtensionResponse } from './shared/messages.js';
import { apiUrl, getSettings } from './shared/settings.js';
import type { FormFieldDescriptor, GenerateResponse } from './shared/types.js';

async function sendToTab(
  tabId: number,
  message: ExtensionMessage,
): Promise<ExtensionResponse> {
  try {
    return (await chrome.tabs.sendMessage(tabId, message)) as ExtensionResponse;
  } catch {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content/index.js'],
    });
    return (await chrome.tabs.sendMessage(tabId, message)) as ExtensionResponse;
  }
}

async function generateValues(
  fields: FormFieldDescriptor[],
): Promise<GenerateResponse> {
  const settings = await getSettings();
  const url = apiUrl(settings.serverUrl, '/generate');
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields,
      locale: settings.locale,
      emailDomains: settings.emailDomains,
    }),
  });

  if (!response.ok) {
    throw new Error(`Server responded with ${response.status}`);
  }

  return (await response.json()) as GenerateResponse;
}

async function fillActiveTab(): Promise<ExtensionResponse> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    return { ok: false, error: 'No active tab' };
  }

  if (
    !tab.url ||
    tab.url.startsWith('chrome://') ||
    tab.url.startsWith('chrome-extension://') ||
    tab.url.startsWith('edge://')
  ) {
    return { ok: false, error: 'Cannot fill forms on this page' };
  }

  let schema: ExtensionResponse;
  try {
    schema = await sendToTab(tab.id, { type: 'COLLECT_FORM_SCHEMA' });
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : 'Could not reach the page content script. Reload the tab and try again.',
    };
  }

  if (!schema.ok || !schema.fields?.length) {
    return schema.ok
      ? { ok: false, error: 'No named fields found in this form' }
      : schema;
  }

  let generated: GenerateResponse;
  try {
    generated = await generateValues(schema.fields);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      error: `Cannot reach Filary server. Run \`bun run server\` then try again. (${message})`,
      connected: false,
    };
  }

  const settings = await getSettings();
  const values = { ...generated.values };

  if (settings.includePasswords && settings.defaultPassword) {
    for (const field of schema.fields) {
      if (field.type === 'password') {
        values[field.name] = settings.defaultPassword;
      }
    }
  }

  try {
    return await sendToTab(tab.id, {
      type: 'APPLY_VALUES',
      values,
      settings,
    });
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : 'Could not apply values. Reload the tab and try again.',
    };
  }
}

async function checkConnection(): Promise<ExtensionResponse> {
  try {
    const settings = await getSettings();
    const response = await fetch(apiUrl(settings.serverUrl, '/health'));
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return { ok: true, connected: true, message: 'Server is reachable' };
  } catch (error) {
    return {
      ok: false,
      connected: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function getShortcut(): Promise<string> {
  const commands = await chrome.commands.getAll();
  const shortcuts = ['fill-form', 'fill-form-alt']
    .map((name) => commands.find((c) => c.name === name)?.shortcut)
    .filter((s): s is string => Boolean(s));
  return shortcuts.length ? shortcuts.join(' · ') : 'Not set';
}

chrome.runtime.onMessage.addListener(
  (
    message: ExtensionMessage,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: ExtensionResponse) => void,
  ) => {
    (async () => {
      switch (message.type) {
        case 'FILL_ACTIVE_TAB':
          sendResponse(await fillActiveTab());
          break;
        case 'CHECK_CONNECTION':
          sendResponse(await checkConnection());
          break;
        case 'GET_SHORTCUT':
          sendResponse({ ok: true, shortcut: await getShortcut() });
          break;
        case 'OPEN_SHORTCUTS':
          await chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
          sendResponse({ ok: true });
          break;
        case 'OPEN_OPTIONS':
          await chrome.runtime.openOptionsPage();
          sendResponse({ ok: true });
          break;
        default:
          sendResponse({ ok: false, error: 'Unknown message' });
      }
    })().catch((error) => {
      sendResponse({
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    });

    return true;
  },
);

chrome.commands.onCommand.addListener((command) => {
  if (command === 'fill-form' || command === 'fill-form-alt') {
    void fillActiveTab();
  }
});
