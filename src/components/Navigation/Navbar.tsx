import { Link, NavLink } from 'react-router-dom';
import { Compass, FileText, List, Plus, Search } from 'lucide-react';

interface NavbarProps {
  onOpenBury: () => void;
  onOpenSearch: () => void;
}

export function Navbar({ onOpenBury, onOpenSearch }: NavbarProps) {
  return (
    <>
      <header className="navbar">
        <div className="navbar__inner">
          <Link to="/" className="brand" aria-label="RegretBox Home">
            <span className="brand__stone" aria-hidden="true">
              R
            </span>
            <span>RegretBox</span>
          </Link>

          <nav className="nav-links" aria-label="Main navigation">
            <NavLink
              to="/cemetery"
              className={({ isActive }) => `nav-link ${isActive ? 'nav-link--active' : ''}`}
            >
              <Compass size={16} />
              <span>Cemetery</span>
            </NavLink>
            <NavLink
              to="/cemetery?view=list"
              className="nav-link"
            >
              <List size={16} />
              <span>List View</span>
            </NavLink>
            <button type="button" className="nav-link" style={{ background: 'transparent', border: 'none', cursor: 'pointer' }} onClick={onOpenSearch}>
              <Search size={16} />
              <span>Search #</span>
            </button>
            <NavLink
              to="/legal"
              className={({ isActive }) => `nav-link ${isActive ? 'nav-link--active' : ''}`}
            >
              <FileText size={16} />
              <span>Terms & Privacy</span>
            </NavLink>
          </nav>

          <button type="button" className="btn btn--primary btn--sm" onClick={onOpenBury}>
            <Plus size={16} />
            <span>Bury a Regret</span>
          </button>
        </div>
      </header>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        <NavLink
          to="/cemetery"
          className={({ isActive }) => `mobile-nav__item ${isActive ? 'mobile-nav__item--active' : ''}`}
        >
          <Compass size={18} />
          <span>Cemetery</span>
        </NavLink>
        <button type="button" className="mobile-nav__item" onClick={onOpenSearch}>
          <Search size={18} />
          <span>Search</span>
        </button>
        <button type="button" className="mobile-nav__item" onClick={onOpenBury}>
          <Plus size={18} />
          <span>Bury</span>
        </button>
        <NavLink
          to="/legal"
          className={({ isActive }) => `mobile-nav__item ${isActive ? 'mobile-nav__item--active' : ''}`}
        >
          <FileText size={18} />
          <span>Privacy</span>
        </NavLink>
      </nav>
    </>
  );
}
