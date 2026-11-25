import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  checkRateLimit,
  getSupabaseAdmin,
  sanitizeSentence,
  sendError,
} from '../_lib/supabaseAdmin.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return sendError(res, 405, 'Method not allowed');
  }

  if (!checkRateLimit(req, 'report', 10, 60_000)) {
    return sendError(res, 429, 'Too many reports submitted. Please wait.');
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const graveId = typeof body.graveId === 'string' ? body.graveId.trim() : '';
    const reason = sanitizeSentence(body.reason, 300);

    if (!graveId) return sendError(res, 400, 'graveId is required.');
    if (reason.length < 3) return sendError(res, 400, 'Please enter a brief reason.');

    const admin = getSupabaseAdmin();
    const { data: grave } = await admin
      .from('public_graves_view')
      .select('id')
      .eq('id', graveId)
      .maybeSingle();

    if (!grave) return sendError(res, 404, 'Grave not found.');

    const { error } = await admin.from('grave_reports').insert({
      grave_id: graveId,
      reason,
    });

    if (error) return sendError(res, 500, 'Failed to submit report.');

    // Auto-flag for review if a gravestone receives 3+ reports
    const { count } = await admin
      .from('grave_reports')
      .select('id', { count: 'exact', head: true })
      .eq('grave_id', graveId);

    if ((count || 0) >= 3) {
      await admin
        .from('graves')
        .update({ moderation_status: 'flagged' })
        .eq('id', graveId)
        .eq('moderation_status', 'visible');
    }

    return res.status(200).json({ reported: true });
  } catch {
    return sendError(res, 500, 'Unexpected error submitting report.');
  }
}
