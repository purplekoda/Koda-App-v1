'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

// ── Permission check ──────────────────────────────────

async function checkMicPermission() {
  try {
    const result = await navigator.permissions.query({ name: 'microphone' });
    return result.state; // 'granted', 'prompt', or 'denied'
  } catch {
    return 'prompt'; // default if API not supported
  }
}

// ── Animations ────────────────────────────────────────

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`;

const scaleIn = keyframes`
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
`;

const gentlePulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;

// ── Shared modal styles ───────────────────────────────

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.lg};
  z-index: 1100;
  animation: ${fadeIn} 0.2s ease;
`;

const ModalPanel = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: ${({ theme }) => theme.spacing.xxl};
  width: 100%;
  max-width: 420px;
  box-shadow: ${({ theme }) => theme.shadows.elevated};
  animation: ${scaleIn} 0.25s ease;
  text-align: center;

  @media (max-width: 480px) {
    padding: ${({ theme }) => theme.spacing.xl};
    max-width: 100%;
  }
`;

const MicIconCircle = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.tealLight};
  color: ${({ theme }) => theme.colors.teal};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  margin: 0 auto ${({ theme }) => theme.spacing.xl};
  animation: ${gentlePulse} 2.5s ease-in-out infinite;
`;

const ModalTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0 0 ${({ theme }) => theme.spacing.md};
`;

const ModalBody = styled.p`
  font-size: 15px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0 0 ${({ theme }) => theme.spacing.xl};
`;

// ── Chrome hint illustration ──────────────────────────

const ChromeHint = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.grayLight};
  border-radius: ${({ theme }) => theme.radii.lg};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const HintDomain = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 12px;
`;

const HintAllow = styled.span`
  padding: 4px 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.teal};
  color: white;
  font-size: 12px;
  font-weight: 600;
`;

const HintBlock = styled.span`
  padding: 4px 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.borderLight};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 12px;
`;

// ── Buttons ───────────────────────────────────────────

const PrimaryButton = styled.button`
  width: 100%;
  height: 48px;
  border: none;
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.teal};
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;

  &:hover { opacity: 0.9; }
  &:active { opacity: 0.8; }
`;

const SecondaryLink = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 13px;
  cursor: pointer;
  margin-top: ${({ theme }) => theme.spacing.md};
  text-decoration: underline;
  text-decoration-color: transparent;
  transition: text-decoration-color 0.15s;

  &:hover { text-decoration-color: currentColor; }
`;

// ── Denied modal steps ────────────────────────────────

const StepsList = styled.ol`
  list-style: none;
  padding: 0;
  margin: 0 0 ${({ theme }) => theme.spacing.xl};
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const StepItem = styled.li`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.md};
`;

const StepNumber = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.tealLight};
  color: ${({ theme }) => theme.colors.teal};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
`;

const StepContent = styled.div`
  flex: 1;
`;

const StepLabel = styled.p`
  font-size: 14px;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0 0 ${({ theme }) => theme.spacing.xs};
  font-weight: 500;
`;

const StepIllustration = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.grayLight};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const ToggleTrack = styled.span`
  display: inline-flex;
  align-items: center;
  width: 36px;
  height: 20px;
  border-radius: 10px;
  background: ${({ theme }) => theme.colors.teal};
  position: relative;

  &::after {
    content: '';
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: white;
    position: absolute;
    right: 2px;
  }
`;

const StatusMessage = styled.p`
  font-size: 13px;
  color: ${({ $error, theme }) => ($error ? theme.colors.coral : theme.colors.teal)};
  margin: ${({ theme }) => theme.spacing.md} 0 0;
  font-weight: 500;
`;

const BlockedIcon = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.coralLight};
  color: ${({ theme }) => theme.colors.coral};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  margin: 0 auto ${({ theme }) => theme.spacing.xl};
`;

// ── Pre-prompt modal ──────────────────────────────────

function PrePromptModal({ onConfirm, onClose }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <Overlay
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Microphone permission"
    >
      <ModalPanel>
        <MicIconCircle aria-hidden="true">{'\uD83C\uDFA4'}</MicIconCircle>
        <ModalTitle>Koda needs your microphone</ModalTitle>
        <ModalBody>
          To guide you through setup with voice, Koda needs access to your microphone. Your browser
          will ask for permission in just a second — simply tap <strong>Allow</strong> to continue.
        </ModalBody>
        <ChromeHint aria-label="Browser permission preview">
          <HintDomain>Use your microphone?</HintDomain>
          <HintBlock>Block</HintBlock>
          <HintAllow>Allow</HintAllow>
        </ChromeHint>
        <PrimaryButton type="button" onClick={onConfirm}>
          Got it — turn on my mic
        </PrimaryButton>
      </ModalPanel>
    </Overlay>
  );
}

// ── Denied help modal ─────────────────────────────────

function DeniedHelpModal({ onRetry, onSkip, retrying }) {
  const [retryMessage, setRetryMessage] = useState(null);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && onSkip) onSkip();
    }
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onSkip]);

  const [checking, setChecking] = useState(false);

  async function handleRetry() {
    setRetryMessage(null);
    setChecking(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      onRetry();
      return;
    } catch {
      setRetryMessage('still_blocked');
    }
    setChecking(false);
  }

  return (
    <Overlay
      onClick={(e) => {
        if (e.target === e.currentTarget && onSkip) onSkip();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Microphone blocked"
    >
      <ModalPanel>
        <BlockedIcon aria-hidden="true">{'\uD83D\uDD07'}</BlockedIcon>
        <ModalTitle>Microphone access is blocked</ModalTitle>
        <ModalBody>
          It looks like microphone access was previously blocked for Koda. Here&apos;s how to turn
          it back on in 3 quick steps:
        </ModalBody>

        <StepsList>
          <StepItem>
            <StepNumber>1</StepNumber>
            <StepContent>
              <StepLabel>Tap the icon on the left side of your address bar</StepLabel>
              <StepIllustration>
                <span>{'\uD83D\uDD12'}</span>
                <span style={{ color: '#9CA3AF' }}>purplekoda.netlify.app</span>
              </StepIllustration>
            </StepContent>
          </StepItem>

          <StepItem>
            <StepNumber>2</StepNumber>
            <StepContent>
              <StepLabel>Find Microphone and change it to Allow</StepLabel>
              <StepIllustration>
                <span>{'\uD83C\uDFA4'}</span>
                <span>Microphone</span>
                <ToggleTrack />
              </StepIllustration>
            </StepContent>
          </StepItem>

          <StepItem>
            <StepNumber>3</StepNumber>
            <StepContent>
              <StepLabel>Refresh the page and try again</StepLabel>
              <StepIllustration>
                <span>{'\uD83D\uDD04'}</span>
                <span>Refresh this page</span>
              </StepIllustration>
            </StepContent>
          </StepItem>
        </StepsList>

        <PrimaryButton type="button" onClick={handleRetry} disabled={checking}>
          {checking ? 'Checking...' : "I've turned it on — try again"}
        </PrimaryButton>

        {retryMessage === 'still_blocked' && (
          <StatusMessage $error>
            Still blocked — please check your browser settings and refresh the page.
          </StatusMessage>
        )}

        {onSkip && (
          <SecondaryLink type="button" onClick={onSkip}>
            Skip — use manual setup instead
          </SecondaryLink>
        )}
      </ModalPanel>
    </Overlay>
  );
}

// ── Hook ──────────────────────────────────────────────

/**
 * Reusable hook for microphone permission flow.
 *
 * Checks permission state and shows the appropriate modal
 * (pre-prompt for first-time, denied help for blocked).
 *
 * @returns {{
 *   checkAndRequest: (options?: { onSkip?: () => void }) => Promise<boolean>,
 *   permissionState: 'granted' | 'prompt' | 'denied' | null,
 *   PermissionModal: () => JSX.Element | null,
 * }}
 */
export function useMicPermission() {
  const [permissionState, setPermissionState] = useState(null);
  const [modalType, setModalType] = useState(null); // 'preprompt' | 'denied' | null
  const resolveRef = useRef(null);
  const skipCallbackRef = useRef(null);

  // Listen for permission changes
  useEffect(() => {
    let permStatus = null;

    async function watchPermission() {
      try {
        permStatus = await navigator.permissions.query({ name: 'microphone' });
        setPermissionState(permStatus.state);
        permStatus.addEventListener('change', () => {
          setPermissionState(permStatus.state);
        });
      } catch {
        // API not supported
      }
    }

    watchPermission();
    return () => {
      if (permStatus) {
        try {
          permStatus.removeEventListener('change', () => {});
        } catch {}
      }
    };
  }, []);

  const requestMic = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop tracks immediately — we only needed permission
      stream.getTracks().forEach((t) => t.stop());
      setPermissionState('granted');
      setModalType(null);
      return true;
    } catch {
      // User blocked or error
      const newState = await checkMicPermission();
      setPermissionState(newState);
      if (newState === 'denied') {
        setModalType('denied');
      }
      return false;
    }
  }, []);

  const checkAndRequest = useCallback(async (options = {}) => {
    skipCallbackRef.current = options.onSkip || null;

    // The Permissions API can report stale state (e.g. 'denied' when the
    // user has since re-enabled the mic). Use it only as a hint, then
    // verify with a real getUserMedia call when it says 'denied'.
    const hintState = await checkMicPermission();

    if (hintState === 'granted') {
      setPermissionState('granted');
      return true;
    }

    if (hintState === 'denied') {
      // Don't trust it — try getUserMedia to see if it actually works
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
        setPermissionState('granted');
        return true;
      } catch {
        // Truly denied — show the help modal
        setPermissionState('denied');
        return new Promise((resolve) => {
          resolveRef.current = resolve;
          setModalType('denied');
        });
      }
    }

    // state === 'prompt' — show pre-prompt modal and wait
    setPermissionState('prompt');
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setModalType('preprompt');
    });
  }, []);

  const handlePrePromptConfirm = useCallback(async () => {
    setModalType(null);
    const granted = await requestMic();
    if (resolveRef.current) {
      resolveRef.current(granted);
      resolveRef.current = null;
    }
  }, [requestMic]);

  const handlePrePromptClose = useCallback(() => {
    setModalType(null);
    if (resolveRef.current) {
      resolveRef.current(false);
      resolveRef.current = null;
    }
  }, []);

  const handleDeniedRetry = useCallback(async () => {
    // Try getUserMedia — if it works, great. If not, the DeniedHelpModal
    // will show a "Refresh now" button (Chrome requires a reload).
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setPermissionState('granted');
      setModalType(null);
      if (resolveRef.current) {
        resolveRef.current(true);
        resolveRef.current = null;
      }
    } catch {
      // DeniedHelpModal handles showing the reload prompt
    }
  }, []);

  const handleDeniedSkip = useCallback(() => {
    setModalType(null);
    if (resolveRef.current) {
      resolveRef.current(false);
      resolveRef.current = null;
    }
    if (skipCallbackRef.current) {
      skipCallbackRef.current();
    }
  }, []);

  // The modal component to render — just drop <PermissionModal /> in your JSX
  const PermissionModal = useCallback(() => {
    if (modalType === 'preprompt') {
      return <PrePromptModal onConfirm={handlePrePromptConfirm} onClose={handlePrePromptClose} />;
    }
    if (modalType === 'denied') {
      return <DeniedHelpModal onRetry={handleDeniedRetry} onSkip={handleDeniedSkip} />;
    }
    return null;
  }, [
    modalType,
    handlePrePromptConfirm,
    handlePrePromptClose,
    handleDeniedRetry,
    handleDeniedSkip,
  ]);

  return {
    checkAndRequest,
    permissionState,
    PermissionModal,
  };
}
