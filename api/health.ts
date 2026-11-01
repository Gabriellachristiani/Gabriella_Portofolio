import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  const publishableKey = (process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || '').trim();
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const adminEmail = (process.env.ADMIN_EMAIL || '').trim();

  return res.status(200).json({
    ok: true,
    service: 'portfolio-api',
    environment: {
      supabaseUrlConfigured: Boolean(supabaseUrl),
      publishableKeyConfigured: Boolean(publishableKey),
      adminEmailConfigured: Boolean(adminEmail),
      serviceRoleKeyConfigured: Boolean(serviceRoleKey),
    },
  });
}
