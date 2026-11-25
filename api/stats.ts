import type { VercelRequest, VercelResponse } from '@vercel/node';
import { checkRateLimit, getSupabaseAdmin, sendError } from './_lib/supabaseAdmin.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return sendError(res, 405, 'Method not allowed');
  }

  if (!checkRateLimit(req, 'stats', 90, 60_000)) {
    return sendError(res, 429, 'Too many requests.');
  }

  try {
    const admin = getSupabaseAdmin();
    const utcDayStart = new Date();
    utcDayStart.setUTCHours(0, 0, 0, 0);

    const [totalRes, todayRes] = await Promise.all([
      admin
        .from('graves')
        .select('id', { count: 'exact', head: true })
        .eq('moderation_status', 'visible'),
      admin
        .from('graves')
        .select('id', { count: 'exact', head: true })
        .eq('moderation_status', 'visible')
        .gte('created_at', utcDayStart.toISOString()),
    ]);

    if (totalRes.error || todayRes.error) {
      return sendError(res, 500, 'Failed to fetch cemetery statistics.');
    }

    return res.status(200).json({
      total: totalRes.count ?? 0,
      buried_today: todayRes.count ?? 0,
    });
  } catch {
    return sendError(res, 500, 'Unexpected error fetching stats.');
  }
}
