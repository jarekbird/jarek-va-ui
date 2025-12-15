import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <div className="layout">
      <header className="layout-header">
        <div className="layout-header-content">
          <button
            className="hamburger-menu"
            onClick={toggleMenu}
            aria-label="Toggle navigation menu"
            aria-expanded={isMenuOpen}
          >
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>
          <nav className={`layout-nav ${isMenuOpen ? 'nav-open' : ''}`}>
            <Link
              to="/conversations"
              className={`nav-link ${isActive('/conversations') ? 'active' : ''}`}
              onClick={closeMenu}
            >
              Conversations
            </Link>
            <Link
              to="/tasks"
              className={`nav-link ${isActive('/tasks') ? 'active' : ''}`}
              onClick={closeMenu}
            >
              Tasks
            </Link>
          </nav>
        </div>
      </header>
      <main className="layout-main">{children}</main>
    </div>
  );
};
