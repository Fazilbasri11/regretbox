import { List, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

interface HeaderProps {
  activeRoute: 'cemetery' | 'list';
  onOpenSearch: () => void;
}

export function Header({ activeRoute, onOpenSearch }: HeaderProps) {
  return (
    <header className="hud-header">
      <Link to="/" className="brand-lockup" aria-label="RegretBox">
        <span className="brand-stone" aria-hidden="true">
          R
        </span>
        <span className="brand-wordmark">RegretBox</span>
      </Link>

      <nav className="hud-nav" aria-label="Main navigation">
        <Link
          to="/"
          className={`hud-nav-item ${activeRoute === 'cemetery' ? 'hud-nav-item--active' : ''}`}
        >
          <span>Cemetery</span>
        </Link>

        <Link
          to="/list"
          className={`hud-nav-item ${activeRoute === 'list' ? 'hud-nav-item--active' : ''}`}
        >
          <List size={18} aria-hidden="true" />
          <span>List View</span>
        </Link>

        <button type="button" className="hud-nav-item" onClick={onOpenSearch}>
          <Search size={18} aria-hidden="true" />
          <span>Search #</span>
        </button>
      </nav>
    </header>
  );
}
