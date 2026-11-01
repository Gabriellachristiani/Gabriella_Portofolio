import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim().replace(/\/$/, '');
  const key = (process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim();
  const admin = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();

  const missing = [
    !url ? 'SUPABASE_URL (or VITE_SUPABASE_URL)' : null,
    !key ? 'VITE_SUPABASE_PUBLISHABLE_KEY' : null,
    !admin ? 'ADMIN_EMAIL' : null,
  ].filter((item): item is string => Boolean(item));

  if (missing.length) {
    return res.status(503).json({
      error: 'Supabase belum dikonfigurasi di Vercel.',
      missing,
      hint: 'Pastikan variabel tersedia untuk Production dan lakukan Redeploy deployment terbaru.',
    });
  }

  try {
    const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { apikey: key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: String(req.body?.email || '').trim(),
        password: String(req.body?.password || ''),
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.msg || data.message || data.error_description || 'Email atau password tidak valid.',
      });
    }

    if (String(data.user?.email || '').toLowerCase() !== admin) {
      return res.status(403).json({ error: 'Akun ini tidak memiliki akses administrator.' });
    }

    return res.status(200).json({
      token: data.access_token,
      user: { email: data.user.email, role: 'admin' },
    });
  } catch {
    return res.status(500).json({ error: 'Gagal menghubungi layanan autentikasi.' });
  }
}
