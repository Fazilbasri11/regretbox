import { useEffect } from 'react';
import { Flower2, Sparkles, X } from 'lucide-react';

interface AboutModalProps {
  onClose: () => void;
}

export function AboutModal({ onClose }: AboutModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-modal-title"
      onClick={onClose}
    >
      <div className="modal-card" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-dim)' }}>
              The Stone Pavilion
            </div>
            <h2 id="about-modal-title" className="serif" style={{ margin: '2px 0 0', fontSize: 30, fontWeight: 600 }}>
              About RegretBox
            </h2>
          </div>

          <button
            type="button"
            className="btn btn--ghost"
            onClick={onClose}
            aria-label="Close about dialog"
            style={{ width: 44, padding: 0, borderRadius: '50%' }}
          >
            <X size={18} />
          </button>
        </div>

        <p style={{ margin: '0 0 14px', color: 'var(--text-ivory)', lineHeight: 1.65 }}>
          <strong>RegretBox</strong> is a quiet, anonymous 3D sanctuary where unspoken regrets, missed chances,
          and heavy memories are etched into stone and laid to rest under the open sky.
        </p>

        <div
          style={{
            display: 'grid',
            gap: 10,
            padding: '14px 16px',
            borderRadius: 14,
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: 18,
            fontSize: 14,
            color: 'var(--text-dim)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <Sparkles size={16} style={{ color: 'var(--accent-amber)', flexShrink: 0, marginTop: 3 }} />
            <span>
              <strong style={{ color: 'var(--text-ivory)' }}>Leave a Burden Behind:</strong> Click the wooden{' '}
              <em>Add Your Regret</em> sign to carve a single anonymous sentence onto your own numbered headstone.
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <Flower2 size={16} style={{ color: '#e68893', flexShrink: 0, marginTop: 3 }} />
            <span>
              <strong style={{ color: 'var(--text-ivory)' }}>Offer a Rose:</strong> Click any gravestone to read its story
              and leave a white or red rose. One symbolic rose rests upon the stone while every tribute is counted on its card.
            </span>
          </div>

          <div style={{ fontSize: 13, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <strong style={{ color: 'var(--text-ivory)' }}>Explore:</strong> Drag to look around, use{' '}
            <code>WASD</code> / Arrow keys or scroll to walk the grounds, and click stones or pavilion doors to inspect.
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn--amber" onClick={onClose}>
            Return to Cemetery
          </button>
        </div>
      </div>
    </div>
  );
}
