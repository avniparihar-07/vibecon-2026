import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

// Web Audio synth — whoosh on takeoff, pop on landing. No sound files.
let _audioCtx = null;
const ctx = () => {
  if (typeof window === 'undefined') return null;
  if (!_audioCtx) {
    try {
      _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return _audioCtx;
};

const playTone = (freqs, durationMs) => {
  const c = ctx();
  if (!c) return;
  const t0 = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'sine';
  freqs.forEach(([freq, atSec]) => {
    osc.frequency.linearRampToValueAtTime(freq, t0 + atSec);
  });
  const tEnd = t0 + durationMs / 1000;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(0.18, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, tEnd);
  osc.connect(gain).connect(c.destination);
  osc.start(t0);
  osc.stop(tEnd + 0.01);
};

export const playWhoosh = () => playTone([[800, 0], [200, 0.4]], 400);
export const playPop = () => playTone([[600, 0], [1200, 0.06], [400, 0.18]], 200);

const PaperPlaneSVG = ({ size = 64 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.25))' }}
  >
    <path
      d="M2 32 L58 6 L42 58 L30 36 Z"
      fill="#FFE5DC"
      stroke="#FF6347"
      strokeWidth={3}
      strokeLinejoin="round"
    />
    <path d="M2 32 L42 58 L30 36 Z" fill="#FFFFFF" stroke="#FF6347" strokeWidth={3} />
  </svg>
);

export default function PaperPlane({ trigger }) {
  const [active, setActive] = useState(false);
  const lastTrigger = useRef(0);

  useEffect(() => {
    if (trigger === lastTrigger.current) return;
    lastTrigger.current = trigger;
    if (trigger === 0) return;
    setActive(true);
    playWhoosh();
    const popTimer = setTimeout(() => playPop(), 1900);
    const offTimer = setTimeout(() => setActive(false), 2100);
    return () => {
      clearTimeout(popTimer);
      clearTimeout(offTimer);
    };
  }, [trigger]);

  if (!active) return null;

  // Quadratic-ish arc approximated with keyframes.
  return (
    <motion.div
      initial={{ x: '95vw', y: '5vh', rotate: 25, opacity: 0 }}
      animate={{
        x: ['95vw', '70vw', '40vw', '15vw'],
        y: ['5vh', '8vh', '20vh', '30vh'],
        rotate: [25, 5, -10, -25],
        opacity: [0, 1, 1, 0.4],
      }}
      transition={{ duration: 2.0, ease: 'easeInOut', times: [0, 0.3, 0.7, 1] }}
      className="fixed top-0 left-0 z-[60] pointer-events-none"
    >
      <PaperPlaneSVG size={72} />
    </motion.div>
  );
}
