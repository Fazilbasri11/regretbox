import { useEffect, useState } from 'react';
import { ChevronDown, Moon, Search, Settings } from 'lucide-react';
import type { CemeteryStats } from '../../types/grave';

interface StatsCardProps {
  stats: CemeteryStats;
  onToggleSettings: () => void;
  onOpenSearch: () => void;
  settingsOpen: boolean;
}

function useAnimatedNumber(target: number, durationMs = 600): number {
  const [display, setDisplay] = useState(target);

  useEffect(() => {
    const startVal = display;
    if (startVal === target) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setDisplay(target);
      return;
    }

    const startTime = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - startTime) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(startVal + (target - startVal) * eased));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  return display;
}

export function StatsCard({ stats, onToggleSettings, onOpenSearch, settingsOpen }: StatsCardProps) {
  const formatter = new Intl.NumberFormat('en-US');
  const totalDisplay = useAnimatedNumber(stats.total);
  const todayDisplay = useAnimatedNumber(stats.buried_today);

  return (
    <>
      <div className="hud-top-right">
        <div className="glass-card stats-card" aria-label="Cemetery statistics">
          <div className="stats-col">
            <span
              aria-hidden="true"
              style={{
                width: 22,
                height: 26,
                borderRadius: '11px 11px 3px 3px',
                background: 'rgba(233, 228, 216, 0.85)',
                color: '#151926',
                fontFamily: 'var(--font-serif)',
                fontWeight: 700,
                fontSize: 13,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              R
            </span>
            <div>
              <div className="stats-value">{formatter.format(totalDisplay)}</div>
              <div className="stats-label">Total Graves</div>
            </div>
          </div>

          <div className="stats-divider" aria-hidden="true" />

          <div className="stats-col">
            <Moon size={20} style={{ color: '#E8A84B' }} aria-hidden="true" />
            <div>
              <div className="stats-value">{formatter.format(todayDisplay)}</div>
              <div className="stats-label">Buried Today</div>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="glass-pill mobile-only-nav-btn"
          onClick={onOpenSearch}
          aria-label="Search grave number"
        >
          <Search size={18} />
        </button>

        <button
          type="button"
          className="glass-pill gear-btn"
          onClick={onToggleSettings}
          aria-expanded={settingsOpen}
          aria-label="Open display settings"
        >
          <Settings size={18} />
          <ChevronDown size={12} />
        </button>
      </div>

      <div className="glass-pill mobile-stats-pill">
        <span>{formatter.format(totalDisplay)} graves</span>
      </div>
    </>
  );
}
