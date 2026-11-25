import type { CemeteryStats, Grave, RoseColor } from '../types/grave';
import { DEMO_GRAVES, parseGraveNumberQuery } from '../utils/graves';
import { isSupabaseConfigured, supabase } from './supabase';

const FLOWER_STORAGE_KEY = 'regretbox_flowers_v1';

interface StoredFlower {
  flower_count: number;
  flower_color: RoseColor;
}

function readLocalFlowers(): Record<string, StoredFlower> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(FLOWER_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function writeLocalFlower(graveId: string, entry: StoredFlower): void {
  if (typeof window === 'undefined') return;
  try {
    const current = readLocalFlowers();
    current[graveId] = entry;
    window.localStorage.setItem(FLOWER_STORAGE_KEY, JSON.stringify(current));
  } catch {
    // Ignore storage quota errors
  }
}

function applyLocalFlowerOverlay(grave: Grave, localMap = readLocalFlowers()): Grave {
  const local = localMap[grave.id];
  const baseCount = grave.flower_count ?? 0;
  const localCount = local?.flower_count ?? 0;
  const flower_count = Math.max(baseCount, localCount);
  const flower_color = grave.flower_color ?? local?.flower_color ?? null;
  return { ...grave, flower_count, flower_color };
}

export async function fetchPublicGraves(zone = 'all'): Promise<{
  graves: Grave[];
  isDemoFallback: boolean;
}> {
  const localFlowers = readLocalFlowers();
  if (!isSupabaseConfigured || !supabase) {
    const filtered =
      zone === 'all' ? DEMO_GRAVES : DEMO_GRAVES.filter((g) => g.zone === zone);
    return {
      graves: [...filtered]
        .sort((a, b) => b.slot_index - a.slot_index)
        .map((g) => applyLocalFlowerOverlay(g, localFlowers)),
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
        graves: ((payload.graves || []) as Grave[]).map((g) =>
          applyLocalFlowerOverlay(g, localFlowers),
        ),
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
      graves: [...DEMO_GRAVES]
        .sort((a, b) => b.slot_index - a.slot_index)
        .map((g) => applyLocalFlowerOverlay(g, localFlowers)),
      isDemoFallback: true,
    };
  }

  return {
    graves: (data as Grave[]).map((g) => applyLocalFlowerOverlay(g, localFlowers)),
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
    return {
      grave: match ? applyLocalFlowerOverlay(match) : null,
      notFound: !match,
    };
  }

  try {
    const res = await fetch(`/api/graves/search?q=${encodeURIComponent(String(num))}`);
    if (res.status === 404) {
      return { grave: null, notFound: true };
    }
    if (res.ok) {
      const payload = await res.json();
      const found = (payload.grave as Grave) || null;
      return {
        grave: found ? applyLocalFlowerOverlay(found) : null,
        notFound: Boolean(payload.notFound || !found),
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

  const found = (data as Grave) || null;
  return {
    grave: found ? applyLocalFlowerOverlay(found) : null,
    notFound: !found,
  };
}

export async function leaveRoseOnGrave(grave: Grave): Promise<{
  flower_count: number;
  flower_color: RoseColor;
}> {
  if (isSupabaseConfigured && !grave.is_demo) {
    try {
      const res = await fetch('/api/graves/flower', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ graveId: grave.id }),
      });
      if (res.ok) {
        const data = await res.json();
        const entry: StoredFlower = {
          flower_count: Number(data.flower_count ?? (grave.flower_count ?? 0) + 1),
          flower_color: data.flower_color === 'red' ? 'red' : 'white',
        };
        writeLocalFlower(grave.id, entry);
        return entry;
      }
    } catch {
      // Fallback to local update if endpoint unreachable during dev
    }
  }

  const existingColor = grave.flower_color ?? readLocalFlowers()[grave.id]?.flower_color;
  const chosenColor: RoseColor =
    existingColor === 'white' || existingColor === 'red'
      ? existingColor
      : Math.random() < 0.5
        ? 'white'
        : 'red';

  const nextEntry: StoredFlower = {
    flower_count: (grave.flower_count ?? 0) + 1,
    flower_color: chosenColor,
  };
  writeLocalFlower(grave.id, nextEntry);
  return nextEntry;
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
