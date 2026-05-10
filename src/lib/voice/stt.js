/**
 * Speech-to-Text abstraction using the Web Speech API.
 *
 * Creates and manages a SpeechRecognition instance. Returns interim
 * transcripts as the user speaks and a final transcript when done.
 */

// ── Support detection ─────────────────────────────────

export function isSTTSupported() {
  if (typeof window === 'undefined') return false;
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

// ── Recognition manager ───────────────────────────────

let recognition = null;
let isListening = false;

/**
 * Start listening for speech.
 * @param {object} callbacks
 * @param {(transcript: string) => void} callbacks.onInterim  - called with interim text as user speaks
 * @param {(transcript: string) => void} callbacks.onFinal    - called with final transcript when done
 * @param {(error: string) => void}      callbacks.onError    - called on error with a user-friendly message
 * @param {() => void}                   callbacks.onStart    - called when recognition starts
 * @param {() => void}                   callbacks.onEnd      - called when recognition ends (for any reason)
 */
export function startListening({ onInterim, onFinal, onError, onStart, onEnd }) {
  if (!isSTTSupported()) {
    onError?.('Voice input is not supported in this browser. Try Chrome or Safari.');
    return;
  }

  // Stop any existing session
  stopListening();

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();

  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    isListening = true;
    onStart?.();
  };

  recognition.onresult = (event) => {
    let interim = '';
    let final = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        final += transcript;
      } else {
        interim += transcript;
      }
    }

    if (interim) onInterim?.(interim);
    if (final) onFinal?.(final);
  };

  recognition.onerror = (event) => {
    isListening = false;

    switch (event.error) {
      case 'not-allowed':
      case 'service-not-allowed':
        onError?.(
          'Microphone access is needed for voice input. Please allow it in your browser settings.',
        );
        break;
      case 'no-speech':
        onError?.('Nothing detected \u2014 tap the mic and try again.');
        break;
      case 'aborted':
        // User or code cancelled — not a real error
        break;
      case 'network':
        onError?.('Network error \u2014 check your connection and try again.');
        break;
      default:
        onError?.('Voice input error. Please try again.');
    }

    onEnd?.();
  };

  recognition.onend = () => {
    isListening = false;
    recognition = null;
    onEnd?.();
  };

  try {
    recognition.start();
  } catch (err) {
    // Can throw if called without a user gesture on some platforms
    isListening = false;
    recognition = null;
    onError?.('Could not start voice input. Please tap the microphone button and try again.');
    onEnd?.();
  }
}

/**
 * Stop the current recognition session.
 */
export function stopListening() {
  if (recognition) {
    try {
      recognition.abort();
    } catch {
      // ignore — may already be stopped
    }
    recognition = null;
    isListening = false;
  }
}

/**
 * Whether speech recognition is currently active.
 */
export function getIsListening() {
  return isListening;
}
