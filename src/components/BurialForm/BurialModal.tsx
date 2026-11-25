import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import type { Grave } from '../../types/grave';
import { MAX_INSCRIPTION_LENGTH, MIN_INSCRIPTION_LENGTH } from '../../utils/graves';
import { burySentence } from '../../services/graves';

interface BurialModalProps {
  onClose: () => void;
  onBuried: (grave: Grave) => void;
}

export function BurialModal({ onClose, onBuried }: BurialModalProps) {
  const [inscription, setInscription] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [website, setWebsite] = useState(''); // Honeypot anti-spam
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedLength = inscription.trim().length;
  const isLengthValid =
    trimmedLength >= MIN_INSCRIPTION_LENGTH && trimmedLength <= MAX_INSCRIPTION_LENGTH;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleaned = inscription.replace(/\s+/g, ' ').trim();
    if (cleaned.length < MIN_INSCRIPTION_LENGTH) {
      setError(`Please write at least ${MIN_INSCRIPTION_LENGTH} characters.`);
      return;
    }
    if (cleaned.length > MAX_INSCRIPTION_LENGTH) {
      setError(`Sentence must be ${MAX_INSCRIPTION_LENGTH} characters or fewer.`);
      return;
    }
    if (!confirmed) {
      setError('Please confirm that you understand this stone is public and permanent.');
      return;
    }

    setSubmitting(true);
    try {
      const grave = await burySentence({
        inscription: cleaned,
        confirmed: true,
        website,
      });
      onBuried(grave);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to bury your sentence.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="bury-modal-title">
      <div className="modal-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
          <h2 id="bury-modal-title" className="serif" style={{ margin: 0, fontSize: '1.9rem' }}>
            Bury a Regret
          </h2>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={onClose}
            aria-label="Close burial form"
            style={{ minWidth: 44, minHeight: 44, padding: 0 }}
          >
            <X size={18} />
          </button>
        </div>

        <p style={{ color: 'var(--text-muted)', marginTop: 0, fontSize: '0.92rem' }}>
          Write it. Bury it. Let it rest. No account is created, and nothing is kept in a private history.
        </p>

        {error ? <div className="banner banner--error">{error}</div> : null}

        <form onSubmit={handleSubmit}>
          {/* Anti-spam honeypot */}
          <div className="sr-only" aria-hidden="true">
            <label htmlFor="rb-website">Website</label>
            <input
              id="rb-website"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="regret-sentence">
              <span>What do you want to bury?</span>
              <span
                className="mono field__hint"
                style={{
                  color:
                    inscription.length > MAX_INSCRIPTION_LENGTH
                      ? 'var(--accent-crimson)'
                      : 'var(--text-muted)',
                }}
              >
                {inscription.length} / {MAX_INSCRIPTION_LENGTH}
              </span>
            </label>
            <textarea
              id="regret-sentence"
              className="textarea"
              maxLength={MAX_INSCRIPTION_LENGTH}
              required
              autoFocus
              value={inscription}
              onChange={(e) => setInscription(e.target.value)}
              placeholder="Write one sentence. Leave it here."
            />
            <span className="field__hint">
              One sentence only (3–120 characters). HTML tags are removed.
            </span>
          </div>

          <div
            style={{
              padding: '0.85rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(224, 159, 62, 0.36)',
              background: 'rgba(224, 159, 62, 0.08)',
              marginBottom: '1rem',
              fontSize: '0.84rem',
              color: '#f2d39c',
              display: 'flex',
              gap: '0.6rem',
              alignItems: 'flex-start',
            }}
          >
            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>
              Your sentence will be published on a public gravestone. It cannot be edited or taken back after burial. Do not include your name, contact details, or other personal information.
            </span>
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.6rem',
              marginBottom: '1.25rem',
              fontSize: '0.88rem',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              style={{ marginTop: 4, minWidth: 18, minHeight: 18 }}
            />
            <span>I understand my sentence becomes a permanent public gravestone.</span>
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
            <button type="button" className="btn btn--ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={submitting || !isLengthValid || !confirmed}
            >
              {submitting ? 'Carving Stone...' : 'Bury It'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
