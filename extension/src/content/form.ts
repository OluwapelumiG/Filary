import type { FormFieldDescriptor } from '../shared/types.js';

export type FormControl =
  | HTMLInputElement
  | HTMLSelectElement
  | HTMLTextAreaElement;

const CONTROL_SELECTOR = 'input, select, textarea';

function isFormControl(el: Element | null): el is FormControl {
  return (
    el instanceof HTMLInputElement ||
    el instanceof HTMLSelectElement ||
    el instanceof HTMLTextAreaElement
  );
}

/** Survives popup stealing focus from the page. */
let lastFocusedControl: FormControl | null = null;

export function trackFocus(): void {
  document.addEventListener(
    'focusin',
    (event) => {
      const target = event.target;
      if (isFormControl(target as Element)) {
        lastFocusedControl = target as FormControl;
      }
    },
    true,
  );
}

export function getFocusedControl(): FormControl | null {
  const active = document.activeElement;
  if (isFormControl(active)) {
    lastFocusedControl = active;
    return active;
  }
  if (lastFocusedControl?.isConnected) return lastFocusedControl;
  return null;
}

/**
 * Resolve the form for a control:
 * 1. native .form association (includes form="id")
 * 2. closest ancestor <form>
 * 3. latest <form> start that precedes the control in document order
 */
export function resolveForm(control: FormControl): HTMLFormElement | null {
  if (control.form) return control.form;

  const ancestor = control.closest('form');
  if (ancestor) return ancestor;

  const allForms = [...document.querySelectorAll('form')];
  let latest: HTMLFormElement | null = null;

  for (const form of allForms) {
    const position = form.compareDocumentPosition(control);
    const formBefore =
      (position & Node.DOCUMENT_POSITION_FOLLOWING) !== 0 ||
      (position & Node.DOCUMENT_POSITION_CONTAINED_BY) !== 0;
    if (formBefore) {
      latest = form;
    }
  }

  return latest;
}

function controlType(el: FormControl): string {
  if (el instanceof HTMLTextAreaElement) return 'textarea';
  if (el instanceof HTMLSelectElement) {
    return el.multiple ? 'select-multiple' : 'select-one';
  }
  return (el.type || 'text').toLowerCase();
}

function collectOptions(el: FormControl, form: HTMLFormElement): string[] | undefined {
  if (el instanceof HTMLSelectElement) {
    return [...el.options]
      .map((o) => o.value)
      .filter((v) => v !== '');
  }

  if (el instanceof HTMLInputElement && el.type === 'radio' && el.name) {
    const radios = getNamedControls(form, el.name).filter(
      (c): c is HTMLInputElement =>
        c instanceof HTMLInputElement && c.type === 'radio',
    );
    const values = radios.map((r) => r.value).filter(Boolean);
    return values.length ? values : undefined;
  }

  return undefined;
}

function getNamedControls(form: HTMLFormElement, name: string): FormControl[] {
  const inForm = [...form.querySelectorAll<FormControl>(CONTROL_SELECTOR)];
  const associated = form.id
    ? [
        ...document.querySelectorAll<FormControl>(
          `${CONTROL_SELECTOR}[form="${CSS.escape(form.id)}"]`,
        ),
      ]
    : [];

  return [...inForm, ...associated].filter((el) => el.name === name);
}

export function collectFormSchema(form: HTMLFormElement): FormFieldDescriptor[] {
  const seen = new Set<string>();
  const fields: FormFieldDescriptor[] = [];

  const candidates = new Set<FormControl>([
    ...form.querySelectorAll<FormControl>(CONTROL_SELECTOR),
  ]);

  if (form.id) {
    for (const el of document.querySelectorAll<FormControl>(
      `${CONTROL_SELECTOR}[form="${CSS.escape(form.id)}"]`,
    )) {
      candidates.add(el);
    }
  }

  for (const el of candidates) {
    const name = el.name?.trim();
    if (!name || seen.has(name)) continue;

    const type = controlType(el);
    if (
      type === 'hidden' ||
      type === 'submit' ||
      type === 'button' ||
      type === 'image' ||
      type === 'reset' ||
      type === 'file'
    ) {
      continue;
    }

    seen.add(name);
    const options = collectOptions(el, form);
    fields.push(options?.length ? { name, type, options } : { name, type });
  }

  return fields;
}

export function getFormControls(form: HTMLFormElement): FormControl[] {
  const set = new Set<FormControl>([
    ...form.querySelectorAll<FormControl>(CONTROL_SELECTOR),
  ]);
  if (form.id) {
    for (const el of document.querySelectorAll<FormControl>(
      `${CONTROL_SELECTOR}[form="${CSS.escape(form.id)}"]`,
    )) {
      set.add(el);
    }
  }
  return [...set];
}
