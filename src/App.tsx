import { useCallback, useState } from 'react';
import { BrowserRouter, Route, Routes, useNavigate } from 'react-router-dom';
import type { Grave } from './types/grave';
import { BurialModal } from './components/BurialForm/BurialModal';
import { AboutModal } from './components/About/AboutModal';
import { SearchModal } from './components/Search/SearchModal';
import { CemeteryPage } from './pages/Cemetery/CemeteryPage';
import { ListViewPage } from './pages/ListView/ListViewPage';
import { LegalPage } from './pages/Legal/LegalPage';
import { NotFoundPage } from './pages/NotFound/NotFoundPage';

function AppShell() {
  const navigate = useNavigate();
  const [buryOpen, setBuryOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [latestBuriedGrave, setLatestBuriedGrave] = useState<Grave | null>(null);
  const [searchedGrave, setSearchedGrave] = useState<Grave | null>(null);
  const [statsRefreshKey, setStatsRefreshKey] = useState(0);

  const handleBuried = (grave: Grave) => {
    setBuryOpen(false);
    setLatestBuriedGrave(grave);
    setStatsRefreshKey((k) => k + 1);
    navigate('/');
  };

  const handleSearchFound = (grave: Grave) => {
    setSearchOpen(false);
    setSearchedGrave(grave);
    navigate('/');
  };

  const clearLatestBuried = useCallback(() => setLatestBuriedGrave(null), []);
  const clearSearchedGrave = useCallback(() => setSearchedGrave(null), []);

  const cemeteryElement = (
    <CemeteryPage
      onOpenBury={() => setBuryOpen(true)}
      onOpenSearch={() => setSearchOpen(true)}
      onOpenAbout={() => setAboutOpen(true)}
      latestBuriedGrave={latestBuriedGrave}
      onClearLatestBuried={clearLatestBuried}
      searchedGrave={searchedGrave}
      onClearSearchedGrave={clearSearchedGrave}
      statsRefreshKey={statsRefreshKey}
    />
  );

  return (
    <>
      <Routes>
        <Route path="/" element={cemeteryElement} />
        <Route path="/cemetery" element={cemeteryElement} />
        <Route path="/grave/:number" element={cemeteryElement} />
        <Route path="/list" element={<ListViewPage onOpenBury={() => setBuryOpen(true)} />} />
        <Route path="/terms" element={<LegalPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      {buryOpen ? (
        <BurialModal onClose={() => setBuryOpen(false)} onBuried={handleBuried} />
      ) : null}

      {searchOpen ? (
        <SearchModal onClose={() => setSearchOpen(false)} onFound={handleSearchFound} />
      ) : null}

      {aboutOpen ? <AboutModal onClose={() => setAboutOpen(false)} /> : null}
    </>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
