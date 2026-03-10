import React, { useState, useEffect } from 'react';
import { Phone, HeartPulse, Wind, MapPin, XCircle } from 'lucide-react';
import { getTranslation } from '../utils/translations';
import './PanicMode.css';

const PanicMode = ({ onCancel, selectedLanguage }) => {
  const [breathPhase, setBreathPhase] = useState('inhale');

  useEffect(() => {
    const phases = ['inhale', 'hold', 'exhale', 'wait'];
    let currentIndex = 0;
    
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % phases.length;
      setBreathPhase(phases[currentIndex]);
    }, 4000); // 4 seconds per phase

    return () => clearInterval(interval);
  }, []);

  const emergencySteps = getTranslation(selectedLanguage, 'emergency_steps_list') || [];

  return (
    <div className="panic-mode-container">
      <div className="panic-header">
        <h1>{getTranslation(selectedLanguage, 'panic_mode')}</h1>
        <button className="cancel-panic" onClick={onCancel}>
          <XCircle size={28} />
          <span>{getTranslation(selectedLanguage, 'exit_panic')}</span>
        </button>
      </div>

      <div className="panic-content">
        <div className="emergency-actions card">
          <HeartPulse size={48} color="var(--color-panic-600)" />
          <h2>{getTranslation(selectedLanguage, 'emergency_steps')}</h2>
          <ul className="action-list">
            {emergencySteps.map((step, index) => {
              const [label, ...desc] = step.split(':');
              return (
                <li key={index}>
                  <strong>{label}:</strong> {desc.join(':')}
                </li>
              );
            })}
          </ul>
          <button className="call-sos-btn">
            <Phone size={24} />
            {getTranslation(selectedLanguage, 'call_emergency')}
          </button>
        </div>

        <div className="side-panic-cards">
          <div className="breathing-card card">
            <Wind size={40} color="var(--color-light-blue-500)" />
            <h3>{getTranslation(selectedLanguage, 'breathing_exercises')}</h3>
            <p>{getTranslation(selectedLanguage, 'regulate_nervous_system')}</p>
            <div className="breath-circle-container">
              <div className={`breath-circle ${breathPhase}`}>
                {getTranslation(selectedLanguage, breathPhase)}
              </div>
            </div>
          </div>

          <div className="nearest-hospital-card card">
            <MapPin size={40} color="var(--color-soft-green-600)" />
            <h3>{getTranslation(selectedLanguage, 'nearby_hospitals')}</h3>
            <div className="hospital-item">
              <div>
                <strong>City Care Hospital</strong>
                <p>1.2 miles away • <span className="text-green">{getTranslation(selectedLanguage, 'online')}</span></p>
              </div>
              <button className="small-call-btn"><Phone size={16} /> {getTranslation(selectedLanguage, 'call')}</button>
            </div>
            <div className="hospital-item">
              <div>
                <strong>Metro General Clinic</strong>
                <p>2.5 miles away • <span className="text-green">{getTranslation(selectedLanguage, 'online')}</span></p>
              </div>
              <button className="small-call-btn"><Phone size={16} /> {getTranslation(selectedLanguage, 'call')}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PanicMode;
