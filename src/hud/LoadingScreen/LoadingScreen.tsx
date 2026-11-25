import { APP_CONFIG } from '../../app/config';

interface LoadingScreenProps {
  visible: boolean;
  progress: number;
}

export function LoadingScreen({ visible, progress }: LoadingScreenProps) {
  return (
    <div
      className={`loading-screen ${visible ? '' : 'loading-screen--hidden'}`}
      aria-hidden={!visible}
    >
      <div className="loading-moon" aria-hidden="true" />
      <div className="serif" style={{ fontSize: 32, fontWeight: 600, letterSpacing: '0.02em' }}>
        RegretBox
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-dim)', fontStyle: 'italic' }}>
        {APP_CONFIG.tagline}
      </div>
      <div className="loading-bar" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
        <div className="loading-bar__fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
