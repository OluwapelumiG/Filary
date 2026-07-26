import type { ExtensionMessage, ExtensionResponse } from '../shared/messages.js';
import { applyValues } from './fill.js';
import {
  collectFormSchema,
  getFocusedControl,
  resolveForm,
  trackFocus,
} from './form.js';

trackFocus();

let lastForm: HTMLFormElement | null = null;

function collectSchemaResponse(): ExtensionResponse {
  const control = getFocusedControl();
  if (!control) {
    return {
      ok: false,
      error: 'Focus an input inside a <form>, then trigger Filary again',
    };
  }

  const form = resolveForm(control);
  if (!form) {
    return {
      ok: false,
      error: 'No <form> found for the focused input',
    };
  }

  const fields = collectFormSchema(form);
  if (!fields.length) {
    return {
      ok: false,
      error: 'No named fields found in this form (controls need a name attribute)',
    };
  }

  lastForm = form;
  return { ok: true, fields };
}

chrome.runtime.onMessage.addListener(
  (
    message: ExtensionMessage,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: ExtensionResponse) => void,
  ) => {
    if (message.type === 'COLLECT_FORM_SCHEMA') {
      sendResponse(collectSchemaResponse());
      return false;
    }

    if (message.type === 'APPLY_VALUES') {
      try {
        const control = getFocusedControl();
        const form =
          (control ? resolveForm(control) : null) ?? lastForm;

        if (!form) {
          sendResponse({
            ok: false,
            error: 'No form available to fill. Focus a field and try again.',
          });
          return false;
        }

        const filled = applyValues(form, message.values, message.settings);
        sendResponse({
          ok: true,
          filled,
          message: filled
            ? `Filled ${filled} field${filled === 1 ? '' : 's'}`
            : 'No matching named fields were filled',
        });
      } catch (error) {
        sendResponse({
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
      return false;
    }

    return false;
  },
);
