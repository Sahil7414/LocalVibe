import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from './Avatar';

export const UserMenu = ({ className = '', style = {} }) => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div ref={menuRef} style={{ position: 'relative', ...style }} className={className}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="focus-ring"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 10px 4px 4px',
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--color-border-subtle)',
          backgroundColor: 'var(--color-bg-surface)',
          cursor: 'pointer'
        }}
        aria-expanded={isOpen}
        aria-label="User account menu"
      >
        <Avatar name={user.name} size={30} />
        <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text-main)' }}>
          {user.name.split(' ')[0]}
        </span>
        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>▼</span>
      </button>

      {isOpen && (
        <div
          className="animate-slide-up"
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 8px)',
            width: '220px',
            backgroundColor: 'var(--color-bg-surface)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--color-border-subtle)',
            padding: '8px 0',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--color-border-subtle)' }}>
            <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--color-text-main)' }}>{user.name}</p>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</p>
            <span style={{
              display: 'inline-block',
              marginTop: '4px',
              fontSize: '10px',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: user.role === 'ADMIN' ? 'var(--color-primary-light)' : 'var(--color-bg-subtle)',
              color: user.role === 'ADMIN' ? 'var(--color-primary)' : 'var(--color-text-muted)'
            }}>
              {user.role}
            </span>
          </div>

          <Link
            to="/profile"
            onClick={() => setIsOpen(false)}
            style={{ padding: '10px 16px', fontSize: 'var(--font-size-sm)', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            👤 Profile & Account
          </Link>

          <div style={{ borderTop: '1px solid var(--color-border-subtle)', margin: '4px 0' }} />

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              logout();
            }}
            style={{
              padding: '10px 16px',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-error)',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            🚪 Logout
          </button>
        </div>
      )}
    </div>
  );
};
