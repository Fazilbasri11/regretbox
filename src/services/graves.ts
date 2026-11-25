import type { Grave } from '../types/grave';
import { DEMO_GRAVES, parseGraveNumberQuery } from '../utils/graves';
import { isSupabaseConfigured, supabase } from './supabase';

export async function fetchPublicGraves(zone = 'all'): Promise<{
  graves: Grave[];
  totalCount: number;
  isDemoFallback: boolean;
}> {
  if (!isSupabaseConfigured || !supabase) {
    const filtered =
      zone === 'all' ? DEMO_GRAVES : DEMO_GRAVES.filter((g) => g.zone === zone);
    return {
      graves: filtered,
      totalCount: DEMO_GRAVES.length,
      isDemoFallback: true,
    };
  }

  try {
    const params = new URLSearchParams();
    if (zone && zone !== 'all') params.set('zone', zone);
    params.set('limit', '200');
    const res = await fetch(`/api/graves/list?${params.toString()}`);
    if (res.ok) {
      const payload = await res.json();
      return {
        graves: (payload.graves || []) as Grave[],
        totalCount: Number(payload.totalCount ?? payload.graves?.length ?? 0),
        isDemoFallback: false,
      };
    }
  } catch {
    // Fallback to direct read-only Supabase view during local Vite dev
  }

  let q = supabase
    .from('public_graves_view')
    .select('*', { count: 'exact' })
    .order('grave_number', { ascending: false })
    .limit(200);

  if (zone && zone !== 'all') {
    q = q.eq('zone', zone);
  }

  const { data, count, error } = await q;
  if (error) {
    return {
      graves: DEMO_GRAVES,
      totalCount: DEMO_GRAVES.length,
      isDemoFallback: true,
    };
  }

  return {
    graves: (data || []) as Grave[],
    totalCount: count ?? (data?.length || 0),
    isDemoFallback: false,
  };
}

export async function searchGraveByNumber(rawQuery: string): Promise<{
  grave: Grave | null;
  notFound: boolean;
  isDemoFallback: boolean;
}> {
  const num = parseGraveNumberQuery(rawQuery);
  if (num === null) {
    return { grave: null, notFound: true, isDemoFallback: !isSupabaseConfigured };
  }

  if (!isSupabaseConfigured || !supabase) {
    const match = DEMO_GRAVES.find((g) => g.grave_number === num) || null;
    return { grave: match, notFound: !match, isDemoFallback: true };
  }

  try {
    const res = await fetch(`/api/graves/search?q=${encodeURIComponent(String(num))}`);
    if (res.status === 404) {
      return { grave: null, notFound: true, isDemoFallback: false };
    }
    if (res.ok) {
      const payload = await res.json();
      return {
        grave: (payload.grave as Grave) || null,
        notFound: Boolean(payload.notFound || !payload.grave),
        isDemoFallback: false,
      };
    }
  } catch {
    // Fallback to direct view query
  }

  const { data } = await supabase
    .from('public_graves_view')
    .select('*')
    .eq('grave_number', num)
    .maybeSingle();

  return {
    grave: (data as Grave) || null,
    notFound: !data,
    isDemoFallback: false,
  };
}

export async function burySentence(input: {
  inscription: string;
  confirmed: boolean;
  website?: string;
}): Promise<Grave> {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Database is not connected yet. Configure VITE_SUPABASE_URL, SUPABASE_URL, and SUPABASE_SERVICE_ROLE_KEY in your environment to bury permanent public graves.',
    );
  }

  const res = await fetch('/api/graves/bury', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload.error || 'Could not bury this sentence right now.');
  }

  return payload.grave as Grave;
}

export async function reportGrave(graveId: string, reason: string): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error('Reporting is disabled in demonstration mode.');
  }

  const res = await fetch('/api/graves/report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ graveId, reason }),
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload.error || 'Failed to submit report.');
  }
}
