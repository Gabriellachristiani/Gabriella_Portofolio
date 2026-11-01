import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
  const admin = (process.env.ADMIN_EMAIL || '').toLowerCase();
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!url || !key || !admin || !token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const response = await fetch(`${url}/auth/v1/user`, { headers: { apikey: key, Authorization: `Bearer ${token}` } });
    if (!response.ok) return res.status(401).json({ error: 'Unauthorized' });
    const user = await response.json();
    if (String(user.email || '').toLowerCase() !== admin) return res.status(403).json({ error: 'Forbidden' });
    return res.status(200).json({ user: { email: user.email, role: 'admin' } });
  } catch {
    return res.status(500).json({ error: 'Gagal memverifikasi sesi admin.' });
  }
}
