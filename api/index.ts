import type { VercelRequest, VercelResponse } from '@vercel/node';

/** GET /api — discovery + health-style ping */
export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  res.status(200).json({
    ok: true,
    service: 'filary-api',
    endpoints: {
      health: 'GET /api/health',
      generate: 'POST /api/generate',
      profile: 'GET /api/profile',
    },
  });
}
