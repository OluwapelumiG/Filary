export type FillMode = 'empty' | 'overwrite';

export type FilaryLocale =
  | 'en-NG'
  | 'yo-NG'
  | 'en-US'
  | 'en-GB'
  | 'en-GH'
  | 'en-ZA'
  | 'en-IN'
  | 'en-CA'
  | 'en-AU';

export interface FilarySettings {
  serverUrl: string;
  fillMode: FillMode;
  includePasswords: boolean;
  /** Used when includePasswords is on; empty means generate a random password */
  defaultPassword: string;
  locale: FilaryLocale;
  /** Comma-separated email domains, e.g. "gmail.com, yahoo.com" */
  emailDomains: string;
}

export interface FormFieldDescriptor {
  name: string;
  type: string;
  options?: string[];
}

export interface FormSchema {
  fields: FormFieldDescriptor[];
}

export type FieldValue = string | boolean | number;

export interface GenerateRequest {
  fields: FormFieldDescriptor[];
  locale?: string;
  emailDomains?: string;
}

export interface GenerateResponse {
  values: Record<string, FieldValue>;
}

/** Kept for optional debug against GET /profile */
export interface FormProfile {
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  gender: 'male' | 'female';
  dateOfBirth: string;
  username: string;
  password: string;
  company: string;
  jobTitle: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  url: string;
}
