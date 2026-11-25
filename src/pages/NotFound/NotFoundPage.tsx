import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="page-scroll">
      <div className="page-container" style={{ maxWidth: 560, textAlign: 'center', paddingTop: 90 }}>
        <h1 className="serif" style={{ fontSize: 44, marginBottom: 8 }}>
          Lost in the Mist
        </h1>
        <p style={{ color: 'var(--text-dim)', marginBottom: 24 }}>
          This path leads beyond the cemetery ironwork.
        </p>
        <Link to="/" className="btn btn--amber">
          Return to Cemetery
        </Link>
      </div>
    </div>
  );
}
