/**
 * Text-to-Speech abstraction.
 *
 * Uses Web Speech API by default. When TTS_PROVIDER=elevenlabs, it
 * delegates to the server-side /api/tts proxy (which holds the API key).
 * Swap providers by changing one env var — nothing else in the app changes.
 */

const TTS_PROVIDER =
  typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_TTS_PROVIDER || 'webspeech' : 'webspeech';

// ── State ─────────────────────────────────────────────

let currentUtterance = null;
let currentAudio = null;
let onStartCallback = null;
let onEndCallback = null;

// ── Public API ────────────────────────────────────────

/**
 * Speak the given text aloud.
 * @param {string} text
 * @param {object} [opts]
 * @param {number} [opts.rate]   - Speech rate (default 0.95)
 * @param {number} [opts.pitch]  - Pitch (default 1.0)
 * @param {number} [opts.volume] - Volume 0–1 (default 1.0)
 * @param {() => void} [opts.onStart]
 * @param {() => void} [opts.onEnd]
 */
export function speakResponse(text, opts = {}) {
  // Always stop any current speech first
  stopSpeaking();

  if (!text || typeof text !== 'string' || !text.trim()) {
    opts.onEnd?.();
    return;
  }

  if (TTS_PROVIDER === 'elevenlabs') {
    speakWithElevenLabs(text, opts);
  } else {
    speakWithWebSpeech(text, opts);
  }
}

/**
 * Stop any current speech playback.
 */
export function stopSpeaking() {
  if (currentUtterance) {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = '';
    currentAudio = null;
  }
  // Fire the end callback so UI can reset
  if (onEndCallback) {
    const cb = onEndCallback;
    onEndCallback = null;
    onStartCallback = null;
    cb();
  }
}

/**
 * Whether TTS is currently playing.
 */
export function isSpeaking() {
  if (currentAudio) return !currentAudio.paused;
  return typeof window !== 'undefined' && window.speechSynthesis?.speaking;
}

/**
 * Whether the Web Speech API is supported in this browser.
 */
export function isTTSSupported() {
  if (typeof window === 'undefined') return false;
  if (TTS_PROVIDER === 'elevenlabs') return true;
  return 'speechSynthesis' in window;
}

// ── Web Speech API ────────────────────────────────────

function pickVoice() {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  const englishVoices = voices.filter((v) => v.lang.startsWith('en'));
  if (!englishVoices.length) return voices[0];

  // Prefer specific high-quality voices by platform
  const preferred = [
    'Google US English', // Chrome
    'Samantha', // Safari / macOS
    'Microsoft Zira', // Edge / Windows
    'Karen', // macOS fallback
    'Moira', // macOS fallback
  ];

  for (const name of preferred) {
    const match = englishVoices.find((v) => v.name.includes(name));
    if (match) return match;
  }

  // Prefer a female voice if identifiable
  const female = englishVoices.find(
    (v) => /female|woman/i.test(v.name) || /Samantha|Karen|Zira|Moira|Fiona/i.test(v.name),
  );
  if (female) return female;

  return englishVoices[0];
}

function speakWithWebSpeech(text, opts) {
  if (!window.speechSynthesis) {
    opts.onEnd?.();
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = opts.rate ?? 0.95;
  utterance.pitch = opts.pitch ?? 1.0;
  utterance.volume = opts.volume ?? 1.0;

  const voice = pickVoice();
  if (voice) utterance.voice = voice;

  onStartCallback = opts.onStart || null;
  onEndCallback = opts.onEnd || null;

  utterance.onstart = () => onStartCallback?.();
  utterance.onend = () => {
    currentUtterance = null;
    const cb = onEndCallback;
    onEndCallback = null;
    onStartCallback = null;
    cb?.();
  };
  utterance.onerror = (e) => {
    // 'interrupted' and 'canceled' are expected when stopSpeaking() is called
    if (e.error !== 'interrupted' && e.error !== 'canceled') {
      console.warn('[TTS] Web Speech error:', e.error);
    }
    currentUtterance = null;
    const cb = onEndCallback;
    onEndCallback = null;
    onStartCallback = null;
    cb?.();
  };

  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}

// ── ElevenLabs ────────────────────────────────────────

async function speakWithElevenLabs(text, opts) {
  onStartCallback = opts.onStart || null;
  onEndCallback = opts.onEnd || null;

  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) {
      console.warn('[TTS] ElevenLabs returned', res.status);
      speakWithWebSpeech(text, opts);
      return;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    currentAudio = audio;

    audio.onplay = () => onStartCallback?.();
    audio.onended = () => {
      URL.revokeObjectURL(url);
      currentAudio = null;
      const cb = onEndCallback;
      onEndCallback = null;
      onStartCallback = null;
      cb?.();
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      currentAudio = null;
      const cb = onEndCallback;
      onEndCallback = null;
      onStartCallback = null;
      cb?.();
    };

    await audio.play();
  } catch (err) {
    console.warn('[TTS] ElevenLabs failed:', err);
    speakWithWebSpeech(text, opts);
  }
}
