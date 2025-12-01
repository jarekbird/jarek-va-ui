import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  return (
    <div className="layout">
      <header className="layout-header">
        <nav className="layout-nav">
          <Link
            to="/conversations"
            className={`nav-link ${isActive('/conversations') ? 'active' : ''}`}
          >
            Conversations
          </Link>
          <Link
            to="/tasks"
            className={`nav-link ${isActive('/tasks') ? 'active' : ''}`}
          >
            Tasks
          </Link>
        </nav>
      </header>
      <main className="layout-main">{children}</main>
    </div>
  );
};
