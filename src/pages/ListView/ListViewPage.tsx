import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Compass, Plus } from 'lucide-react';
import type { CemeteryZone, Grave } from '../../types/grave';
import { fetchPublicGraves } from '../../services/graves';
import { formatBurialDate, formatGraveNumber, ZONE_LABELS } from '../../utils/graves';

interface ListViewPageProps {
  onOpenBury: () => void;
}

export function ListViewPage({ onOpenBury }: ListViewPageProps) {
  const [graves, setGraves] = useState<Grave[]>([]);
  const [query, setQuery] = useState('');
  const [zone, setZone] = useState<string>('all');

  useEffect(() => {
    fetchPublicGraves('all').then((res) => setGraves(res.graves));
  }, []);

  const filtered = useMemo(() => {
    const clean = query.replace(/^#/, '').trim();
    return graves.filter((g) => {
      if (zone !== 'all' && g.zone !== zone) return false;
      if (!clean) return true;
      return String(g.grave_number).includes(clean);
    });
  }, [graves, query, zone]);

  return (
    <div className="page-scroll">
      <div className="page-container">
        <header style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div>
            <Link to="/" className="brand-lockup" style={{ marginBottom: 6 }}>
              <span className="brand-stone" aria-hidden="true">R</span>
              <span className="brand-wordmark">RegretBox</span>
            </Link>
            <h1 className="serif" style={{ margin: '6px 0 0', fontSize: 34 }}>
              Cemetery Directory (2D List View)
            </h1>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <Link to="/" className="btn btn--ghost">
              <Compass size={16} />
              <span>Enter 3D Cemetery</span>
            </Link>
            <button type="button" className="btn btn--amber" onClick={onOpenBury}>
              <Plus size={16} />
              <span>Add Your Regret</span>
            </button>
          </div>
        </header>

        <div className="glass-card" style={{ padding: 16, marginBottom: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <div>
            <label htmlFor="list-num" style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>
              Search by Grave #
            </label>
            <input
              id="list-num"
              className="input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. 00291"
            />
          </div>
          <div>
            <label htmlFor="list-zone" style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>
              Zone
            </label>
            <select
              id="list-zone"
              className="select"
              value={zone}
              onChange={(e) => setZone(e.target.value)}
            >
              <option value="all">All Grounds</option>
              {(Object.keys(ZONE_LABELS) as CemeteryZone[]).map((z) => (
                <option key={z} value={z}>
                  {ZONE_LABELS[z].title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="glass-card" style={{ padding: 36, textAlign: 'center', color: 'var(--text-dim)' }}>
            Grave not found
          </div>
        ) : (
          <div className="grid-3">
            {filtered.map((g) => (
              <article key={g.id} className="glass-card" style={{ padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, letterSpacing: '0.16em', color: 'var(--text-dim)' }}>R.I.P.</span>
                  <span style={{ color: 'var(--accent-amber)', fontWeight: 600 }}>
                    Regret {formatGraveNumber(g.grave_number)}
                  </span>
                </div>
                <p className="serif" style={{ fontSize: 22, fontStyle: 'italic', margin: '8px 0 14px', lineHeight: 1.3 }}>
                  “{g.inscription}”
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-dim)' }}>
                  <span>Buried: {formatBurialDate(g.created_at)}</span>
                  <Link to={`/grave/${String(g.grave_number).padStart(5, '0')}`}>Inspect →</Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
