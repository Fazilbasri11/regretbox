import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Copy, Flag, X } from 'lucide-react';
import type { Grave } from '../../types/grave';
import { formatBurialDate, formatGraveNumber, GRAVE_STYLE_LABELS, ZONE_LABELS } from '../../utils/graves';
import { reportGrave } from '../../services/graves';

interface GraveDetailContentProps {
  grave: Grave;
  onClose?: () => void;
}

export function GraveDetailContent({ grave, onClose }: GraveDetailContentProps) {
  const [copied, setCopied] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const zoneMeta = ZONE_LABELS[grave.zone];
  const permalink = `${window.location.origin}/graves/${grave.grave_number}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(permalink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setFeedback(`Permalink: /graves/${grave.grave_number}`);
    }
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    if (grave.is_demo) {
      setFeedback('Demonstration seed graves cannot be reported.');
      setReportOpen(false);
      return;
    }
    setSubmitting(true);
    try {
      await reportGrave(grave.id, reason);
      setFeedback('Report submitted. Thank you for helping keep the grounds respectful.');
      setReason('');
      setReportOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to report gravestone.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
        <div>
          <div style={{ fontSize: '0.76rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-dim)' }}>
            R.I.P.
          </div>
          <div className="mono" style={{ color: 'var(--accent-amber)', fontSize: '1.15rem', fontWeight: 700 }}>
            REGRET {formatGraveNumber(grave.grave_number)}
          </div>
        </div>

        {onClose ? (
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={onClose}
            aria-label="Close grave detail"
            style={{ minWidth: 44, minHeight: 44, padding: 0 }}
          >
            <X size={18} />
          </button>
        ) : null}
      </div>

      <blockquote
        className="serif"
        style={{
          margin: '1rem 0',
          padding: '1.05rem',
          borderLeft: '2px solid var(--accent-amber)',
          background: 'rgba(255,255,255,0.03)',
          fontSize: '1.45rem',
          lineHeight: 1.35,
          fontStyle: 'italic',
          wordBreak: 'break-word',
        }}
      >
        “{grave.inscription}”
      </blockquote>

      <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
        <div>Buried: {formatBurialDate(grave.created_at)}</div>
        <div>
          {zoneMeta?.title} · {GRAVE_STYLE_LABELS[grave.grave_style]}
          {grave.is_demo ? ' · Demonstration Grave' : ''}
        </div>
      </div>

      {error ? <div className="banner banner--error">{error}</div> : null}
      {feedback ? <div className="banner banner--success">{feedback}</div> : null}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        <button type="button" className="btn btn--secondary btn--sm" onClick={handleCopy}>
          {copied ? <Check size={14} /> : <Copy size={14} />}
          <span>{copied ? 'Link Copied' : 'Copy Permalink'}</span>
        </button>

        <Link to={`/graves/${grave.grave_number}`} className="btn btn--ghost btn--sm">
          Open Page
        </Link>

        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => setReportOpen((v) => !v)}
        >
          <Flag size={14} />
          <span>Report this gravestone</span>
        </button>
      </div>

      {reportOpen ? (
        <form
          onSubmit={handleReport}
          style={{ marginTop: '1rem', paddingTop: '0.9rem', borderTop: '1px solid var(--border-subtle)' }}
        >
          <div className="field">
            <label className="field__label" htmlFor={`report-reason-${grave.id}`}>
              Reason for report
            </label>
            <textarea
              id={`report-reason-${grave.id}`}
              className="textarea"
              style={{ minHeight: 78 }}
              maxLength={300}
              minLength={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Personal info, harassment, threats, spam, or illegal content..."
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="btn btn--danger btn--sm" disabled={submitting}>
              {submitting ? 'Sending...' : 'Submit Report'}
            </button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setReportOpen(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
