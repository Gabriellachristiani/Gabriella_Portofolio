import type { VercelRequest, VercelResponse } from '@vercel/node';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const anon = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
const service = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const admin = (process.env.ADMIN_EMAIL || '').toLowerCase();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!['GET', 'POST', 'PUT'].includes(req.method || '')) {
    res.setHeader('Allow', 'GET, POST, PUT');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const token = (req.headers.authorization || '').replace(/^Bearer /, '');
    if (!token || !url || !anon || !admin) return res.status(401).json({ error: 'Unauthorized' });
    const auth = await fetch(`${url}/auth/v1/user`, { headers: { apikey: anon, Authorization: `Bearer ${token}` } });
    if (!auth.ok) return res.status(401).json({ error: 'Unauthorized' });
    const user = await auth.json();
    if (String(user.email || '').toLowerCase() !== admin) return res.status(403).json({ error: 'Forbidden' });

    const db = async (path: string, init: RequestInit = {}) => fetch(`${url}/rest/v1/${path}`, {
      ...init,
      headers: { apikey: service, Authorization: `Bearer ${service}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
    });

    if (req.method === 'GET') {
      const result = await db('portfolio_data?id=eq.1&select=content');
      if (!result.ok) return res.status(500).json({ error: await result.text() });
      const rows = await result.json();
      const mr = await db('contact_messages?select=*&order=created_at.desc');
      const messages = mr.ok ? await mr.json() : [];
      return res.status(200).json({ ...(rows?.[0]?.content || {}), messages });
    }
    const content = req.body?.content || req.body || {};
    const result = await db('portfolio_data?on_conflict=id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify({ id: 1, content, updated_at: new Date().toISOString() }),
    });
    if (!result.ok) return res.status(500).json({ error: await result.text() });
    return res.status(200).json({ success: true, ...(await result.json())?.[0] });
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : 'Internal server error' });
  }
}
