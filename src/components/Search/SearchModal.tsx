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
      const result = await searchGraveByNumber(query);
      if (result.notFound || !result.grave) {
        setError('Grave not found');
        return;
      }
      onFound(result.grave);
    } catch {
      setError('Grave not found');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="search-modal-title">
      <div className="modal-panel" style={{ maxWidth: 440 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h2 id="search-modal-title" className="serif" style={{ margin: 0, fontSize: '1.7rem' }}>
            Find a Grave
          </h2>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={onClose}
            aria-label="Close search"
            style={{ minWidth: 44, minHeight: 44, padding: 0 }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label className="field__label" htmlFor="grave-search-input">
              Grave Number
            </label>
            <input
              id="grave-search-input"
              className="input mono"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. #00291 or 291"
            />
          </div>

          {error ? <div className="banner banner--error">{error}</div> : null}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={searching || !query.trim()}>
              <Search size={16} />
              <span>{searching ? 'Searching...' : 'Locate Grave'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
