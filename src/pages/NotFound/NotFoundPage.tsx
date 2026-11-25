import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <main className="app-main" style={{ maxWidth: 620, textAlign: 'center', paddingTop: '4rem' }}>
      <h1 className="serif" style={{ fontSize: '2.6rem', marginBottom: '0.5rem' }}>
        Lost in the Mist
      </h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        This path leads beyond the cemetery walls.
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <Link to="/" className="btn btn--secondary">
          Return Home
        </Link>
        <Link to="/cemetery" className="btn btn--primary">
          Enter Cemetery
        </Link>
      </div>
    </main>
  );
}
