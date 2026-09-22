import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';

export const NotFoundPage = () => {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-bg-app)',
        minHeight: 'calc(100vh - 72px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem'
      }}
    >
      <div
        style={{
          maxWidth: '520px',
          textAlign: 'center',
          backgroundColor: 'var(--color-bg-surface)',
          padding: '3rem 2rem',
          borderRadius: 'var(--radius-2xl)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: 'rgba(15, 118, 110, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '36px',
            margin: '0 auto 1.5rem auto'
          }}
        >
          📍
        </div>

        <h1
          style={{
            fontSize: '2rem',
            fontWeight: 800,
            color: 'var(--color-text-primary)',
            margin: '0 0 0.5rem 0',
            letterSpacing: '-0.02em'
          }}
        >
          404 — Page Not Found
        </h1>

        <p
          style={{
            fontSize: 'var(--font-size-md)',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.6,
            margin: '0 0 2rem 0'
          }}
        >
          We couldn't find the local gathering or page you're looking for. It might have moved or ended.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to="/discover">
            <Button variant="primary" size="md">
              🗺️ Explore Nearby Events
            </Button>
          </Link>
          <Link to="/">
            <Button variant="outline" size="md">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
