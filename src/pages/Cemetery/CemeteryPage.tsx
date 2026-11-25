import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Eye, Plus, SkipForward } from 'lucide-react';
import type { CemeteryStats, Grave } from '../../types/grave';
import { fetchPublicGraves, fetchStats, leaveRoseOnGrave, searchGraveByNumber } from '../../services/graves';
import { CemeteryScene } from '../../three/CemeteryScene';
import { detectWebGLSupport, type QualitySetting, type QualityTier } from '../../three/PerformanceManager';
import { Header } from '../../hud/Header/Header';
import { HeroText } from '../../hud/HeroText/HeroText';
import { StatsCard } from '../../hud/StatsCard/StatsCard';
import { StatusChips } from '../../hud/StatusChips/StatusChips';
import { SettingsPopover } from '../../hud/SettingsPopover/SettingsPopover';
import { LoadingScreen } from '../../hud/LoadingScreen/LoadingScreen';
import { GraveDetailContent } from '../../components/GraveDetails/GraveDetailContent';

interface CemeteryPageProps {
  onOpenBury: () => void;
  onOpenSearch: () => void;
  onOpenAbout: () => void;
  latestBuriedGrave: Grave | null;
  onClearLatestBuried: () => void;
  searchedGrave: Grave | null;
  onClearSearchedGrave: () => void;
  statsRefreshKey: number;
}

export function CemeteryPage({
  onOpenBury,
  onOpenSearch,
  onOpenAbout,
  latestBuriedGrave,
  onClearLatestBuried,
  searchedGrave,
  onClearSearchedGrave,
  statsRefreshKey,
}: CemeteryPageProps) {
  const navigate = useNavigate();
  const { number: routeGraveNumber } = useParams<{ number?: string }>();
  const webglSupported = useMemo(() => detectWebGLSupport(), []);

  const [loadingVisible, setLoadingVisible] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(18);
  const [graves, setGraves] = useState<Grave[]>([]);
  const [stats, setStats] = useState<CemeteryStats>({ total: 0, buried_today: 0 });
  const [selectedGrave, setSelectedGrave] = useState<Grave | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [qualitySetting, setQualitySetting] = useState<QualitySetting>('auto');
  const [activeTier, setActiveTier] = useState<QualityTier>('high');
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [heroDimmed, setHeroDimmed] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [hintExpanded, setHintExpanded] = useState(true);
  const [isBuryAnimating, setIsBuryAnimating] = useState(false);
  const [roseSubmitting, setRoseSubmitting] = useState(false);
  const [notFoundToast, setNotFoundToast] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [joyKnob, setJoyKnob] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<CemeteryScene | null>(null);
  const syncedGraveSigRef = useRef<string>('');
  const joyOriginRef = useRef<{ x: number; y: number } | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Redirect cleanly to 2D List View if WebGL is unsupported
  useEffect(() => {
    if (!webglSupported) {
      navigate('/list', { replace: true });
    }
  }, [webglSupported, navigate]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Collapse expanded hint text after 6 seconds
  useEffect(() => {
    const id = window.setTimeout(() => setHintExpanded(false), 6000);
    return () => window.clearTimeout(id);
  }, []);

  // Load initial graves and real stats
  useEffect(() => {
    let active = true;
    setLoadingProgress(35);
    Promise.all([fetchPublicGraves('all'), fetchStats()]).then(([gravesRes, statsRes]) => {
      if (!active) return;
      setGraves(gravesRes.graves);
      setStats(statsRes);
      setLoadingProgress(75);
    });
    return () => {
      active = false;
    };
  }, []);

  // Refresh stats after new burial
  useEffect(() => {
    if (statsRefreshKey === 0) return;
    fetchStats().then(setStats);
  }, [statsRefreshKey]);

  const handleSelectGrave = useCallback((grave: Grave) => {
    setSelectedGrave(grave);
    setSettingsOpen(false);
    engineRef.current?.searchNav.focusGrave(grave);
  }, []);

  const handleUserMoved = useCallback(() => {
    setHeroDimmed(true);
    setShowHint(false);
  }, []);

  // Mount Three.js CemeteryScene once graves are loaded
  useEffect(() => {
    if (!webglSupported || !containerRef.current || graves.length === 0 || engineRef.current) return;

    const engine = new CemeteryScene(containerRef.current, qualitySetting, graves, {
      onSelectGrave: handleSelectGrave,
      onOpenBury: () => {
        setSettingsOpen(false);
        onOpenBury();
      },
      onOpenAbout: () => {
        setSettingsOpen(false);
        onOpenAbout();
      },
      onEscape: () => {
        setSelectedGrave(null);
        setSettingsOpen(false);
        engineRef.current?.graveMgr.setSelectedGrave(null);
      },
      onUserMoved: handleUserMoved,
      onTierChanged: (t) => setActiveTier(t),
      onReady: () => {
        setLoadingProgress(100);
      },
    });
    engineRef.current = engine;
    syncedGraveSigRef.current = `${graves.length}:${graves[0]?.id ?? ''}`;
    setActiveTier(engine.perf.activeTier);
    setLoadingProgress(100);

    const fadeTimer = window.setTimeout(() => setLoadingVisible(false), 320);

    const onResize = () => {
      if (!containerRef.current || !engineRef.current) return;
      engineRef.current.resize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.clearTimeout(fadeTimer);
      window.removeEventListener('resize', onResize);
      engine.dispose();
      engineRef.current = null;
    };
  }, [webglSupported, graves.length > 0]);

  // Sync newly added/removed graves into engine without rebuilding on rose-only updates
  useEffect(() => {
    if (!engineRef.current || graves.length === 0) return;
    const sig = `${graves.length}:${graves[0]?.id ?? ''}`;
    if (syncedGraveSigRef.current === sig) return;
    syncedGraveSigRef.current = sig;
    engineRef.current.setGraves(graves);
  }, [graves]);

  const handleLeaveRose = useCallback(async (grave: Grave) => {
    setRoseSubmitting(true);
    try {
      const next = await leaveRoseOnGrave(grave);
      const updated: Grave = {
        ...grave,
        flower_count: next.flower_count,
        flower_color: next.flower_color,
      };
      setGraves((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
      setSelectedGrave((curr) => (curr?.id === updated.id ? updated : curr));
      engineRef.current?.graveMgr.updateGraveFlower(updated);
    } finally {
      setRoseSubmitting(false);
    }
  }, []);

  // Handle permalink route /grave/:number
  useEffect(() => {
    if (!routeGraveNumber || graves.length === 0 || !engineRef.current) return;
    searchGraveByNumber(routeGraveNumber).then((res) => {
      if (res.notFound || !res.grave) {
        setNotFoundToast('Grave not found');
        return;
      }
      setNotFoundToast(null);
      engineRef.current?.cameraCtrl.skipIntro();
      handleSelectGrave(res.grave);
    });
  }, [routeGraveNumber, graves.length, handleSelectGrave]);

  // Handle Search modal result
  useEffect(() => {
    if (!searchedGrave || !engineRef.current) return;
    engineRef.current.cameraCtrl.skipIntro();
    handleSelectGrave(searchedGrave);
    onClearSearchedGrave();
  }, [searchedGrave, handleSelectGrave, onClearSearchedGrave]);

  // Handle newly buried grave animation
  useEffect(() => {
    if (!latestBuriedGrave || !engineRef.current) return;
    setGraves((prev) => {
      if (prev.some((g) => g.id === latestBuriedGrave.id)) return prev;
      return [latestBuriedGrave, ...prev];
    });
    setStats((prev) => ({ total: prev.total + 1, buried_today: prev.buried_today + 1 }));
    setIsBuryAnimating(true);
    engineRef.current.graveMgr.setSelectedGrave(latestBuriedGrave);
    engineRef.current.burialAnim.play(latestBuriedGrave, () => {
      setIsBuryAnimating(false);
      setSelectedGrave(latestBuriedGrave);
      onClearLatestBuried();
    });
  }, [latestBuriedGrave, onClearLatestBuried]);

  // Real night forest ambient WAV playback (strictly OFF by default)
  useEffect(() => {
    if (!soundEnabled) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      return;
    }

    if (!audioRef.current) {
      const audio = new Audio('/audio/night-ambient.wav');
      audio.loop = true;
      audio.volume = 0.5;
      audioRef.current = audio;
    }

    audioRef.current.play().catch(() => {
      setSoundEnabled(false);
    });

    return () => {
      audioRef.current?.pause();
    };
  }, [soundEnabled]);

  const handleResetView = () => {
    setSelectedGrave(null);
    engineRef.current?.graveMgr.setSelectedGrave(null);
    engineRef.current?.cameraCtrl.resetView();
    setHeroDimmed(false);
  };

  const handleInspectNearest = () => {
    if (!engineRef.current) return;
    const nearest = engineRef.current.graveMgr.findClosestGraveInView(engineRef.current.camera);
    if (nearest) {
      handleSelectGrave(nearest);
    }
  };

  const handleJoyStart = (e: React.TouchEvent) => {
    if (e.touches.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    joyOriginRef.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  };

  const handleJoyMove = (e: React.TouchEvent) => {
    if (!joyOriginRef.current || e.touches.length === 0) return;
    const t = e.touches[0];
    const maxR = 30;
    const dx = t.clientX - joyOriginRef.current.x;
    const dy = t.clientY - joyOriginRef.current.y;
    const dist = Math.hypot(dx, dy);
    const scale = dist > maxR ? maxR / dist : 1;
    const nx = dx * scale;
    const ny = dy * scale;
    setJoyKnob({ x: nx, y: ny });
    engineRef.current?.setJoystickVector(nx / maxR, ny / maxR);
  };

  const handleJoyEnd = () => {
    joyOriginRef.current = null;
    setJoyKnob({ x: 0, y: 0 });
    engineRef.current?.setJoystickVector(0, 0);
  };

  return (
    <>
      <LoadingScreen visible={loadingVisible} progress={loadingProgress} />

      <div ref={containerRef} style={{ position: 'fixed', inset: 0 }} />

      <div className="hud">
        <Header activeRoute="cemetery" onOpenSearch={onOpenSearch} />

        <HeroText dimmed={heroDimmed} />

        <StatsCard
          stats={stats}
          settingsOpen={settingsOpen}
          onToggleSettings={() => setSettingsOpen((v) => !v)}
          onOpenSearch={onOpenSearch}
        />

        {settingsOpen ? (
          <SettingsPopover
            qualitySetting={qualitySetting}
            activeTier={activeTier}
            soundEnabled={soundEnabled}
            onResetView={handleResetView}
            onChangeQuality={(setting) => {
              setQualitySetting(setting);
              const nextTier = engineRef.current?.setQualitySetting(setting);
              if (nextTier) setActiveTier(nextTier);
            }}
            onToggleSound={() => setSoundEnabled((v) => !v)}
            onShowHelp={() => {
              setShowHint(true);
              setHintExpanded(true);
            }}
            onClose={() => setSettingsOpen(false)}
          />
        ) : null}

        <StatusChips
          totalGraves={stats.total}
          showHint={showHint}
          hintExpanded={hintExpanded}
          isMobile={isMobile}
        />

        {/* Accessible HTML trigger positioned over the 3D wooden sign */}
        <button
          type="button"
          className="a11y-add-btn"
          onClick={onOpenBury}
          aria-label="Add Your Regret"
        >
          Add Your Regret +
        </button>

        {/* Mobile Controls */}
        <div
          className="mobile-joystick"
          onTouchStart={handleJoyStart}
          onTouchMove={handleJoyMove}
          onTouchEnd={handleJoyEnd}
          aria-label="Move joystick"
        >
          <div
            className="mobile-joystick__knob"
            style={{ transform: `translate(${joyKnob.x}px, ${joyKnob.y}px)` }}
          />
        </div>

        <div className="mobile-actions-bar">
          <button type="button" className="mobile-add-pill" onClick={onOpenBury}>
            <Plus size={16} />
            <span>Add Your Regret</span>
          </button>
          <button type="button" className="mobile-inspect-btn" onClick={handleInspectNearest}>
            <Eye size={18} />
            <span>Read</span>
          </button>
        </div>

        {isBuryAnimating && latestBuriedGrave ? (
          <div style={{ position: 'fixed', bottom: 84, left: '50%', transform: 'translateX(-50%)', zIndex: 45 }}>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                engineRef.current?.burialAnim.skip(latestBuriedGrave, () => {
                  setIsBuryAnimating(false);
                  setSelectedGrave(latestBuriedGrave);
                  onClearLatestBuried();
                });
              }}
            >
              <SkipForward size={15} />
              <span>Skip animation</span>
            </button>
          </div>
        ) : null}

        {notFoundToast ? (
          <div
            className="glass-card banner banner--error"
            style={{ position: 'fixed', top: 96, left: '50%', transform: 'translateX(-50%)', zIndex: 45 }}
          >
            {notFoundToast}
          </div>
        ) : null}

        {selectedGrave ? (
          <aside className="glass-card grave-detail-panel" aria-label="Selected gravestone">
            <GraveDetailContent
              grave={selectedGrave}
              onLeaveRose={handleLeaveRose}
              roseSubmitting={roseSubmitting}
              onClose={() => {
                setSelectedGrave(null);
                engineRef.current?.graveMgr.setSelectedGrave(null);
              }}
            />
          </aside>
        ) : null}
      </div>
    </>
  );
}
