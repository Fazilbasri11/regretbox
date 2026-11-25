import { Link } from 'react-router-dom';
import { HelpCircle, List, RotateCcw, SlidersHorizontal, Volume2, VolumeX } from 'lucide-react';
import type { QualitySetting, QualityTier } from '../../three/PerformanceManager';

interface SettingsPopoverProps {
  qualitySetting: QualitySetting;
  activeTier: QualityTier;
  soundEnabled: boolean;
  onResetView: () => void;
  onChangeQuality: (setting: QualitySetting) => void;
  onToggleSound: () => void;
  onShowHelp: () => void;
  onClose: () => void;
}

export function SettingsPopover({
  qualitySetting,
  activeTier,
  soundEnabled,
  onResetView,
  onChangeQuality,
  onToggleSound,
  onShowHelp,
  onClose,
}: SettingsPopoverProps) {
  return (
    <div className="glass-card settings-popover" role="dialog" aria-label="Cemetery settings">
      <button
        type="button"
        className="settings-row"
        onClick={() => {
          onResetView();
          onClose();
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <RotateCcw size={16} />
          <span>Reset View</span>
        </span>
      </button>

      <div className="settings-row" style={{ cursor: 'default' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <SlidersHorizontal size={16} />
          <span>Graphics ({activeTier})</span>
        </span>
        <select
          aria-label="Graphics quality"
          value={qualitySetting}
          onChange={(e) => onChangeQuality(e.target.value as QualitySetting)}
          style={{
            background: 'rgba(8,10,18,0.85)',
            border: '1px solid rgba(255,255,255,0.16)',
            borderRadius: 8,
            padding: '4px 8px',
            fontSize: 13,
          }}
        >
          <option value="auto">Auto</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <button type="button" className="settings-row" onClick={onToggleSound}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          <span>Sound</span>
        </span>
        <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>{soundEnabled ? 'On' : 'Off'}</span>
      </button>

      <button
        type="button"
        className="settings-row"
        onClick={() => {
          onShowHelp();
          onClose();
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <HelpCircle size={16} />
          <span>Controls help</span>
        </span>
      </button>

      <Link to="/list" className="settings-row" onClick={onClose}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <List size={16} />
          <span>Exit 3D / List View</span>
        </span>
      </Link>

      <Link
        to="/terms"
        onClick={onClose}
        style={{ fontSize: 13, color: 'var(--text-dim)', padding: '6px 12px 2px', textAlign: 'center' }}
      >
        Terms & Privacy
      </Link>
    </div>
  );
}
