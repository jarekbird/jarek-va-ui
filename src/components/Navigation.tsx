import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navigation.css';

export const Navigation: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <nav className="main-navigation">
      <Link
        to="/"
        className={`nav-link ${isActive('/') && !location.pathname.startsWith('/agent-conversation') ? 'active' : ''}`}
      >
        Note Taking History
      </Link>
      <Link
        to="/agent-conversations"
        className={`nav-link ${isActive('/agent-conversations') || location.pathname.startsWith('/agent-conversation/') ? 'active' : ''}`}
      >
        Agent Conversations
      </Link>
      <Link
        to="/agent-config"
        className={`nav-link ${isActive('/agent-config') ? 'active' : ''}`}
      >
        Agent Config
      </Link>
      <Link
        to="/tasks"
        className={`nav-link ${isActive('/tasks') ? 'active' : ''}`}
      >
        Tasks
      </Link>
    </nav>
  );
};

