import { useState } from 'react';
import { Check, Copy, Flag, Flower2, X } from 'lucide-react';
import { APP_CONFIG } from '../../app/config';
import type { Grave } from '../../types/grave';
import { formatBurialDate, formatGraveNumber } from '../../utils/graves';
import { reportGrave } from '../../services/graves';

interface GraveDetailContentProps {
  grave: Grave;
  onClose?: () => void;
  onLeaveRose?: (grave: Grave) => Promise<void> | void;
  roseSubmitting?: boolean;
}

export function GraveDetailContent({
  grave,
  onClose,
  onLeaveRose,
  roseSubmitting = false,
}: GraveDetailContentProps) {
  const [copied, setCopied] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const padded = String(grave.grave_number).padStart(5, '0');
  const permalink = `${window.location.origin}/grave/${padded}`;
  const flowerCount = grave.flower_count ?? 0;
  const roseColorLabel =
    grave.flower_color === 'red' ? 'Red rose' : grave.flower_color === 'white' ? 'White rose' : null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(permalink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setFeedback(`Link: /grave/${padded}`);
    }
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    if (grave.is_demo) {
      setFeedback('Demonstration seed gravestones cannot be reported.');
      setReportOpen(false);
      return;
    }
    setSubmitting(true);
    try {
      await reportGrave(grave.id, reason);
      setFeedback('Thank you. Your report has been recorded.');
      setReason('');
      setReportOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <div style={{ fontSize: 12, letterSpacing: '0.18em', color: 'var(--text-dim)' }}>R.I.P.</div>
          <div className="serif" style={{ fontSize: 26, fontWeight: 600, color: 'var(--accent-amber)' }}>
            Regret {formatGraveNumber(grave.grave_number)}
          </div>
        </div>

        {onClose ? (
          <button
            type="button"
            className="btn btn--ghost"
            onClick={onClose}
            aria-label="Close grave detail"
            style={{ width: 44, padding: 0, borderRadius: '50%' }}
          >
            <X size={18} />
          </button>
        ) : null}
      </div>

      <blockquote
        className="serif"
        style={{
          margin: '14px 0',
          padding: '14px 16px',
          borderLeft: '2px solid var(--accent-amber)',
          background: 'rgba(255, 255, 255, 0.04)',
          fontSize: 23,
          lineHeight: 1.32,
          fontStyle: 'italic',
          wordBreak: 'break-word',
        }}
      >
        “{grave.inscription}”
      </blockquote>

      <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 8 }}>
        {APP_CONFIG.graveDateLabel} {formatBurialDate(grave.created_at)}
      </div>

      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 13,
          color: 'var(--text-ivory)',
          padding: '6px 12px',
          borderRadius: 999,
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: 16,
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 9,
            height: 9,
            borderRadius: '50%',
            background:
              grave.flower_color === 'red'
                ? '#e04858'
                : grave.flower_color === 'white'
                  ? '#f4f0e6'
                  : 'rgba(255, 255, 255, 0.25)',
            boxShadow:
              flowerCount > 0
                ? grave.flower_color === 'red'
                  ? '0 0 8px rgba(224, 72, 88, 0.65)'
                  : '0 0 8px rgba(244, 240, 230, 0.6)'
                : 'none',
          }}
        />
        <span>
          {flowerCount === 0
            ? 'No roses left yet'
            : `${flowerCount} ${flowerCount === 1 ? 'Rose' : 'Roses'} left${roseColorLabel ? ` · ${roseColorLabel} on stone` : ''}`}
        </span>
      </div>

      {error ? <div className="banner banner--error">{error}</div> : null}
      {feedback ? <div className="banner banner--success">{feedback}</div> : null}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {onLeaveRose ? (
          <button
            type="button"
            className="btn btn--amber"
            disabled={roseSubmitting}
            onClick={() => onLeaveRose(grave)}
          >
            <Flower2 size={15} />
            <span>{roseSubmitting ? 'Placing...' : 'Leave a Rose'}</span>
          </button>
        ) : null}

        <button type="button" className="btn btn--ghost" onClick={handleCopy}>
          {copied ? <Check size={15} /> : <Copy size={15} />}
          <span>{copied ? 'Copied' : 'Copy link'}</span>
        </button>

        <button type="button" className="btn btn--ghost" onClick={() => setReportOpen((v) => !v)}>
          <Flag size={15} />
          <span>Report this gravestone</span>
        </button>
      </div>

      {reportOpen ? (
        <form
          onSubmit={handleReport}
          style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.1)' }}
        >
          <label htmlFor={`report-${grave.id}`} style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>
            Reason for report
          </label>
          <textarea
            id={`report-${grave.id}`}
            className="textarea"
            style={{ minHeight: 78, marginBottom: 10 }}
            maxLength={300}
            minLength={3}
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Personal info, harassment, threats, spam..."
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="btn btn--danger" disabled={submitting}>
              {submitting ? 'Sending...' : 'Submit Report'}
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => setReportOpen(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
