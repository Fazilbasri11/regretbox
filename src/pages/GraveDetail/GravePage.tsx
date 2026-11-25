import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Compass } from 'lucide-react';
import type { Grave } from '../../types/grave';
import { searchGraveByNumber } from '../../services/graves';
import { GraveDetailContent } from '../../components/GraveDetails/GraveDetailContent';

export function GravePage() {
  const { graveNumber } = useParams<{ graveNumber: string }>();
  const [grave, setGrave] = useState<Grave | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    searchGraveByNumber(graveNumber || '')
      .then((res) => setGrave(res.grave))
      .finally(() => setLoading(false));
  }, [graveNumber]);

  return (
    <main className="app-main" style={{ maxWidth: 680 }}>
      {loading ? (
        <div className="card">Loading monument...</div>
      ) : !grave ? (
        <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1.25rem' }}>
          <h1 className="serif" style={{ marginTop: 0 }}>
            Grave not found
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            No visible gravestone matches that number.
          </p>
          <Link to="/cemetery" className="btn btn--primary">
            Return to Cemetery
          </Link>
        </div>
      ) : (
        <div className="card">
          <GraveDetailContent grave={grave} />
          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
            <Link to={`/cemetery?grave=${grave.grave_number}`} className="btn btn--primary">
              <Compass size={16} />
              <span>Visit in 3D Cemetery</span>
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
