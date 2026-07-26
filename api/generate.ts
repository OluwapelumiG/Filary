import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  generateValues,
  type FormFieldDescriptor,
} from './lib/generate';

function readBody(req: VercelRequest): Record<string, unknown> {
  const raw = req.body;
  if (raw == null) return {};
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (typeof raw === 'object') return raw as Record<string, unknown>;
  return {};
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const body = readBody(req);
    const fields = (body.fields ?? []) as FormFieldDescriptor[];
    if (!Array.isArray(fields)) {
      res.status(400).json({ error: 'body.fields must be an array' });
      return;
    }

    res.status(200).json(
      generateValues(fields, {
        locale: typeof body.locale === 'string' ? body.locale : undefined,
        emailDomains:
          typeof body.emailDomains === 'string' ? body.emailDomains : undefined,
      }),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('generate failed', error);
    res.status(500).json({ error: 'Generate failed', message });
  }
}
