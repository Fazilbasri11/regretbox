import type { CemeteryStats, Grave } from '../types/grave';
import { DEMO_GRAVES, parseGraveNumberQuery } from '../utils/graves';
import { isSupabaseConfigured, supabase } from './supabase';

export async function fetchPublicGraves(zone = 'all'): Promise<{
  graves: Grave[];
  isDemoFallback: boolean;
}> {
  if (!isSupabaseConfigured || !supabase) {
    const filtered =
      zone === 'all' ? DEMO_GRAVES : DEMO_GRAVES.filter((g) => g.zone === zone);
    return {
      graves: [...filtered].sort((a, b) => b.slot_index - a.slot_index),
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
        isDemoFallback: false,
      };
    }
  } catch {
    // Fallback to direct view query during local Vite dev
  }

  let q = supabase
    .from('public_graves_view')
    .select('*')
    .order('slot_index', { ascending: false })
    .limit(200);

  if (zone && zone !== 'all') {
    q = q.eq('zone', zone);
  }

  const { data, error } = await q;
  if (error || !data || data.length === 0) {
    return {
      graves: [...DEMO_GRAVES].sort((a, b) => b.slot_index - a.slot_index),
      isDemoFallback: true,
    };
  }

  return {
    graves: data as Grave[],
    isDemoFallback: false,
  };
}

export async function fetchStats(): Promise<CemeteryStats> {
  if (!isSupabaseConfigured || !supabase) {
    const todayUtc = new Date().toISOString().slice(0, 10);
    const buriedToday = DEMO_GRAVES.filter((g) => g.created_at.slice(0, 10) === todayUtc).length;
    return {
      total: DEMO_GRAVES.length,
      buried_today: buriedToday,
    };
  }

  try {
    const res = await fetch('/api/stats');
    if (res.ok) {
      const data = await res.json();
      return {
        total: Number(data.total ?? 0),
        buried_today: Number(data.buried_today ?? 0),
      };
    }
  } catch {
    // Fallback to direct Supabase count
  }

  const utcDayStart = new Date();
  utcDayStart.setUTCHours(0, 0, 0, 0);

  const [totalRes, todayRes] = await Promise.all([
    supabase.from('public_graves_view').select('id', { count: 'exact', head: true }),
    supabase
      .from('public_graves_view')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', utcDayStart.toISOString()),
  ]);

  return {
    total: totalRes.count ?? DEMO_GRAVES.length,
    buried_today: todayRes.count ?? 0,
  };
}

export async function searchGraveByNumber(rawQuery: string): Promise<{
  grave: Grave | null;
  notFound: boolean;
}> {
  const num = parseGraveNumberQuery(rawQuery);
  if (num === null) {
    return { grave: null, notFound: true };
  }

  if (!isSupabaseConfigured || !supabase) {
    const match = DEMO_GRAVES.find((g) => g.grave_number === num) || null;
    return { grave: match, notFound: !match };
  }

  try {
    const res = await fetch(`/api/graves/search?q=${encodeURIComponent(String(num))}`);
    if (res.status === 404) {
      return { grave: null, notFound: true };
    }
    if (res.ok) {
      const payload = await res.json();
      return {
        grave: (payload.grave as Grave) || null,
        notFound: Boolean(payload.notFound || !payload.grave),
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
  };
}

export async function burySentence(input: {
  inscription: string;
  confirmed: boolean;
  website?: string;
}): Promise<Grave> {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Database is not connected yet. Configure VITE_SUPABASE_URL, SUPABASE_URL, and SUPABASE_SERVICE_ROLE_KEY in .env.local to bury permanent graves.',
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
    throw new Error('Reporting requires a connected database.');
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
