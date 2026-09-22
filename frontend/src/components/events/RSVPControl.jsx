import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { AuthModal } from '../common/AuthModal';
import { rsvpService } from '../../services/rsvpService';

export const RSVPControl = ({
  eventId,
  userRSVPStatus = null,
  goingCount = 0,
  interestedCount = 0,
  attendeeCount = 0,
  onRSVPChange,
  disabled = false,
  className = '',
  style = {}
}) => {
  const { isAuthenticated } = useAuth();
  const { success, info, error: toastError } = useToast();

  const [currentStatus, setCurrentStatus] = useState(userRSVPStatus);
  const [currentGoing, setCurrentGoing] = useState(goingCount);
  const [currentInterested, setCurrentInterested] = useState(interestedCount);
  const [isSubmitting, setIsSubmitting] = useState(null); // 'GOING' | 'INTERESTED' | 'CANCEL' | null
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Sync state when props update from server
  useEffect(() => {
    setCurrentStatus(userRSVPStatus);
  }, [userRSVPStatus]);

  useEffect(() => {
    setCurrentGoing(goingCount);
  }, [goingCount]);

  useEffect(() => {
    setCurrentInterested(interestedCount);
  }, [interestedCount]);

  const handleToggleRSVP = async (targetStatus) => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }

    if (isSubmitting || disabled) return;

    const previousStatus = currentStatus;
    const prevGoing = currentGoing;
    const prevInterested = currentInterested;

    // Case 1: Cancellation (Clicking the currently active status)
    if (currentStatus === targetStatus) {
      setIsSubmitting('CANCEL');

      // Optimistic state
      setCurrentStatus(null);
      if (targetStatus === 'GOING') {
        setCurrentGoing(Math.max(0, currentGoing - 1));
      } else if (targetStatus === 'INTERESTED') {
        setCurrentInterested(Math.max(0, currentInterested - 1));
      }

      try {
        const response = await rsvpService.removeRSVP(eventId);
        if (response && response.data) {
          setCurrentStatus(null);
          setCurrentGoing(response.data.goingCount);
          setCurrentInterested(response.data.interestedCount);
          info('RSVP removed');
          if (onRSVPChange) {
            onRSVPChange(eventId, null, response.data);
          }
        }
      } catch (err) {
        // Revert to prior state on error
        setCurrentStatus(previousStatus);
        setCurrentGoing(prevGoing);
        setCurrentInterested(prevInterested);
        toastError(err.message || 'Failed to remove RSVP. Please try again.');
      } finally {
        setIsSubmitting(null);
      }
      return;
    }

    // Case 2: Setting or Switching Status (No RSVP -> GOING/INTERESTED or GOING <-> INTERESTED)
    setIsSubmitting(targetStatus);

    // Optimistic calculation
    setCurrentStatus(targetStatus);
    if (targetStatus === 'GOING') {
      setCurrentGoing(currentGoing + 1);
      if (previousStatus === 'INTERESTED') {
        setCurrentInterested(Math.max(0, currentInterested - 1));
      }
    } else if (targetStatus === 'INTERESTED') {
      setCurrentInterested(currentInterested + 1);
      if (previousStatus === 'GOING') {
        setCurrentGoing(Math.max(0, currentGoing - 1));
      }
    }

    try {
      const response = await rsvpService.setRSVP(eventId, targetStatus);
      if (response && response.data) {
        setCurrentStatus(response.data.status);
        setCurrentGoing(response.data.goingCount);
        setCurrentInterested(response.data.interestedCount);

        success(
          targetStatus === 'GOING'
            ? "You're marked as Going! 🎉"
            : "You're marked as Interested! ⭐"
        );

        if (onRSVPChange) {
          onRSVPChange(eventId, targetStatus, response.data);
        }
      }
    } catch (err) {
      // Revert to prior state on error
      setCurrentStatus(previousStatus);
      setCurrentGoing(prevGoing);
      setCurrentInterested(prevInterested);
      toastError(err.message || 'Failed to update RSVP. Please try again.');
    } finally {
      setIsSubmitting(null);
    }
  };

  return (
    <>
      <div
        className={className}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          width: '100%',
          ...style
        }}
      >
        {/* RSVP Buttons Group */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            variant={currentStatus === 'GOING' ? 'primary' : 'outline'}
            size="lg"
            fullWidth
            disabled={disabled || isSubmitting !== null}
            onClick={() => handleToggleRSVP('GOING')}
            style={{
              backgroundColor: currentStatus === 'GOING' ? 'var(--color-success)' : undefined,
              borderColor: currentStatus === 'GOING' ? 'var(--color-success)' : undefined,
              color: currentStatus === 'GOING' ? 'var(--color-text-inverse)' : undefined,
              opacity: isSubmitting && isSubmitting !== 'GOING' ? 0.7 : 1,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              transition: 'all var(--transition-fast)'
            }}
          >
            {isSubmitting === 'GOING' ? (
              '⏳ Going...'
            ) : isSubmitting === 'CANCEL' && currentStatus === 'GOING' ? (
              '⏳ Removing...'
            ) : currentStatus === 'GOING' ? (
              '✓ Going'
            ) : (
              '+ Going'
            )}
          </Button>

          <Button
            variant={currentStatus === 'INTERESTED' ? 'secondary' : 'outline'}
            size="lg"
            fullWidth
            disabled={disabled || isSubmitting !== null}
            onClick={() => handleToggleRSVP('INTERESTED')}
            style={{
              backgroundColor: currentStatus === 'INTERESTED' ? 'var(--color-warning)' : undefined,
              borderColor: currentStatus === 'INTERESTED' ? 'var(--color-warning)' : undefined,
              color: currentStatus === 'INTERESTED' ? 'var(--color-text-inverse)' : undefined,
              opacity: isSubmitting && isSubmitting !== 'INTERESTED' ? 0.7 : 1,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              transition: 'all var(--transition-fast)'
            }}
          >
            {isSubmitting === 'INTERESTED' ? (
              '⏳ Saving...'
            ) : isSubmitting === 'CANCEL' && currentStatus === 'INTERESTED' ? (
              '⏳ Removing...'
            ) : currentStatus === 'INTERESTED' ? (
              '★ Interested'
            ) : (
              '⭐ Interested'
            )}
          </Button>
        </div>

        {/* Live Attendee Stats Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-bg-subtle)',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-muted)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>👥</span>
            <span>
              <strong style={{ color: 'var(--color-text-main)' }}>{currentGoing}</strong> Going •{' '}
              <strong style={{ color: 'var(--color-text-main)' }}>{currentInterested}</strong> Interested
            </span>
          </div>
          {currentStatus && (
            <span
              style={{
                fontWeight: 700,
                color: currentStatus === 'GOING' ? 'var(--color-success)' : 'var(--color-secondary)'
              }}
            >
              Status: {currentStatus}
            </span>
          )}
        </div>
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode="login"
      />
    </>
  );
};
