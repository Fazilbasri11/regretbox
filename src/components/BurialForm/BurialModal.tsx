import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { APP_CONFIG } from '../../app/config';
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
  const [website, setWebsite] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedLength = inscription.trim().length;
  const isValid = trimmedLength >= MIN_INSCRIPTION_LENGTH && trimmedLength <= MAX_INSCRIPTION_LENGTH;

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
      setError('Please confirm public publication before burying.');
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
    <div
      className="modal-backdrop modal-backdrop--sheet"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bury-modal-title"
      onClick={onClose}
    >
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 id="bury-modal-title" className="serif" style={{ margin: 0, fontSize: 32, fontWeight: 600 }}>
            Add Your Regret
          </h2>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={onClose}
            aria-label="Close burial form"
            style={{ width: 44, padding: 0, borderRadius: '50%' }}
          >
            <X size={18} />
          </button>
        </div>

        {error ? <div className="banner banner--error">{error}</div> : null}

        <form onSubmit={handleSubmit}>
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

          <div style={{ marginBottom: 14 }}>
            <label
              htmlFor="regret-sentence"
              style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: 14, marginBottom: 8 }}
            >
              <span>What do you want to bury?</span>
              <span
                style={{
                  color:
                    inscription.length > MAX_INSCRIPTION_LENGTH
                      ? 'var(--accent-crimson)'
                      : 'var(--text-dim)',
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
          </div>

          <div
            className="banner"
            style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 14 }}
          >
            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2, color: 'var(--accent-amber)' }} />
            <span>
              Your sentence will be published on a public gravestone. It cannot be edited or taken back after burial. Do not include your name, contact details, or other personal information.
            </span>
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              marginBottom: 18,
              fontSize: 14,
              color: 'var(--text-dim)',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              style={{ marginTop: 3, minWidth: 18, minHeight: 18 }}
            />
            <span>I understand this sentence will be published publicly and cannot be edited or removed.</span>
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="btn btn--ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn--amber"
              disabled={submitting || !isValid || !confirmed}
            >
              {submitting ? 'Carving Stone...' : 'Bury It'}
            </button>
          </div>
        </form>

        <p
          style={{
            margin: '18px 0 0',
            textAlign: 'center',
            fontSize: 12,
            color: 'var(--text-dim)',
            fontStyle: 'italic',
          }}
        >
          {APP_CONFIG.tagline}
        </p>
      </div>
    </div>
  );
}
