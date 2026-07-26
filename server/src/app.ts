import express, { type Express } from 'express';
import { faker as fakerEN_NG } from '@faker-js/faker/locale/en_NG';
import type { FormProfile } from './types/form-profile.js';
import {
  generateValues,
  type FormFieldDescriptor,
} from './generate.js';

const BASE_PATH = '/api';

function generateProfile(): FormProfile {
  const faker = fakerEN_NG;
  const gender = faker.helpers.arrayElement(['male', 'female'] as const);
  const firstName = faker.person.firstName(gender);
  const lastName = faker.person.lastName();
  const fullName = faker.person.fullName({ firstName, lastName, sex: gender });
  const domain = faker.helpers.arrayElement([
    'gmail.com',
    'yahoo.com',
    'outlook.com',
  ]);
  const local = faker.internet
    .username({ firstName, lastName })
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '');

  return {
    firstName,
    lastName,
    fullName,
    email: `${local || 'user'}@${domain}`,
    phone: faker.phone.number(),
    gender,
    dateOfBirth: faker.date
      .birthdate({ min: 18, max: 75, mode: 'age' })
      .toISOString()
      .slice(0, 10),
    username: faker.internet.username({ firstName, lastName }).toLowerCase(),
    password: faker.internet.password({ length: 14, memorable: false }),
    company: faker.company.name(),
    jobTitle: faker.person.jobTitle(),
    address: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state(),
    zipCode: faker.location.zipCode(),
    country: 'Nigeria',
    url: faker.internet.url(),
  };
}

export function createApp(): Express {
  const app = express();

  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  app.use(express.json({ limit: '1mb' }));

  app.post(`${BASE_PATH}/generate`, (req, res) => {
    const fields = (req.body?.fields ?? []) as FormFieldDescriptor[];
    if (!Array.isArray(fields)) {
      res.status(400).json({ error: 'body.fields must be an array' });
      return;
    }
    res.json(
      generateValues(fields, {
        locale: typeof req.body?.locale === 'string' ? req.body.locale : undefined,
        emailDomains:
          typeof req.body?.emailDomains === 'string'
            ? req.body.emailDomains
            : undefined,
      }),
    );
  });

  app.get(`${BASE_PATH}/profile`, (_req, res) => {
    res.json(generateProfile());
  });

  app.get(`${BASE_PATH}/profiles`, (_req, res) => {
    res.json(Array.from({ length: 3 }, () => generateProfile()));
  });

  app.get(`${BASE_PATH}/health`, (_req, res) => {
    res.json({ ok: true, service: 'filary-api' });
  });

  return app;
}
