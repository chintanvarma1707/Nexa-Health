import React, { useState, useEffect } from 'react';
import './PanicMode.css';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertOctagon, X, PhoneCall, MapPin, Loader2, Navigation } from 'lucide-react';
import emailjs from '@emailjs/browser';

const PanicMode = ({ onCancel, selectedLanguage }) => {
  const [breathePhase, setBreathePhase] = useState('inhale');
  const [isSendingSOS, setIsSendingSOS] = useState(false);
  const [sosStatus, setSosStatus] = useState('');

  useEffect(() => {
    // 4-7-8 breathing technique logic
    const cycle = () => {
      setBreathePhase('inhale');
      setTimeout(() => {
        setBreathePhase('hold');
        setTimeout(() => {
          setBreathePhase('exhale');
        }, 7000); // Hold for 7s
      }, 4000); // Inhale for 4s
    };
    
    cycle();
    const interval = setInterval(cycle, 19000); // Total 19s per cycle
    return () => clearInterval(interval);
  }, []);

  const steps = [
    { title: 'STAY CALM', desc: 'Do not panic. Look around and ensure you are in a safe spot away from immediate danger.' },
    { title: 'ASSESS SITUATION', desc: 'Are you bleeding? Are you having chest pain? Are you alone?' },
    { title: 'IF CHEST PAIN', desc: 'Sit down, loosen tight clothing. Chew an aspirin immediately if not allergic.' },
    { title: 'IF BLEEDING', desc: 'Apply firm, direct pressure to the wound with a clean cloth. Elevate if possible.' }
  ];

  const handleEmergencySOS = () => {
    const phone = localStorage.getItem('nexa_emergency_phone');
    const email = localStorage.getItem('nexa_emergency_email');
    const msg = localStorage.getItem('nexa_emergency_msg') || 'EMERGENCY! I need immediate help. My current live location is attached.';

    if (!phone && !email) {
      setSosStatus('No emergency contact configured. Please go to Settings.');
      return;
    }

    setIsSendingSOS(true);
    setSosStatus('Acquiring live location...');

    if (!navigator.geolocation) {
      setIsSendingSOS(false);
      setSosStatus('Geolocation not supported by browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;
        const finalMessage = `${msg}\n\nLocation: ${mapsLink}`;
        
        // Trigger Background Email if configured
        if (email) {
          const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
          const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
          const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

          if (serviceId && templateId && publicKey) {
            emailjs.send(serviceId, templateId, {
              to_email: email,
              subject: "EMERGENCY SOS: Nexa Health Alert",
              message: finalMessage,
            }, publicKey)
            .then(() => console.log('Silent background email sent!'))
            .catch(err => console.error('Email send failed:', err));
          } else {
            console.error("EmailJS credentials missing.");
          }
        }

        // Trigger SMS if configured (using window.open so it doesn't conflict with window.location)
        if (phone) {
          setTimeout(() => {
            window.open(`sms:${phone}?body=${encodeURIComponent(finalMessage)}`, '_blank');
          }, 300);
        }
        
        setIsSendingSOS(false);
        setSosStatus('SOS Triggered!');
        setTimeout(() => setSosStatus(''), 5000);
      },
      (error) => {
        console.error("Location error:", error);
        setIsSendingSOS(false);
        
        // Fallback: Send without location if location fails
        const fallbackMsg = msg + "\n\n(Location could not be fetched)";
        
        if (email) {
          const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
          const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
          const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

          if (serviceId && templateId && publicKey) {
            emailjs.send(serviceId, templateId, {
              to_email: email,
              subject: "EMERGENCY SOS: Nexa Health Alert",
              message: fallbackMsg,
            }, publicKey)
            .then(() => console.log('Silent background fallback email sent!'))
            .catch(err => console.error('Email send failed:', err));
          }
        }
        
        if (phone) {
          setTimeout(() => {
            window.open(`sms:${phone}?body=${encodeURIComponent(fallbackMsg)}`, '_blank');
          }, 300);
        }

        setSosStatus('Sent without location (permission denied/failed).');
        setTimeout(() => setSosStatus(''), 5000);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <motion.div 
      className="panic-mode-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="panic-header">
        <div className="panic-title">
          <AlertOctagon size={40} className="panic-icon" />
          <span>EMERGENCY MODE</span>
        </div>
        <button className="exit-panic-btn" onClick={onCancel}>
          <X size={20} /> Exit
        </button>
      </div>

      <div className="panic-content">
        <motion.div 
          className="left-panel"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="sos-section mb-8">
            <button 
              className={`sos-huge-btn ${isSendingSOS ? 'loading' : ''}`}
              onClick={handleEmergencySOS}
              disabled={isSendingSOS}
            >
              {isSendingSOS ? <Loader2 size={32} className="spin" /> : <Navigation size={32} />}
              <span>{isSendingSOS ? 'LOCATING...' : 'EMERGENCY SOS'}</span>
            </button>
            {sosStatus && <p className="sos-status-msg">{sosStatus}</p>}
          </div>

          <h2 className="panic-section-title">Critical Life-Saving Steps</h2>
          <div className="life-saving-steps">
            {steps.map((step, idx) => (
              <motion.div 
                key={idx} 
                className="step-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + (idx * 0.1) }}
              >
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div 
          className="right-panel"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="panic-section-title text-center">Calm Breathing</h2>
          <div className="breathing-container">
            <div className="breathing-circle-wrapper">
              <motion.div 
                className="breathing-circle"
                animate={{
                  scale: breathePhase === 'inhale' ? 1 : breathePhase === 'hold' ? 1 : 0.5,
                  opacity: breathePhase === 'inhale' ? 0.8 : breathePhase === 'hold' ? 0.5 : 0.2
                }}
                transition={{ 
                  duration: breathePhase === 'inhale' ? 4 : breathePhase === 'hold' ? 7 : 8,
                  ease: "easeInOut"
                }}
                style={{ width: '100%', height: '100%' }}
              />
              <span className="breathing-text">{breathePhase}</span>
            </div>
            <p className="text-gray-400 text-center">Follow the circle to regulate your nervous system.</p>
          </div>

          <div className="nearby-hospitals mt-8">
            <h2 className="panic-section-title">Nearest Emergency Room</h2>
            <div className="hospital-card">
              <div className="hospital-info">
                <h4>Nearest Medical Center</h4>
                <p className="flex items-center gap-1"><MapPin size={16}/> 1.2 miles away • Open Now</p>
              </div>
              <button className="call-btn">
                <PhoneCall size={18} /> Call 108/112
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default PanicMode;
