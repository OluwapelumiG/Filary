// Co-located under api/ so Vercel bundles this the same way as /api/profile.
// Only en_NG locale import — same path that already works on Vercel.
import { faker as fakerEN_NG } from '@faker-js/faker/locale/en_NG';

export interface FormFieldDescriptor {
  name: string;
  type: string;
  options?: string[];
}

export interface GenerateRequest {
  fields: FormFieldDescriptor[];
  locale?: string;
  emailDomains?: string;
}

export type FieldValue = string | boolean | number;

export interface GenerateResponse {
  values: Record<string, FieldValue>;
}

export interface GenerateOptions {
  locale?: string;
  emailDomains?: string;
}

const LOCALE_COUNTRY: Record<string, string> = {
  'en-NG': 'Nigeria',
  'yo-NG': 'Nigeria',
  'en-US': 'United States',
  'en-GB': 'United Kingdom',
  'en-GH': 'Ghana',
  'en-ZA': 'South Africa',
  'en-IN': 'India',
  'en-CA': 'Canada',
  'en-AU': 'Australia',
};

const DEFAULT_EMAIL_DOMAINS = ['gmail.com', 'yahoo.com', 'outlook.com'];

function resolveLocale(locale?: string): string {
  if (locale && locale in LOCALE_COUNTRY) return locale;
  return 'en-NG';
}

function parseEmailDomains(raw?: string): string[] {
  if (!raw?.trim()) return DEFAULT_EMAIL_DOMAINS;
  const domains = raw
    .split(',')
    .map((d) => d.trim().replace(/^@/, '').toLowerCase())
    .filter(Boolean);
  return domains.length ? domains : DEFAULT_EMAIL_DOMAINS;
}

function nameTokens(name: string): string {
  return name
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_\-[\].]+/g, ' ')
    .toLowerCase()
    .trim();
}

function pickOption(
  options: string[] | undefined,
  preferred?: string[],
): string | null {
  if (!options?.length) return null;
  if (preferred?.length) {
    const lower = new Map(options.map((o) => [o.toLowerCase(), o]));
    for (const p of preferred) {
      const hit = lower.get(p.toLowerCase());
      if (hit !== undefined) return hit;
    }
  }
  return fakerEN_NG.helpers.arrayElement(options);
}

function buildEmail(
  firstName: string,
  lastName: string,
  domains: string[],
): string {
  const domain = fakerEN_NG.helpers.arrayElement(domains);
  const local = fakerEN_NG.internet
    .username({ firstName, lastName })
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '');
  return `${local || 'user'}@${domain}`;
}

interface GenCtx {
  locale: string;
  gender: 'male' | 'female';
  firstName: string;
  lastName: string;
  emailDomains: string[];
  country: string;
  isNigeria: boolean;
}

function generateForField(field: FormFieldDescriptor, ctx: GenCtx): FieldValue {
  const faker = fakerEN_NG;
  const type = (field.type || 'text').toLowerCase();
  const key = nameTokens(field.name);
  const rawName = field.name.toLowerCase();

  if (type === 'checkbox') {
    return faker.datatype.boolean();
  }

  if (type === 'number' || type === 'range') {
    if (key.includes('age')) return faker.number.int({ min: 18, max: 75 });
    return faker.number.int({ min: 0, max: 1000 });
  }

  if (type === 'date') {
    return faker.date.birthdate({ min: 18, max: 75, mode: 'age' }).toISOString().slice(0, 10);
  }

  if (type === 'datetime-local') {
    return faker.date.recent().toISOString().slice(0, 16);
  }

  if (type === 'time') {
    return faker.date.recent().toISOString().slice(11, 16);
  }

  if (type === 'month') {
    return faker.date.recent().toISOString().slice(0, 7);
  }

  if (type === 'color') {
    return faker.color.rgb({ format: 'hex' });
  }

  if (type === 'email' || key.includes('email') || key.includes('e mail')) {
    return buildEmail(ctx.firstName, ctx.lastName, ctx.emailDomains);
  }

  if (
    type === 'tel' ||
    key.includes('phone') ||
    key.includes('mobile') ||
    key.includes('telephone') ||
    /(^| )tel( |$)/.test(key)
  ) {
    return faker.phone.number();
  }

  if (type === 'url' || key.includes('url') || key.includes('website') || key.includes('homepage')) {
    return faker.internet.url();
  }

  if (type === 'password' || key.includes('password') || key.includes('passwd') || key === 'pwd') {
    return faker.internet.password({ length: 14, memorable: false });
  }

  if (type === 'radio' || type.startsWith('select')) {
    const genderOpt = pickOption(field.options, [
      ctx.gender,
      ctx.gender === 'male' ? 'm' : 'f',
    ]);
    if (
      key.includes('gender') ||
      key.includes('sex') ||
      field.options?.some((o) => /^(male|female|m|f)$/i.test(o))
    ) {
      return genderOpt ?? ctx.gender;
    }
    const fromOptions = pickOption(field.options);
    if (fromOptions !== null) return fromOptions;
  }

  if (key.includes('gender') || key.includes('sex')) {
    return pickOption(field.options, [ctx.gender]) ?? ctx.gender;
  }

  if (
    key.includes('first name') ||
    key === 'firstname' ||
    key === 'fname' ||
    key.includes('given name') ||
    rawName === 'firstname' ||
    rawName === 'fname'
  ) {
    return ctx.firstName;
  }

  if (
    key.includes('last name') ||
    key === 'lastname' ||
    key === 'lname' ||
    key.includes('surname') ||
    key.includes('family name') ||
    rawName === 'lastname' ||
    rawName === 'lname'
  ) {
    return ctx.lastName;
  }

  if (
    key.includes('full name') ||
    key.includes('display name') ||
    key === 'name' ||
    /(^| )name( |$)/.test(key)
  ) {
    if (!key.includes('user') && !key.includes('file') && !key.includes('company')) {
      return faker.person.fullName({
        firstName: ctx.firstName,
        lastName: ctx.lastName,
        sex: ctx.gender,
      });
    }
  }

  if (key.includes('user name') || key === 'username' || key === 'login' || key === 'user id') {
    return faker.internet.username({ firstName: ctx.firstName, lastName: ctx.lastName }).toLowerCase();
  }

  if (
    key.includes('dob') ||
    key.includes('birth') ||
    key.includes('date of birth') ||
    key.includes('birthday')
  ) {
    return faker.date.birthdate({ min: 18, max: 75, mode: 'age' }).toISOString().slice(0, 10);
  }

  if (key.includes('company') || key.includes('organization') || key.includes('organisation')) {
    return faker.company.name();
  }

  if (key.includes('job title') || key.includes('jobtitle') || key.includes('position') || key.includes('role')) {
    return faker.person.jobTitle();
  }

  if (
    key.includes('street') ||
    key.includes('address line') ||
    key === 'address' ||
    key.includes('address1') ||
    key.endsWith(' address')
  ) {
    return faker.location.streetAddress();
  }

  if (key.includes('city') || key.includes('town') || key.includes('locality')) {
    return faker.location.city();
  }

  if (key.includes('state') || key.includes('province') || key.includes('region')) {
    return faker.location.state();
  }

  if (key.includes('zip') || key.includes('postal') || key.includes('post code') || key.includes('postcode')) {
    return faker.location.zipCode();
  }

  if (key.includes('country')) {
    return ctx.country;
  }

  if (
    type === 'textarea' ||
    key.includes('description') ||
    key.includes('bio') ||
    key.includes('comment') ||
    key.includes('message')
  ) {
    return faker.lorem.sentence();
  }

  if (type.startsWith('select')) {
    const fromOptions = pickOption(field.options);
    if (fromOptions !== null) return fromOptions;
  }

  return faker.lorem.words({ min: 1, max: 3 });
}

export function generateValues(
  fields: FormFieldDescriptor[],
  options: GenerateOptions = {},
): GenerateResponse {
  const locale = resolveLocale(options.locale);
  const isNigeria = locale === 'en-NG' || locale === 'yo-NG';
  const emailDomains = parseEmailDomains(options.emailDomains);
  const country = LOCALE_COUNTRY[locale] ?? 'Nigeria';

  const gender = fakerEN_NG.helpers.arrayElement(['male', 'female'] as const);
  const firstName = fakerEN_NG.person.firstName(gender);
  const lastName = fakerEN_NG.person.lastName();
  const ctx: GenCtx = {
    locale,
    gender,
    firstName,
    lastName,
    emailDomains,
    country,
    isNigeria,
  };

  const values: Record<string, FieldValue> = {};
  for (const field of fields) {
    if (!field.name?.trim()) continue;
    values[field.name] = generateForField(field, ctx);
  }

  return { values };
}
