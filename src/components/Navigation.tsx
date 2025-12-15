import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { isElevenLabsEnabled } from '../utils/feature-flags';
import './Navigation.css';

export const Navigation: React.FC = () => {
  const location = useLocation();
  const elevenLabsEnabled = isElevenLabsEnabled();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return (
      location.pathname === path || location.pathname.startsWith(path + '/')
    );
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <div className="navigation-wrapper">
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
      <nav className={`main-navigation ${isMenuOpen ? 'nav-open' : ''}`}>
        {elevenLabsEnabled && (
          <Link
            to="/dashboard"
            className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
            onClick={closeMenu}
          >
            Dashboard
          </Link>
        )}
        <Link
          to="/"
          className={`nav-link ${isActive('/') && !location.pathname.startsWith('/agent-conversation') && !location.pathname.startsWith('/dashboard') ? 'active' : ''}`}
          onClick={closeMenu}
        >
          Note Taking History
        </Link>
        {elevenLabsEnabled && (
          <>
            <Link
              to="/agent-conversations"
              className={`nav-link ${isActive('/agent-conversations') || location.pathname.startsWith('/agent-conversation/') ? 'active' : ''}`}
              onClick={closeMenu}
            >
              Agent Conversations
            </Link>
            <Link
              to="/agent-config"
              className={`nav-link ${isActive('/agent-config') ? 'active' : ''}`}
              onClick={closeMenu}
            >
              Agent Config
            </Link>
          </>
        )}
        <Link
          to="/tasks"
          className={`nav-link ${isActive('/tasks') ? 'active' : ''}`}
          onClick={closeMenu}
        >
          Tasks
        </Link>
        <Link
          to="/task-dashboard"
          className={`nav-link ${isActive('/task-dashboard') ? 'active' : ''}`}
          onClick={closeMenu}
        >
          Task Dashboard
        </Link>
      </nav>
    </div>
  );
};
