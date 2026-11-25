import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, Compass, List, Plus, Search } from 'lucide-react';
import type { Grave } from '../../types/grave';
import { fetchPublicGraves, searchGraveByNumber } from '../../services/graves';
import { isSupabaseConfigured } from '../../services/supabase';
import { formatBurialDate, formatGraveNumber } from '../../utils/graves';
import { formatLocalClock, resolveTimeOfDay, TIME_THEMES } from '../../utils/timeTheme';

interface HomePageProps {
  onOpenBury: () => void;
}

export function HomePage({ onOpenBury }: HomePageProps) {
  const navigate = useNavigate();
  const [graves, setGraves] = useState<Grave[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isDemo, setIsDemo] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  const now = new Date();
  const timeOfDay = resolveTimeOfDay(now);
  const theme = TIME_THEMES[timeOfDay];

  useEffect(() => {
    fetchPublicGraves('all').then((res) => {
      setGraves(res.graves.slice(0, 3));
      setTotalCount(res.totalCount);
      setIsDemo(res.isDemoFallback);
    });
  }, []);

  const handleQuickSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError(null);
    if (!searchInput.trim()) return;
    setSearching(true);
    try {
      const res = await searchGraveByNumber(searchInput);
      if (res.notFound || !res.grave) {
        setSearchError('Grave not found');
        return;
      }
      navigate(`/cemetery?grave=${res.grave.grave_number}`);
    } catch {
      setSearchError('Grave not found');
    } finally {
      setSearching(false);
    }
  };

  return (
    <main className="app-main">
      {!isSupabaseConfigured || isDemo ? (
        <div className="banner">
          <span>
            <strong>Demonstration Grounds:</strong> Supabase environment variables are not configured yet, so you are viewing demonstration seed stones.
          </span>
          <Link to="/cemetery" className="btn btn--secondary btn--sm">
            Explore 3D Demo
          </Link>
        </div>
      ) : null}

      <section className="hero">
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.3rem 0.75rem',
            borderRadius: '999px',
            background: theme.uiAccentGlow,
            border: '1px solid var(--border-stone)',
            fontSize: '0.82rem',
            color: 'var(--text-ivory)',
            marginBottom: '0.75rem',
          }}
        >
          <Clock size={14} style={{ color: 'var(--accent-amber)' }} />
          <span>
            {formatLocalClock(now)} · {theme.label}
          </span>
        </div>

        <h1 className="hero__title">Some things deserve a proper burial.</h1>
        <p className="hero__subtitle">
          <em>Write it. Bury it. Let it rest.</em> Leave one honest sentence in stone—anonymous,
          uneditable, and placed into a quiet 3D cemetery shaped by your local hour.
        </p>

        <div className="hero__actions">
          <Link to="/cemetery" className="btn btn--primary">
            <Compass size={18} />
            <span>Explore Cemetery</span>
          </Link>
          <button type="button" className="btn btn--secondary" onClick={onOpenBury}>
            <Plus size={18} />
            <span>Bury a Regret</span>
          </button>
          <Link to="/cemetery?view=list" className="btn btn--ghost">
            <List size={18} />
            <span>2D List View</span>
          </Link>
        </div>

        <form
          onSubmit={handleQuickSearch}
          style={{
            maxWidth: 420,
            margin: '0 auto',
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap',
          }}
        >
          <label htmlFor="home-grave-search" className="sr-only">
            Search by grave number
          </label>
          <input
            id="home-grave-search"
            className="input mono"
            style={{ flex: '1 1 200px' }}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search grave # (e.g. #00291)"
          />
          <button type="submit" className="btn btn--secondary" disabled={searching}>
            <Search size={16} />
            <span>{searching ? 'Searching...' : 'Search'}</span>
          </button>
        </form>
        {searchError ? (
          <p style={{ color: '#f3b5b5', marginTop: '0.65rem', marginBottom: 0, fontSize: '0.88rem' }}>
            {searchError}
          </p>
        ) : null}

        <p style={{ marginTop: '1.35rem', marginBottom: 0, color: 'var(--text-dim)', fontSize: '0.88rem' }}>
          <strong style={{ color: 'var(--text-ivory)' }}>{totalCount}</strong> public{' '}
          {totalCount === 1 ? 'stone rests' : 'stones rest'} in these grounds.
        </p>
      </section>

      <section aria-labelledby="recent-stones-heading">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h2 id="recent-stones-heading" className="serif" style={{ margin: 0, fontSize: '1.7rem' }}>
            Quietly Laid to Rest
          </h2>
          <Link to="/cemetery?view=list" style={{ fontSize: '0.9rem' }}>
            View all stones →
          </Link>
        </div>

        <div className="grid-3">
          {graves.map((grave) => (
            <article key={grave.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', letterSpacing: '0.14em', color: 'var(--text-dim)' }}>
                    R.I.P.
                  </span>
                  <span className="mono" style={{ color: 'var(--accent-amber)', fontWeight: 600 }}>
                    {formatGraveNumber(grave.grave_number)}
                  </span>
                </div>
                <p className="serif" style={{ fontSize: '1.3rem', fontStyle: 'italic', margin: '0.35rem 0 0.85rem', lineHeight: 1.35 }}>
                  “{grave.inscription}”
                </p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                <span>Buried {formatBurialDate(grave.created_at)}</span>
                <Link to={`/cemetery?grave=${grave.grave_number}`}>Visit →</Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
