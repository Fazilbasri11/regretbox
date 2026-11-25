import { useState } from 'react';
import { BrowserRouter, Link, Route, Routes, useNavigate } from 'react-router-dom';
import type { Grave } from './types/grave';
import { BurialModal } from './components/BurialForm/BurialModal';
import { Navbar } from './components/Navigation/Navbar';
import { SearchModal } from './components/Search/SearchModal';
import { CemeteryPage } from './pages/Cemetery/CemeteryPage';
import { GravePage } from './pages/GraveDetail/GravePage';
import { HomePage } from './pages/Home/HomePage';
import { LegalPage } from './pages/Legal/LegalPage';
import { NotFoundPage } from './pages/NotFound/NotFoundPage';

function AppShell() {
  const navigate = useNavigate();
  const [buryOpen, setBuryOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [latestBuriedGrave, setLatestBuriedGrave] = useState<Grave | null>(null);

  const handleBuried = (grave: Grave) => {
    setBuryOpen(false);
    setLatestBuriedGrave(grave);
    navigate(`/cemetery?grave=${grave.grave_number}`);
  };

  const handleSearchFound = (grave: Grave) => {
    setSearchOpen(false);
    navigate(`/cemetery?grave=${grave.grave_number}`);
  };

  return (
    <div className="app-shell">
      <Navbar
        onOpenBury={() => setBuryOpen(true)}
        onOpenSearch={() => setSearchOpen(true)}
      />

      <Routes>
        <Route path="/" element={<HomePage onOpenBury={() => setBuryOpen(true)} />} />
        <Route
          path="/cemetery"
          element={
            <CemeteryPage
              onOpenBury={() => setBuryOpen(true)}
              onOpenSearch={() => setSearchOpen(true)}
              latestBuriedGrave={latestBuriedGrave}
              onClearLatestBuried={() => setLatestBuriedGrave(null)}
            />
          }
        />
        <Route path="/graves/:graveNumber" element={<GravePage />} />
        <Route path="/legal" element={<LegalPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      <footer className="footer">
        <div className="footer__inner">
          <span>RegretBox — Write it. Bury it. Let it rest.</span>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link to="/cemetery?view=list">List View</Link>
            <Link to="/legal">Terms & Privacy</Link>
          </div>
        </div>
      </footer>

      {buryOpen ? (
        <BurialModal onClose={() => setBuryOpen(false)} onBuried={handleBuried} />
      ) : null}

      {searchOpen ? (
        <SearchModal onClose={() => setSearchOpen(false)} onFound={handleSearchFound} />
      ) : null}
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
