import type { Faker } from '@faker-js/faker';
// Keep locale imports minimal — same paths that already work on Vercel (/api/profile).
import { faker as fakerEN_US } from '@faker-js/faker/locale/en_US';
import { faker as fakerEN_NG } from '@faker-js/faker/locale/en_NG';
import { faker as fakerEN_GB } from '@faker-js/faker/locale/en_GB';

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

/** Person/name faker for a locale (Nigerian locales share en_NG data). */
function getFaker(locale: string): Faker {
  if (locale === 'en-NG' || locale === 'yo-NG' || locale === 'en-GH') {
    return fakerEN_NG;
  }
  if (locale === 'en-GB') return fakerEN_GB;
  return fakerEN_US;
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
  faker: Faker,
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
  return faker.helpers.arrayElement(options);
}

function buildEmail(
  faker: Faker,
  firstName: string,
  lastName: string,
  domains: string[],
): string {
  const domain = faker.helpers.arrayElement(domains);
  const local = faker.internet
    .username({ firstName, lastName })
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '');
  return `${local || 'user'}@${domain}`;
}

interface GenCtx {
  /** Names, company, username */
  person: Faker;
  /** Address, city, state, phone, zip — for NG locales this is always en_NG */
  place: Faker;
  locale: string;
  gender: 'male' | 'female';
  firstName: string;
  lastName: string;
  emailDomains: string[];
  country: string;
  isNigeria: boolean;
}

function generateForField(field: FormFieldDescriptor, ctx: GenCtx): FieldValue {
  const { person, place } = ctx;
  const type = (field.type || 'text').toLowerCase();
  const key = nameTokens(field.name);
  const rawName = field.name.toLowerCase();

  if (type === 'checkbox') {
    return person.datatype.boolean();
  }

  if (type === 'number' || type === 'range') {
    if (key.includes('age')) return person.number.int({ min: 18, max: 75 });
    return person.number.int({ min: 0, max: 1000 });
  }

  if (type === 'date') {
    return person.date.birthdate({ min: 18, max: 75, mode: 'age' }).toISOString().slice(0, 10);
  }

  if (type === 'datetime-local') {
    return person.date.recent().toISOString().slice(0, 16);
  }

  if (type === 'time') {
    return person.date.recent().toISOString().slice(11, 16);
  }

  if (type === 'month') {
    return person.date.recent().toISOString().slice(0, 7);
  }

  if (type === 'color') {
    return person.color.rgb({ format: 'hex' });
  }

  if (type === 'email' || key.includes('email') || key.includes('e mail')) {
    return buildEmail(person, ctx.firstName, ctx.lastName, ctx.emailDomains);
  }

  if (
    type === 'tel' ||
    key.includes('phone') ||
    key.includes('mobile') ||
    key.includes('telephone') ||
    /(^| )tel( |$)/.test(key)
  ) {
    return place.phone.number();
  }

  if (type === 'url' || key.includes('url') || key.includes('website') || key.includes('homepage')) {
    return person.internet.url();
  }

  if (type === 'password' || key.includes('password') || key.includes('passwd') || key === 'pwd') {
    return person.internet.password({ length: 14, memorable: false });
  }

  if (type === 'radio' || type.startsWith('select')) {
    const genderOpt = pickOption(person, field.options, [
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
    const fromOptions = pickOption(person, field.options);
    if (fromOptions !== null) return fromOptions;
  }

  if (key.includes('gender') || key.includes('sex')) {
    return pickOption(person, field.options, [ctx.gender]) ?? ctx.gender;
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
      return person.person.fullName({
        firstName: ctx.firstName,
        lastName: ctx.lastName,
        sex: ctx.gender,
      });
    }
  }

  if (key.includes('user name') || key === 'username' || key === 'login' || key === 'user id') {
    return person.internet.username({ firstName: ctx.firstName, lastName: ctx.lastName }).toLowerCase();
  }

  if (
    key.includes('dob') ||
    key.includes('birth') ||
    key.includes('date of birth') ||
    key.includes('birthday')
  ) {
    return person.date.birthdate({ min: 18, max: 75, mode: 'age' }).toISOString().slice(0, 10);
  }

  if (key.includes('company') || key.includes('organization') || key.includes('organisation')) {
    return person.company.name();
  }

  if (key.includes('job title') || key.includes('jobtitle') || key.includes('position') || key.includes('role')) {
    return person.person.jobTitle();
  }

  if (
    key.includes('street') ||
    key.includes('address line') ||
    key === 'address' ||
    key.includes('address1') ||
    key.endsWith(' address')
  ) {
    return place.location.streetAddress();
  }

  if (key.includes('city') || key.includes('town') || key.includes('locality')) {
    return place.location.city();
  }

  if (key.includes('state') || key.includes('province') || key.includes('region')) {
    if (ctx.isNigeria) return place.location.state();
    if (ctx.locale === 'en-US' || ctx.locale === 'en-CA' || ctx.locale === 'en-AU') {
      return place.location.state({ abbreviated: true });
    }
    return place.location.state();
  }

  if (key.includes('zip') || key.includes('postal') || key.includes('post code') || key.includes('postcode')) {
    return place.location.zipCode();
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
    return person.lorem.sentence();
  }

  if (type.startsWith('select')) {
    const fromOptions = pickOption(person, field.options);
    if (fromOptions !== null) return fromOptions;
  }

  return person.lorem.words({ min: 1, max: 3 });
}

export function generateValues(
  fields: FormFieldDescriptor[],
  options: GenerateOptions = {},
): GenerateResponse {
  const locale = resolveLocale(options.locale);
  const person = getFaker(locale);
  const isNigeria = locale === 'en-NG' || locale === 'yo-NG';
  // yo_NG location/phone fall back to US-style data — always use en_NG for places
  const place = isNigeria ? fakerEN_NG : person;
  const emailDomains = parseEmailDomains(options.emailDomains);
  const country = LOCALE_COUNTRY[locale] ?? place.location.country();

  const gender = person.helpers.arrayElement(['male', 'female'] as const);
  const firstName = person.person.firstName(gender);
  const lastName = person.person.lastName();
  const ctx: GenCtx = {
    person,
    place,
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
