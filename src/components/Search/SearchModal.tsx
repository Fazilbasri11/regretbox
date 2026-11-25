import { useState } from 'react';
import { Search, X } from 'lucide-react';
import type { Grave } from '../../types/grave';
import { searchGraveByNumber } from '../../services/graves';

interface SearchModalProps {
  onClose: () => void;
  onFound: (grave: Grave) => void;
}

export function SearchModal({ onClose, onFound }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSearching(true);
    try {
      const res = await searchGraveByNumber(query);
      if (res.notFound || !res.grave) {
        setError('Grave not found');
        return;
      }
      onFound(res.grave);
    } catch {
      setError('Grave not found');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="search-modal-title"
      onClick={onClose}
    >
      <div className="modal-card" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 id="search-modal-title" className="serif" style={{ margin: 0, fontSize: 28, fontWeight: 600 }}>
            Find a Grave
          </h2>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={onClose}
            aria-label="Close search"
            style={{ width: 44, padding: 0, borderRadius: '50%' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="grave-search-input" style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>
            Grave Number
          </label>
          <input
            id="grave-search-input"
            className="input"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. #00291 or 00291"
            style={{ marginBottom: 12 }}
          />

          {error ? <div className="banner banner--error">{error}</div> : null}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn--amber" disabled={searching || !query.trim()}>
              <Search size={16} />
              <span>{searching ? 'Searching...' : 'Locate Grave'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
