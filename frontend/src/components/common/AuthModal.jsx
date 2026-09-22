import React, { useState, useEffect, useRef } from 'react';
import { Modal } from './Modal';
import { Input } from './Input';
import { Button } from './Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const AuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState(initialMode); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [gisRendered, setGisRendered] = useState(false);

  const googleBtnContainerRef = useRef(null);

  const { login, register, googleLogin } = useAuth();
  const { success } = useToast();

  // Keep modal mode strictly in sync with initialMode whenever opened or changed
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode || 'login');
      setFormError('');
      setGisRendered(false);
    }
  }, [isOpen, initialMode]);

  // Handle Google ID Token Credential from GIS
  const handleGoogleCredentialResponse = async (response) => {
    if (!response || !response.credential) {
      setFormError('Google sign-in was cancelled or returned an invalid token.');
      return;
    }

    setIsGoogleSubmitting(true);
    setFormError('');

    try {
      await googleLogin(response.credential);
      success('Welcome to LocalVibe! Signed in with Google 🎉');
      onClose();
    } catch (err) {
      console.error('[AuthModal] Google Auth error:', err);
      setFormError(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  // Initialize Google Identity Services when modal is opened
  useEffect(() => {
    if (!isOpen) return;

    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!googleClientId || googleClientId === 'YOUR_GOOGLE_CLIENT_ID') {
      return;
    }

    const initGsi = () => {
      if (window.google?.accounts?.id && googleBtnContainerRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleGoogleCredentialResponse,
            cancel_on_tap_outside: true
          });

          googleBtnContainerRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: 370
          });
          setGisRendered(true);
        } catch (e) {
          console.warn('[AuthModal] Google GIS initialization notice:', e);
        }
      }
    };

    if (window.google?.accounts?.id) {
      initGsi();
    } else {
      const timer = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(timer);
          initGsi();
        }
      }, 250);
      return () => clearInterval(timer);
    }
  }, [isOpen, mode]);

  const handleCustomGoogleClick = () => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!googleClientId || googleClientId === 'YOUR_GOOGLE_CLIENT_ID') {
      setFormError('Google Sign-In is not configured. Please add a valid VITE_GOOGLE_CLIENT_ID in the frontend environment.');
      return;
    }

    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // If prompt was skipped or not displayed, user can click standard GIS button
        }
      });
    } else {
      setFormError('Google Identity Services script is loading. Please try again in a moment.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail) {
      setFormError('Please enter a valid email address');
      return;
    }

    if (!cleanPassword) {
      setFormError('Please enter your password');
      return;
    }

    if (mode === 'register') {
      if (!name.trim() || name.trim().length < 2) {
        setFormError('Full name must be at least 2 characters');
        return;
      }
      if (cleanPassword.length < 6) {
        setFormError('Password must be at least 6 characters long');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        await login(cleanEmail, cleanPassword);
        success('Welcome back! Logged in successfully 🎉');
      } else {
        await register({
          name: name.trim(),
          email: cleanEmail,
          password: cleanPassword
        });
        success('Account created successfully! Welcome to LocalVibe 🚀');
      }
      onClose();
    } catch (err) {
      console.error('[AuthModal] Auth error:', err);
      const msg = err.message || 'Authentication failed';
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'login' ? 'Log in to LocalVibe' : 'Create your account'}
      maxWidth="420px"
    >
      {/* Visual Mode Switcher Tabs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '4px',
        backgroundColor: 'var(--color-bg-subtle)',
        padding: '4px',
        borderRadius: 'var(--radius-lg)',
        marginBottom: '16px'
      }}>
        <button
          type="button"
          onClick={() => { setMode('login'); setFormError(''); }}
          style={{
            padding: '8px 12px',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            backgroundColor: mode === 'login' ? 'var(--color-bg-surface)' : 'transparent',
            color: mode === 'login' ? 'var(--color-primary)' : 'var(--color-text-muted)',
            boxShadow: mode === 'login' ? 'var(--shadow-sm)' : 'none',
            transition: 'all var(--transition-fast)'
          }}
        >
          Log In
        </button>
        <button
          type="button"
          onClick={() => { setMode('register'); setFormError(''); }}
          style={{
            padding: '8px 12px',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            backgroundColor: mode === 'register' ? 'var(--color-bg-surface)' : 'transparent',
            color: mode === 'register' ? 'var(--color-primary)' : 'var(--color-text-muted)',
            boxShadow: mode === 'register' ? 'var(--shadow-sm)' : 'none',
            transition: 'all var(--transition-fast)'
          }}
        >
          Sign Up
        </button>
      </div>

      {/* Google Sign-In Container */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
        {/* Official Google GSI Render Mount */}
        <div
          ref={googleBtnContainerRef}
          style={{
            display: gisRendered ? 'flex' : 'none',
            justifyContent: 'center',
            width: '100%',
            minHeight: '44px'
          }}
        />

        {/* Fallback & Custom Styled "Continue with Google" Button */}
        {!gisRendered && (
          <button
            type="button"
            onClick={handleCustomGoogleClick}
            disabled={isGoogleSubmitting || isSubmitting}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              width: '100%',
              padding: '10px 16px',
              backgroundColor: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--color-text-main)',
              cursor: isGoogleSubmitting ? 'not-allowed' : 'pointer',
              boxShadow: 'var(--shadow-xs)',
              transition: 'background-color 0.15s ease, border-color 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-bg-subtle)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-bg-surface)'; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>{isGoogleSubmitting ? 'Connecting with Google...' : 'Continue with Google'}</span>
          </button>
        )}

        {/* Visual Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          margin: '6px 0 2px 0',
          gap: '12px'
        }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border)' }} />
          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
            or continue with email
          </span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border)' }} />
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {formError && (
          <div style={{
            padding: '12px 14px',
            backgroundColor: formError.toLowerCase().includes('suspended') ? 'rgba(239, 68, 68, 0.12)' : 'var(--color-error-light)',
            color: 'var(--color-error)',
            fontSize: 'var(--font-size-xs)',
            borderRadius: 'var(--radius-md)',
            border: `1px solid ${formError.toLowerCase().includes('suspended') ? 'rgba(239, 68, 68, 0.4)' : 'rgba(229, 62, 62, 0.2)'}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>{formError.toLowerCase().includes('suspended') ? '🚫' : '⚠️'}</span>
              <strong style={{ fontSize: '13px' }}>
                {formError.toLowerCase().includes('suspended') ? 'Account Suspended' : 'Authentication Error'}
              </strong>
            </div>
            <div style={{ fontSize: '12.5px', lineHeight: 1.4 }}>{formError}</div>
            {formError.toLowerCase().includes('suspended') && (
              <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', marginTop: '2px', borderTop: '1px solid rgba(239, 68, 68, 0.2)', paddingTop: '6px' }}>
                If you believe this is an error, please contact platform administration at <a href="mailto:support@localvibe.com" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>support@localvibe.com</a>.
              </div>
            )}
            {mode === 'login' && !formError.toLowerCase().includes('suspended') && formError.toLowerCase().includes('invalid') && (
              <div style={{ fontSize: '11px', color: 'var(--color-text-main)' }}>
                Don't have an account registered with this email?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('register'); setFormError(''); }}
                  style={{ color: 'var(--color-primary)', fontWeight: 700, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  Switch to Sign Up →
                </button>
              </div>
            )}
          </div>
        )}

        {mode === 'register' && (
          <Input
            label="Full Name"
            placeholder="e.g. Sahil Sharma"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (formError) setFormError('');
            }}
            required
          />
        )}

        <Input
          label="Email Address"
          type="email"
          placeholder="your.email@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (formError) setFormError('');
          }}
          required
        />

        <div style={{ position: 'relative' }}>
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            helperText={mode === 'register' ? 'Minimum 6 characters' : undefined}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (formError) setFormError('');
            }}
            required
            iconRight={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: 'var(--color-text-muted)',
                  padding: '2px 4px'
                }}
                tabIndex="-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            }
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isSubmitting}
          style={{ marginTop: '8px', fontWeight: 700 }}
        >
          {mode === 'login' ? 'Log In' : 'Create Account'}
        </Button>

        {mode === 'login' && (
          <div style={{
            marginTop: '4px',
            padding: '12px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--color-bg-subtle)',
            border: '1px dashed var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                ⚡ 1-Click Demo Login
              </span>
              <span style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 600 }}>
                Instant Access
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                isLoading={isSubmitting}
                onClick={async () => {
                  setEmail('demo.user1@localvibe.demo');
                  setPassword('password123');
                  setIsSubmitting(true);
                  setFormError('');
                  try {
                    await login('demo.user1@localvibe.demo', 'password123');
                    success('Logged in as Demo User (Aarav Patel) 🎉');
                    onClose();
                  } catch (err) {
                    setFormError(err.message || 'Demo login failed');
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                style={{ fontSize: '12px', fontWeight: 600, justifyContent: 'center' }}
              >
                👤 Demo User
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                isLoading={isSubmitting}
                onClick={async () => {
                  setEmail('curator@localvibe.app');
                  setPassword('password123');
                  setIsSubmitting(true);
                  setFormError('');
                  try {
                    await login('curator@localvibe.app', 'password123');
                    success('Logged in as Curator (Admin) ⚡');
                    onClose();
                  } catch (err) {
                    setFormError(err.message || 'Demo login failed');
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                style={{ fontSize: '12px', fontWeight: 600, justifyContent: 'center' }}
              >
                ⚡ Curator (Admin)
              </Button>
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '4px', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
          {mode === 'login' ? (
            <span>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => { setMode('register'); setFormError(''); }}
                style={{ color: 'var(--color-primary)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Sign Up
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setMode('login'); setFormError(''); }}
                style={{ color: 'var(--color-primary)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Log In
              </button>
            </span>
          )}
        </div>
      </form>
    </Modal>
  );
};
