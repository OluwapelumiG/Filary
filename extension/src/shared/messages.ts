import type {
  FieldValue,
  FilarySettings,
  FormFieldDescriptor,
} from './types.js';

export type ExtensionMessage =
  | { type: 'FILL_ACTIVE_TAB' }
  | { type: 'COLLECT_FORM_SCHEMA' }
  | {
      type: 'APPLY_VALUES';
      values: Record<string, FieldValue>;
      settings: FilarySettings;
    }
  | { type: 'CHECK_CONNECTION' }
  | { type: 'GET_SHORTCUT' }
  | { type: 'OPEN_SHORTCUTS' }
  | { type: 'OPEN_OPTIONS' };

export type ExtensionResponse =
  | {
      ok: true;
      filled?: number;
      message?: string;
      shortcut?: string;
      connected?: boolean;
      fields?: FormFieldDescriptor[];
    }
  | { ok: false; error: string; connected?: boolean };
