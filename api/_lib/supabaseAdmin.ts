import crypto from 'node:crypto';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('Server Supabase configuration missing (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).');
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function getClientHash(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const rawIp =
    typeof forwarded === 'string'
      ? forwarded.split(',')[0].trim()
      : Array.isArray(forwarded)
        ? forwarded[0]
        : req.socket?.remoteAddress || 'unknown';

  const secret = process.env.RATE_LIMIT_SECRET || 'regretbox-ephemeral-salt';
  return crypto.createHmac('sha256', secret).update(rawIp).digest('hex').slice(0, 24);
}

export function checkRateLimit(
  req: VercelRequest,
  bucket: string,
  maxRequests = 20,
  windowMs = 60_000,
): boolean {
  const key = `${bucket}:${getClientHash(req)}`;
  const now = Date.now();
  const existing = rateLimitStore.get(key);

  if (!existing || now > existing.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (existing.count >= maxRequests) {
    return false;
  }

  existing.count += 1;
  return true;
}

export function sanitizeSentence(input: unknown, maxLength = 120): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

export function sendError(res: VercelResponse, status: number, message: string) {
  return res.status(status).json({ error: message });
}
