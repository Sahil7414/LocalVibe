import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Header } from '../components/common/Header';

export const MainLayout = () => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-bg-app)' }}>
      {/* Global Header */}
      <Header />

      {/* Main Content Viewport */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </main>

      {/* Global Footer */}
      <footer
        style={{
          backgroundColor: 'var(--color-bg-surface)',
          borderTop: '1px solid var(--color-border-subtle)',
          padding: '24px var(--space-4)',
          marginTop: 'auto'
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>📍</span>
            <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>LocalVibe</span>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
              — Hyperlocal Event Discovery & Social RSVP Platform
            </span>
          </div>

          <div style={{ display: 'flex', gap: '16px', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
            <Link to="/discover" style={{ hover: { color: 'var(--color-primary)' } }}>Explore</Link>
            <Link to="/create-event">Post Event</Link>
            <span>•</span>
            <span>&copy; {new Date().getFullYear()} LocalVibe Inc. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

