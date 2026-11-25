import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  checkRateLimit,
  getSupabaseAdmin,
  sanitizeSentence,
  sendError,
} from '../_lib/supabaseAdmin.js';
import { computeGravePlacement } from '../_lib/graveGrid.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return sendError(res, 405, 'Method not allowed');
  }

  if (!checkRateLimit(req, 'bury', 10, 60_000)) {
    return sendError(res, 429, 'Too many burials submitted. Please wait a minute.');
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};

    // Simple anti-spam honeypot
    if (typeof body.website === 'string' && body.website.trim().length > 0) {
      return sendError(res, 400, 'Invalid submission.');
    }

    if (body.confirmed !== true) {
      return sendError(res, 400, 'You must confirm public publication before burying.');
    }

    const inscription = sanitizeSentence(body.inscription, 120);
    if (inscription.length < 3) {
      return sendError(res, 400, 'Please write at least 3 characters.');
    }
    if (inscription.length > 120) {
      return sendError(res, 400, 'Sentence must be 120 characters or fewer.');
    }

    const admin = getSupabaseAdmin();

    // Find next deterministic slot index
    const { data: maxSlotRow } = await admin
      .from('graves')
      .select('slot_index')
      .order('slot_index', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextSlot = Math.max(10, (maxSlotRow?.slot_index ?? 9) + 1);
    const placement = computeGravePlacement(nextSlot);

    const { data, error } = await admin.rpc('create_public_grave', {
      p_inscription: inscription,
      p_grave_style: placement.graveStyle,
      p_zone: placement.zone,
      p_pos_x: placement.posX,
      p_pos_y: placement.posY,
      p_pos_z: placement.posZ,
      p_rotation_y: placement.rotationY,
      p_slot_index: placement.slotIndex,
    });

    if (error) {
      if (error.message?.includes('INVALID_INSCRIPTION_LENGTH')) {
        return sendError(res, 400, 'Sentence must be between 3 and 120 characters.');
      }
      return sendError(res, 500, 'Could not complete burial.');
    }

    return res.status(201).json({ grave: data });
  } catch {
    return sendError(res, 500, 'Unexpected server error while burying regret.');
  }
}
