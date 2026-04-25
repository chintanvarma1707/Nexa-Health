import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Loader.css';

const NUM_PARTICLES = 18;
const WAVE_BARS = 14;

const Loader = () => {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState('loading'); // 'loading' | 'done'

  useEffect(() => {
    let val = 0;
    const tick = setInterval(() => {
      val += Math.random() * 4 + 1;
      if (val >= 100) {
        val = 100;
        clearInterval(tick);
        setTimeout(() => setPhase('done'), 400);
      }
      setProgress(Math.min(val, 100));
    }, 60);
    return () => clearInterval(tick);
  }, []);

  return (
    <AnimatePresence>
      {phase === 'loading' && (
        <motion.div
          className="preloader-root"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
        >
          {/* Ambient background orbs */}
          <div className="preloader-orb orb-1" />
          <div className="preloader-orb orb-2" />
          <div className="preloader-orb orb-3" />

          {/* Floating particles */}
          {Array.from({ length: NUM_PARTICLES }).map((_, i) => (
            <div
              key={i}
              className="preloader-particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${(i * 0.3) % 4}s`,
                animationDuration: `${3 + (i % 3)}s`,
                width: `${4 + (i % 4) * 2}px`,
                height: `${4 + (i % 4) * 2}px`,
                opacity: 0.15 + (i % 5) * 0.07,
              }}
            />
          ))}

          {/* Center card */}
          <motion.div
            className="preloader-card"
            initial={{ opacity: 0, scale: 0.8, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          >
            {/* Logo */}
            <div className="preloader-logo-wrap">
              <div className="preloader-logo-ring ring-outer" />
              <div className="preloader-logo-ring ring-mid" />
              <motion.div
                className="preloader-logo-core"
                animate={{ rotate: [0, 360] }}
                transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
              >
                {/* Heartbeat SVG path */}
                <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
                  <path
                    d="M4 19 L8 19 L11 10 L14 28 L17 14 L20 23 L23 17 L26 19 L34 19"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              </motion.div>

              {/* Orbit dot */}
              <div className="preloader-orbit">
                <div className="preloader-orbit-dot" />
              </div>
            </div>

            {/* Brand name */}
            <motion.div
              className="preloader-brand"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <span className="preloader-brand-nexa">NEXA</span>
              <span className="preloader-brand-health">HEALTH</span>
            </motion.div>

            <motion.p
              className="preloader-tagline"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.6 }}
            >
              AI-Powered Medical Intelligence
            </motion.p>

            {/* Pulse waveform */}
            <motion.div
              className="preloader-wave"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {Array.from({ length: WAVE_BARS }).map((_, i) => (
                <div
                  key={i}
                  className="preloader-wave-bar"
                  style={{
                    animationDelay: `${i * 0.08}s`,
                    height: `${12 + Math.sin((i / WAVE_BARS) * Math.PI) * 20}px`,
                  }}
                />
              ))}
            </motion.div>

            {/* Progress track */}
            <motion.div
              className="preloader-progress-track"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <motion.div
                className="preloader-progress-fill"
                animate={{ width: `${progress}%` }}
                transition={{ ease: 'easeOut', duration: 0.3 }}
              />
            </motion.div>

            {/* Status text */}
            <motion.p
              className="preloader-status"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              {progress < 30 && 'Initializing AI Systems…'}
              {progress >= 30 && progress < 60 && 'Loading Clinical Database…'}
              {progress >= 60 && progress < 90 && 'Securing Your Session…'}
              {progress >= 90 && 'Ready for Consultation…'}
            </motion.p>

            <p className="preloader-percent">{Math.round(progress)}%</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Loader;
