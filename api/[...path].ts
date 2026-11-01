import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();

function send(res: VercelResponse, status: number, body: unknown) {
  return res.status(status).json(body);
}
function tokenFrom(req: VercelRequest) {
  const value = req.headers.authorization || '';
  return value.startsWith('Bearer ') ? value.slice(7) : '';
}
async function supabase(path: string, init: RequestInit = {}, service = false) {
  if (!supabaseUrl || !(service ? serviceKey : anonKey)) throw new Error('Supabase environment variables are missing.');
  const key = service ? serviceKey! : anonKey!;
  return fetch(`${supabaseUrl}/${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${service ? key : (init.headers as Record<string,string> | undefined)?.Authorization?.replace(/^Bearer /, '') || key}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
}
async function authenticatedUser(req: VercelRequest) {
  const token = tokenFrom(req);
  if (!token) return null;
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: anonKey!, Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return null;
  const user = await response.json();
  if (!adminEmail || String(user.email || '').toLowerCase() !== adminEmail) return null;
  return user;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const path = '/' + String(req.query.path || '');
  try {
    if (req.method === 'GET' && path === '/public/portfolio') {
      const r = await supabase('rest/v1/portfolio_data?id=eq.1&select=content', {}, true);
      if (!r.ok) return send(res, 200, null);
      const rows = await r.json();
      return send(res, 200, rows?.[0]?.content || null);
    }

    if (req.method === 'POST' && path === '/auth/login') {
      if (!supabaseUrl || !anonKey) return send(res, 503, { error: 'Supabase belum dikonfigurasi di Vercel.' });
      const { email, password } = req.body || {};
      const r = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { apikey: anonKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: String(email || '').trim(), password: String(password || '') }),
      });
      const data = await r.json();
      if (!r.ok) return send(res, r.status, { error: data.msg || data.message || data.error_description || 'Email atau password tidak valid.' });
      if (!adminEmail || String(data.user?.email || '').toLowerCase() !== adminEmail) return send(res, 403, { error: 'Akun ini tidak memiliki akses administrator.' });
      return send(res, 200, { token: data.access_token, user: { email: data.user.email, role: 'admin' } });
    }

    if (req.method === 'GET' && path === '/auth/me') {
      const user = await authenticatedUser(req);
      return user ? send(res, 200, { user: { email: user.email, role: 'admin' } }) : send(res, 401, { error: 'Unauthorized' });
    }
    if (req.method === 'POST' && path === '/auth/logout') return send(res, 200, { success: true });

    const user = await authenticatedUser(req);
    if (!user) return send(res, 401, { error: 'Sesi admin tidak valid atau ADMIN_EMAIL belum sesuai.' });

    if (path === '/admin/portfolio' && req.method === 'GET') {
      const r = await supabase('rest/v1/portfolio_data?id=eq.1&select=content', {}, true);
      if (!r.ok) throw new Error(await r.text());
      const rows = await r.json();
      const content = rows?.[0]?.content || {};
      const messagesResponse = await supabase('rest/v1/contact_messages?select=*&order=created_at.desc', {}, true);
      const messages = messagesResponse.ok ? await messagesResponse.json() : [];
      return send(res, 200, { ...content, messages });
    }
    if (path === '/admin/portfolio' && ['PUT','POST'].includes(req.method || '')) {
      const content = req.body?.content || req.body;
      const r = await supabase('rest/v1/portfolio_data?on_conflict=id', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify({ id: 1, content, updated_at: new Date().toISOString() }),
      }, true);
      if (!r.ok) throw new Error(await r.text());
      return send(res, 200, { success: true, ...(await r.json())?.[0] });
    }
    if (path === '/admin/media' && req.method === 'GET') return send(res, 200, { media: [] });
    if (path === '/admin/trusted-devices' && req.method === 'GET') return send(res, 200, { totalTrustedDevices: 0, isCurrentDeviceTrusted: false, currentExpiresAt: null, devices: [] });
    if (path === '/admin/mfa/status' && req.method === 'GET') return send(res, 200, { mfaEnabled: false, enrolledAt: null, totalRecoveryCodes: 0, remainingRecoveryCodes: 0 });
    if (path.startsWith('/admin/mfa/') || path === '/auth/change-password') return send(res, 501, { error: 'Fitur keamanan lanjutan perlu dihubungkan ke Supabase Auth MFA.' });
    if (path.startsWith('/admin/')) return send(res, 501, { error: 'Endpoint ini belum dimigrasikan. Gunakan penyimpanan portfolio utama terlebih dahulu.' });
    return send(res, 404, { error: 'API route not found' });
  } catch (error) {
    console.error('API error:', error);
    return send(res, 500, { error: error instanceof Error ? error.message : 'Internal server error' });
  }
}
