import type { VercelRequest, VercelResponse } from '@vercel/node';
import { checkRateLimit, getSupabaseAdmin, sendError } from '../_lib/supabaseAdmin.js';

const COLUMNS =
  'id, grave_number, slot_index, zone, inscription, pos_x, pos_y, pos_z, rotation_y, grave_style, created_at, is_demo';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return sendError(res, 405, 'Method not allowed');
  }

  if (!checkRateLimit(req, 'search', 60, 60_000)) {
    return sendError(res, 429, 'Too many search requests.');
  }

  try {
    const raw = typeof req.query.q === 'string' ? req.query.q : '';
    const cleaned = raw.replace(/^#/, '').trim();
    if (!/^\d{1,7}$/.test(cleaned)) {
      return res.status(404).json({ notFound: true, message: 'Grave not found' });
    }

    const targetNumber = Number(cleaned);
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from('public_graves_view')
      .select(COLUMNS)
      .eq('grave_number', targetNumber)
      .maybeSingle();

    if (error) {
      return sendError(res, 500, 'Search failed.');
    }

    if (!data) {
      return res.status(404).json({ notFound: true, message: 'Grave not found' });
    }

    return res.status(200).json({ grave: data, notFound: false });
  } catch {
    return sendError(res, 500, 'Unexpected error searching grave.');
  }
}
