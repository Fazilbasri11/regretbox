import type { VercelRequest, VercelResponse } from '@vercel/node';
import { checkRateLimit, getSupabaseAdmin, sendError } from '../_lib/supabaseAdmin.js';

const COLUMNS =
  'id, grave_number, slot_index, zone, inscription, pos_x, pos_y, pos_z, rotation_y, grave_style, created_at, is_demo';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return sendError(res, 405, 'Method not allowed');
  }

  if (!checkRateLimit(req, 'list', 80, 60_000)) {
    return sendError(res, 429, 'Too many requests.');
  }

  try {
    const admin = getSupabaseAdmin();
    const zone = typeof req.query.zone === 'string' ? req.query.zone : 'all';
    const limit = Math.min(300, Math.max(1, Number(req.query.limit) || 150));
    const offset = Math.max(0, Number(req.query.offset) || 0);

    let query = admin
      .from('public_graves_view')
      .select(COLUMNS, { count: 'exact' })
      .order('grave_number', { ascending: false })
      .range(offset, offset + limit - 1);

    if (zone && zone !== 'all') {
      query = query.eq('zone', zone);
    }

    const { data, count, error } = await query;
    if (error) {
      return sendError(res, 500, 'Failed to load cemetery graves.');
    }

    return res.status(200).json({
      graves: data || [],
      totalCount: count ?? (data?.length || 0),
    });
  } catch {
    return sendError(res, 500, 'Unexpected error loading graves.');
  }
}
