import { ChevronDown, Cloud } from 'lucide-react';

interface StatusChipsProps {
  totalGraves: number;
  showHint: boolean;
  hintExpanded: boolean;
  isMobile: boolean;
}

export function StatusChips({ totalGraves, showHint, hintExpanded, isMobile }: StatusChipsProps) {
  const formattedTotal = new Intl.NumberFormat('en-US').format(totalGraves);

  return (
    <>
      <div className="glass-card status-chip" aria-hidden="true">
        <Cloud size={22} style={{ color: 'rgba(233, 228, 216, 0.85)' }} />
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.15 }}>Night</div>
          <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>Foggy</div>
        </div>
      </div>

      {showHint ? (
        <div className="scroll-hint" aria-live="polite">
          {hintExpanded ? (
            <div className="glass-pill scroll-hint__pill">
              {isMobile
                ? 'Drag to look · Use the joystick to move'
                : 'Drag to look · WASD / Scroll to move · Click a stone to read · Esc to close'}
            </div>
          ) : null}
          {!isMobile ? (
            <>
              <div className="scroll-hint__mouse">
                <div className="scroll-hint__wheel" />
              </div>
              <ChevronDown size={16} style={{ color: 'var(--text-dim)' }} />
            </>
          ) : null}
        </div>
      ) : null}

      <div className="glass-pill total-pill">
        A total of {formattedTotal} {totalGraves === 1 ? 'regret lies' : 'regrets lie'} here…
      </div>
    </>
  );
}
