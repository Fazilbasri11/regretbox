import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Clock,
  Compass,
  Eye,
  HelpCircle,
  List,
  Plus,
  RotateCcw,
  Search,
  SkipForward,
  SlidersHorizontal,
} from 'lucide-react';
import type { CemeteryZone, Grave } from '../../types/grave';
import { fetchPublicGraves } from '../../services/graves';
import { formatBurialDate, formatGraveNumber, ZONE_LABELS } from '../../utils/graves';
import {
  formatLocalClock,
  resolveTimeOfDay,
  TIME_THEMES,
  type TimeOfDay,
} from '../../utils/timeTheme';
import { AssetLoader } from '../../three/AssetLoader';
import { BurialAnimation } from '../../three/BurialAnimation';
import { CameraController } from '../../three/CameraController';
import { CemeteryScene } from '../../three/CemeteryScene';
import { DesktopControls } from '../../three/DesktopControls';
import { GraveManager } from '../../three/GraveManager';
import { MobileControls } from '../../three/MobileControls';
import { detectWebGLSupport, PerformanceManager } from '../../three/PerformanceManager';
import { GraveDetailContent } from '../../components/GraveDetails/GraveDetailContent';

interface CemeteryPageProps {
  onOpenBury: () => void;
  onOpenSearch: () => void;
  latestBuriedGrave: Grave | null;
  onClearLatestBuried: () => void;
}

export function CemeteryPage({
  onOpenBury,
  onOpenSearch,
  latestBuriedGrave,
  onClearLatestBuried,
}: CemeteryPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const webglSupported = useMemo(() => detectWebGLSupport(), []);
  const requestedList = searchParams.get('view') === 'list' || !webglSupported;

  const [viewMode, setViewMode] = useState<'3d' | 'list'>(requestedList ? 'list' : '3d');
  const [lowGraphics, setLowGraphics] = useState(false);
  const [graves, setGraves] = useState<Grave[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isDemoFallback, setIsDemoFallback] = useState(false);
  const [selectedGrave, setSelectedGrave] = useState<Grave | null>(null);
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [listSearch, setListSearch] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isBuryAnimating, setIsBuryAnimating] = useState(false);

  // User-local Time-of-Day theme (Auto by default, with optional manual preview)
  const [timeOverride, setTimeOverride] = useState<'auto' | TimeOfDay>('auto');
  const [clockLabel, setClockLabel] = useState(() => formatLocalClock());
  const [autoTimeOfDay, setAutoTimeOfDay] = useState<TimeOfDay>(() => resolveTimeOfDay());
  const activeTimeOfDay: TimeOfDay = timeOverride === 'auto' ? autoTimeOfDay : timeOverride;
  const activeTheme = TIME_THEMES[activeTimeOfDay];

  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [joyKnob, setJoyKnob] = useState({ x: 0, y: 0 });
  const joyOriginRef = useRef<{ x: number; y: number } | null>(null);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<CemeteryScene | null>(null);
  const graveMgrRef = useRef<GraveManager | null>(null);
  const camCtrlRef = useRef<CameraController | null>(null);
  const mobileCtrlRef = useRef<MobileControls | null>(null);
  const burialAnimRef = useRef<BurialAnimation | null>(null);
  const gravesRef = useRef<Grave[]>([]);

  useEffect(() => {
    setViewMode(searchParams.get('view') === 'list' || !webglSupported ? 'list' : '3d');
  }, [searchParams, webglSupported]);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    const id = window.setInterval(() => {
      const now = new Date();
      setClockLabel(formatLocalClock(now));
      setAutoTimeOfDay(resolveTimeOfDay(now));
    }, 30_000);
    return () => window.clearInterval(id);
  }, []);

  // Load cemetery graves
  useEffect(() => {
    fetchPublicGraves('all').then((res) => {
      setGraves(res.graves);
      gravesRef.current = res.graves;
      setTotalCount(res.totalCount);
      setIsDemoFallback(res.isDemoFallback);
    });
  }, []);

  // Merge newly buried grave into state immediately
  useEffect(() => {
    if (!latestBuriedGrave) return;
    setGraves((prev) => {
      if (prev.some((g) => g.id === latestBuriedGrave.id)) return prev;
      const next = [latestBuriedGrave, ...prev];
      gravesRef.current = next;
      return next;
    });
    setTotalCount((c) => c + 1);
  }, [latestBuriedGrave]);

  const selectAndFlyToGrave = useCallback((grave: Grave) => {
    setSelectedGrave(grave);
    graveMgrRef.current?.setSelectedGrave(grave);
    camCtrlRef.current?.flyToGrave(grave);
  }, []);

  // Initialize Three.js World
  useEffect(() => {
    if (viewMode !== '3d' || !stageRef.current || !webglSupported) return;

    const container = stageRef.current;
    const perf = new PerformanceManager(lowGraphics);
    const assets = new AssetLoader();
    const cemeteryScene = new CemeteryScene(container, assets, perf, activeTimeOfDay);
    const graveMgr = new GraveManager(cemeteryScene.scene, assets);
    const camCtrl = new CameraController(cemeteryScene.camera);
    const burialAnim = new BurialAnimation(cemeteryScene.scene, camCtrl);

    sceneRef.current = cemeteryScene;
    graveMgrRef.current = graveMgr;
    camCtrlRef.current = camCtrl;
    burialAnimRef.current = burialAnim;

    if (gravesRef.current.length > 0) {
      graveMgr.setGraves(gravesRef.current);
    }

    const desktopCtrl = new DesktopControls(
      cemeteryScene.renderer.domElement,
      camCtrl,
      graveMgr,
      cemeteryScene.signMesh,
      {
        onSelectGrave: (g) => selectAndFlyToGrave(g),
        onOpenBurySign: onOpenBury,
        onEscape: () => {
          setSelectedGrave(null);
          graveMgr.setSelectedGrave(null);
          setShowOnboarding(false);
        },
      },
    );

    const mobileCtrl = new MobileControls(
      cemeteryScene.renderer.domElement,
      camCtrl,
      graveMgr,
      cemeteryScene.signMesh,
      {
        onSelectGrave: (g) => selectAndFlyToGrave(g),
        onOpenBurySign: onOpenBury,
      },
    );
    mobileCtrlRef.current = mobileCtrl;

    const handleResize = () => {
      if (!stageRef.current) return;
      cemeteryScene.resize(stageRef.current.clientWidth, stageRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    let rafId = 0;
    let lastTime = performance.now();
    let plaqueTimer = 0;

    const animate = (now: number) => {
      rafId = requestAnimationFrame(animate);
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      desktopCtrl.update(dt);
      mobileCtrl.update(dt);
      cemeteryScene.update(now / 1000);

      plaqueTimer += dt;
      if (plaqueTimer >= 0.2) {
        plaqueTimer = 0;
        graveMgr.updateNearbyPlaques(cemeteryScene.camera.position);
      }

      perf.recordFrame();
      cemeteryScene.render();
    };
    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      desktopCtrl.dispose();
      mobileCtrl.dispose();
      burialAnim.stop();
      graveMgr.dispose();
      cemeteryScene.dispose();
      assets.dispose();
      if (cemeteryScene.renderer.domElement.parentNode === container) {
        container.removeChild(cemeteryScene.renderer.domElement);
      }
      sceneRef.current = null;
      graveMgrRef.current = null;
      camCtrlRef.current = null;
      mobileCtrlRef.current = null;
      burialAnimRef.current = null;
    };
  }, [viewMode, lowGraphics, webglSupported, onOpenBury, selectAndFlyToGrave]);

  // Sync graves into GraveManager when data updates
  useEffect(() => {
    if (graveMgrRef.current) {
      graveMgrRef.current.setGraves(graves);
    }
  }, [graves]);

  // Apply Time-of-Day theme updates smoothly without recreating scene
  useEffect(() => {
    sceneRef.current?.applyTimeTheme(activeTimeOfDay);
  }, [activeTimeOfDay]);

  // Handle ?grave=<number> or newly buried grave animation
  useEffect(() => {
    if (viewMode !== '3d' || graves.length === 0) return;

    if (latestBuriedGrave && burialAnimRef.current) {
      setIsBuryAnimating(true);
      graveMgrRef.current?.setSelectedGrave(latestBuriedGrave);
      burialAnimRef.current.play(latestBuriedGrave, () => {
        setIsBuryAnimating(false);
        setSelectedGrave(latestBuriedGrave);
        onClearLatestBuried();
      });
      return;
    }

    const graveParam = searchParams.get('grave');
    if (graveParam) {
      const targetNum = Number(graveParam);
      const match = graves.find((g) => g.grave_number === targetNum);
      if (match) {
        selectAndFlyToGrave(match);
      }
    }
  }, [graves, viewMode, searchParams, latestBuriedGrave, onClearLatestBuried, selectAndFlyToGrave]);

  const handleSkipAnimation = () => {
    if (!latestBuriedGrave || !burialAnimRef.current) return;
    burialAnimRef.current.skip(latestBuriedGrave, () => {
      setIsBuryAnimating(false);
      setSelectedGrave(latestBuriedGrave);
      onClearLatestBuried();
    });
  };

  const handleInspectNearest = () => {
    if (!camCtrlRef.current || !graveMgrRef.current) return;
    const nearest = graveMgrRef.current.findClosestGraveInView(camCtrlRef.current.camera);
    if (nearest) {
      selectAndFlyToGrave(nearest);
    }
  };

  // Virtual Joystick Touch Handlers
  const handleJoyStart = (e: React.TouchEvent) => {
    if (e.touches.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    joyOriginRef.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  };

  const handleJoyMove = (e: React.TouchEvent) => {
    if (!joyOriginRef.current || e.touches.length === 0) return;
    const t = e.touches[0];
    const maxR = 36;
    const dx = t.clientX - joyOriginRef.current.x;
    const dy = t.clientY - joyOriginRef.current.y;
    const dist = Math.hypot(dx, dy);
    const clamped = dist > maxR ? maxR / dist : 1;
    const nx = dx * clamped;
    const ny = dy * clamped;
    setJoyKnob({ x: nx, y: ny });
    mobileCtrlRef.current?.setJoystickVector(nx / maxR, ny / maxR);
  };

  const handleJoyEnd = () => {
    joyOriginRef.current = null;
    setJoyKnob({ x: 0, y: 0 });
    mobileCtrlRef.current?.setJoystickVector(0, 0);
  };

  const toggleViewMode = () => {
    if (viewMode === '3d') {
      setSearchParams({ view: 'list' });
    } else if (webglSupported) {
      setSearchParams({});
    }
  };

  const listFilteredGraves = useMemo(() => {
    const cleanQ = listSearch.replace(/^#/, '').trim();
    return graves.filter((g) => {
      if (zoneFilter !== 'all' && g.zone !== zoneFilter) return false;
      if (!cleanQ) return true;
      return String(g.grave_number).includes(cleanQ);
    });
  }, [graves, zoneFilter, listSearch]);

  if (viewMode === 'list') {
    return (
      <main className="app-main">
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div>
            <h1 className="serif" style={{ margin: 0, fontSize: '2rem' }}>
              The Regret Cemetery — 2D List View
            </h1>
            <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              {webglSupported
                ? 'Lightweight directory of public gravestones.'
                : 'WebGL is unavailable on this browser, so the 2D cemetery directory is shown automatically.'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {webglSupported ? (
              <button type="button" className="btn btn--secondary" onClick={toggleViewMode}>
                <Compass size={16} />
                <span>Enter 3D Cemetery</span>
              </button>
            ) : null}
            <button type="button" className="btn btn--primary" onClick={onOpenBury}>
              <Plus size={16} />
              <span>Bury a Regret</span>
            </button>
          </div>
        </div>

        {isDemoFallback ? (
          <div className="banner">
            <span>Showing demonstration seed gravestones. Connect Supabase to persist new public graves.</span>
          </div>
        ) : null}

        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <div className="grid-2">
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="field__label" htmlFor="list-number-filter">
                Filter by Grave #
              </label>
              <input
                id="list-number-filter"
                className="input mono"
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
                placeholder="e.g. 291"
              />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="field__label" htmlFor="list-zone-filter">
                Zone
              </label>
              <select
                id="list-zone-filter"
                className="select"
                value={zoneFilter}
                onChange={(e) => setZoneFilter(e.target.value)}
              >
                <option value="all">All Grounds</option>
                {(Object.keys(ZONE_LABELS) as CemeteryZone[]).map((z) => (
                  <option key={z} value={z}>
                    {ZONE_LABELS[z].title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {listFilteredGraves.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>Grave not found</p>
          </div>
        ) : (
          <div className="grid-3">
            {listFilteredGraves.map((g) => (
              <article key={g.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', letterSpacing: '0.14em', color: 'var(--text-dim)' }}>
                    R.I.P.
                  </span>
                  <span className="mono" style={{ color: 'var(--accent-amber)', fontWeight: 700 }}>
                    {formatGraveNumber(g.grave_number)}
                  </span>
                </div>
                <p className="serif" style={{ fontSize: '1.3rem', fontStyle: 'italic', margin: '0.55rem 0 0.9rem' }}>
                  “{g.inscription}”
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  <span>{formatBurialDate(g.created_at)}</span>
                  <Link to={`/graves/${g.grave_number}`}>Details →</Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    );
  }

  return (
    <main className="app-main app-main--cemetery">
      <div className="cemetery-stage">
        <div ref={stageRef} className="cemetery-canvas-wrap" aria-label="3D Regret Cemetery" />

        {/* Top HUD */}
        <div className="cemetery-hud-top">
          <div className="hud-glass cemetery-title-card" style={{ maxWidth: 320 }}>
            <h1 className="serif" style={{ margin: 0, fontSize: '1.45rem', lineHeight: 1.1 }}>
              The Regret Cemetery
            </h1>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              A place where your bad decisions finally rest in peace.
            </p>
          </div>

          <div className="hud-pill-group">
            <button type="button" className="hud-pill" onClick={onOpenSearch}>
              <Search size={15} />
              <span>Search #</span>
            </button>

            <button
              type="button"
              className="hud-pill"
              onClick={() => camCtrlRef.current?.resetView()}
              title="Reset camera to entrance view"
            >
              <RotateCcw size={15} />
              <span>Reset View</span>
            </button>

            <button
              type="button"
              className={`hud-pill ${lowGraphics ? 'hud-pill--active' : ''}`}
              onClick={() => setLowGraphics((v) => !v)}
              title="Toggle low graphics mode"
            >
              <SlidersHorizontal size={15} />
              <span>{lowGraphics ? 'Low GFX: On' : 'Low GFX'}</span>
            </button>

            <button type="button" className="hud-pill" onClick={toggleViewMode}>
              <List size={15} />
              <span>Exit 3D / List</span>
            </button>

            <label className="hud-pill" style={{ gap: '0.35rem' }} title="Atmosphere follows your local time automatically">
              <Clock size={14} style={{ color: 'var(--accent-amber)' }} />
              <select
                aria-label="Atmosphere time of day"
                value={timeOverride}
                onChange={(e) => setTimeOverride(e.target.value as 'auto' | TimeOfDay)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-ivory)', cursor: 'pointer' }}
              >
                <option value="auto" style={{ background: '#101521' }}>
                  Auto ({TIME_THEMES[autoTimeOfDay].label})
                </option>
                <option value="morning" style={{ background: '#101521' }}>Morning</option>
                <option value="afternoon" style={{ background: '#101521' }}>Afternoon</option>
                <option value="dusk" style={{ background: '#101521' }}>Dusk (Sore)</option>
                <option value="night" style={{ background: '#101521' }}>Night</option>
              </select>
            </label>

            <button
              type="button"
              className="hud-pill"
              onClick={() => setShowOnboarding((v) => !v)}
              aria-label="Toggle controls help"
            >
              <HelpCircle size={15} />
            </button>
          </div>
        </div>

        {/* Burial Animation Skip Pill */}
        {isBuryAnimating ? (
          <div style={{ position: 'absolute', bottom: '5rem', left: '50%', transform: 'translateX(-50%)', zIndex: 30 }}>
            <button type="button" className="btn btn--secondary" onClick={handleSkipAnimation}>
              <SkipForward size={16} />
              <span>Skip Burial Animation</span>
            </button>
          </div>
        ) : null}

        {/* Bottom HUD */}
        {!isTouchDevice ? (
          <div className="cemetery-hud-bottom">
            <div className="hud-pill" style={{ cursor: 'default' }}>
              <Clock size={14} style={{ color: 'var(--accent-amber)' }} />
              <span>
                {clockLabel} · {activeTheme.label} · {activeTheme.weatherLabel}
              </span>
            </div>

            <div className="hud-pill cemetery-desktop-hint" style={{ cursor: 'default', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Drag to look · WASD / Scroll to move · Click stone to read · Esc to close
            </div>

            <div className="hud-pill" style={{ cursor: 'default' }}>
              <span>
                {totalCount} {totalCount === 1 ? 'regret lies' : 'regrets lie'} here{isDemoFallback ? ' (Demo)' : ''}
              </span>
            </div>
          </div>
        ) : (
          <>
            {/* Mobile Virtual Joystick (Bottom Left) */}
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

            {/* Mobile Action Buttons (Bottom Right) */}
            <div className="mobile-actions">
              <button type="button" className="btn btn--secondary" onClick={handleInspectNearest}>
                <Eye size={16} />
                <span>Inspect</span>
              </button>
              <button type="button" className="btn btn--primary" onClick={onOpenBury}>
                <Plus size={16} />
                <span>Bury</span>
              </button>
            </div>
          </>
        )}

        {/* Controls Onboarding Overlay */}
        {showOnboarding ? (
          <div className="modal-backdrop" onClick={() => setShowOnboarding(false)}>
            <div className="modal-panel" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
              <h2 className="serif" style={{ marginTop: 0, fontSize: '1.65rem' }}>
                Exploring the Grounds
              </h2>
              <ul style={{ paddingLeft: '1.2rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                <li><strong>Desktop:</strong> Click & drag to look around, <code>W A S D</code> or scroll wheel to move, <code>Shift</code> to move faster, click any stone or the wooden sign, <code>Esc</code> to close details.</li>
                <li><strong>Mobile:</strong> Drag anywhere on the scene to look, use the bottom-left joystick to walk, tap any stone or press <strong>Inspect</strong>.</li>
                <li><strong>Time Theme:</strong> Sky, fog, moon/sun, and lantern glow automatically adapt to your local clock.</li>
              </ul>
              <button type="button" className="btn btn--primary" onClick={() => setShowOnboarding(false)}>
                Got it
              </button>
            </div>
          </div>
        ) : null}

        {/* Grave Detail Drawer / Bottom Sheet */}
        {selectedGrave ? (
          <aside className="grave-drawer" aria-label="Selected gravestone details">
            <GraveDetailContent
              grave={selectedGrave}
              onClose={() => {
                setSelectedGrave(null);
                graveMgrRef.current?.setSelectedGrave(null);
              }}
            />
          </aside>
        ) : null}
      </div>
    </main>
  );
}
