import type { FieldValue, FilarySettings } from '../shared/types.js';
import {
  getFormControls,
  resolveForm,
  type FormControl,
} from './form.js';

function isEmpty(el: FormControl): boolean {
  if (el instanceof HTMLSelectElement) {
    return !el.value || el.selectedIndex <= 0;
  }
  if (el instanceof HTMLInputElement && el.type === 'radio') {
    const name = el.name;
    if (!name) return !el.checked;
    const form = resolveForm(el);
    const group = form
      ? getFormControls(form).filter(
          (c): c is HTMLInputElement =>
            c instanceof HTMLInputElement && c.type === 'radio' && c.name === name,
        )
      : [...document.querySelectorAll<HTMLInputElement>(
          `input[type="radio"][name="${CSS.escape(name)}"]`,
        )];
    return !group.some((r) => r.checked);
  }
  if (el instanceof HTMLInputElement && el.type === 'checkbox') {
    return !el.checked;
  }
  return !String(el.value ?? '').trim();
}

function setNativeValue(el: FormControl, value: string): void {
  const proto =
    el instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : el instanceof HTMLSelectElement
        ? HTMLSelectElement.prototype
        : HTMLInputElement.prototype;

  const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');
  if (descriptor?.set) {
    descriptor.set.call(el, value);
  } else {
    el.value = value;
  }

  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

function normalizeToken(value: string): string {
  return value.trim().toLowerCase();
}

function fillSelect(el: HTMLSelectElement, value: string): boolean {
  const options = [...el.options];
  const lower = normalizeToken(value);

  let match = options.find(
    (o) => normalizeToken(o.value) === lower || normalizeToken(o.text) === lower,
  );

  if (!match) {
    match = options.find(
      (o) =>
        normalizeToken(o.value).includes(lower) ||
        normalizeToken(o.text).includes(lower),
    );
  }

  if (!match) return false;
  setNativeValue(el, match.value);
  return true;
}

function fillRadio(
  form: HTMLFormElement,
  name: string,
  value: string,
): boolean {
  const group = getFormControls(form).filter(
    (c): c is HTMLInputElement =>
      c instanceof HTMLInputElement && c.type === 'radio' && c.name === name,
  );

  const lower = normalizeToken(value);

  for (const radio of group) {
    const labelText = radio.labels?.[0]?.textContent ?? '';
    const hit =
      normalizeToken(radio.value) === lower ||
      normalizeToken(labelText) === lower ||
      normalizeToken(radio.value).includes(lower) ||
      normalizeToken(labelText).includes(lower);

    if (hit) {
      radio.checked = true;
      radio.dispatchEvent(new Event('input', { bubbles: true }));
      radio.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }
  }
  return false;
}

function toDateValue(value: string, el: HTMLInputElement): string {
  if (el.type === 'date') {
    const iso = value.slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : value;
  }
  if (el.type === 'datetime-local') {
    return value.slice(0, 16);
  }
  return value;
}

export function applyValues(
  form: HTMLFormElement,
  values: Record<string, FieldValue>,
  settings: FilarySettings,
): number {
  const controls = getFormControls(form);
  const filledNames = new Set<string>();
  let filled = 0;

  for (const el of controls) {
    const name = el.name?.trim();
    if (!name || !(name in values)) continue;
    if (filledNames.has(name)) continue;

    if (el instanceof HTMLInputElement) {
      const type = (el.type || 'text').toLowerCase();
      if (type === 'password' && !settings.includePasswords) continue;
      if (type === 'hidden' || type === 'submit' || type === 'button' || type === 'file') {
        continue;
      }
    }

    if (settings.fillMode === 'empty' && !isEmpty(el)) {
      filledNames.add(name);
      continue;
    }

    const raw = values[name];

    if (el instanceof HTMLInputElement && el.type === 'checkbox') {
      el.checked = Boolean(raw);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      filledNames.add(name);
      filled += 1;
      continue;
    }

    if (el instanceof HTMLInputElement && el.type === 'radio') {
      if (fillRadio(form, name, String(raw))) {
        filledNames.add(name);
        filled += 1;
      }
      continue;
    }

    if (el instanceof HTMLSelectElement) {
      if (fillSelect(el, String(raw))) {
        filledNames.add(name);
        filled += 1;
      }
      continue;
    }

    let text = String(raw);
    if (el instanceof HTMLInputElement) {
      text = toDateValue(text, el);
    }
    setNativeValue(el, text);
    filledNames.add(name);
    filled += 1;
  }

  return filled;
}
