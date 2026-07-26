import type { VercelRequest, VercelResponse } from '@vercel/node';
import { faker as fakerEN_NG } from '@faker-js/faker/locale/en_NG';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const faker = fakerEN_NG;
  const gender = faker.helpers.arrayElement(['male', 'female'] as const);
  const firstName = faker.person.firstName(gender);
  const lastName = faker.person.lastName();
  const domain = faker.helpers.arrayElement([
    'gmail.com',
    'yahoo.com',
    'outlook.com',
  ]);
  const local = faker.internet
    .username({ firstName, lastName })
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '');

  res.status(200).json({
    firstName,
    lastName,
    fullName: faker.person.fullName({ firstName, lastName, sex: gender }),
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
  });
}
