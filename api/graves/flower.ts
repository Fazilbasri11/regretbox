import type { VercelRequest, VercelResponse } from '@vercel/node';
import { checkRateLimit, getSupabaseAdmin, sendError } from '../_lib/supabaseAdmin.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return sendError(res, 405, 'Method not allowed');
  }

  if (!checkRateLimit(req, 'flower', 30, 60_000)) {
    return sendError(res, 429, 'Too many flowers placed too quickly. Please wait.');
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const graveId = typeof body.graveId === 'string' ? body.graveId.trim() : '';

    if (!graveId) {
      return sendError(res, 400, 'graveId is required.');
    }

    const admin = getSupabaseAdmin();
    const { data, error } = await admin.rpc('add_grave_flower', { p_grave_id: graveId });

    if (error) {
      return sendError(res, 500, 'Failed to leave a rose on this gravestone.');
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row) {
      return sendError(res, 404, 'Grave not found.');
    }

    return res.status(200).json({
      flower_count: Number(row.flower_count ?? 1),
      flower_color: row.flower_color === 'red' ? 'red' : 'white',
    });
  } catch {
    return sendError(res, 500, 'Unexpected error placing rose.');
  }
}
