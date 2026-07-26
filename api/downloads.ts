import type { VercelRequest, VercelResponse } from '@vercel/node';

const COUNTER_BASE =
  'https://api.counterapi.dev/v1/filary/extension-downloads';

function cors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function parseCount(data: unknown): number | null {
  if (!data || typeof data !== 'object') return null;
  const record = data as Record<string, unknown>;
  const raw = record.count ?? record.value;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string' && raw.trim() !== '' && Number.isFinite(Number(raw))) {
    return Number(raw);
  }
  return null;
}

async function readCount(): Promise<number> {
  const res = await fetch(`${COUNTER_BASE}/`);
  const data = await res.json().catch(() => null);

  if (res.status === 404 || res.status === 400) {
    const message = String((data as { message?: string } | null)?.message ?? '');
    if (/not found/i.test(message) || res.status === 404) return 0;
  }

  if (!res.ok) throw new Error(`counter get failed: ${res.status}`);
  const count = parseCount(data);
  if (count === null) throw new Error('counter get returned no count');
  return count;
}

async function hitCount(): Promise<number> {
  const res = await fetch(`${COUNTER_BASE}/up`);
  if (!res.ok) throw new Error(`counter up failed: ${res.status}`);
  const data = await res.json();
  const count = parseCount(data);
  if (count === null) throw new Error('counter up returned no count');
  return count;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      const count = await readCount();
      res.status(200).json({ count });
      return;
    }

    if (req.method === 'POST') {
      const count = await hitCount();
      res.status(200).json({ count });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Counter unavailable';
    res.status(502).json({ error: message, count: null });
  }
}
