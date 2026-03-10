import React from 'react';
import { MessageCircle, MapPin, Bell, BookOpen, AlertCircle, Stethoscope, Camera, Scan } from 'lucide-react';
import { getTranslation } from '../utils/translations';
import './Dashboard.css';

const Dashboard = ({ setTab, selectedLanguage }) => {
  return (
    <div className="dashboard-container">
      <h2 className="page-title">{getTranslation(selectedLanguage, 'welcome')}</h2>
      <p className="subtitle">{getTranslation(selectedLanguage, 'tagline')}</p>
      
      <div className="disclaimer">
        <AlertCircle size={24} color="var(--color-panic-500)" />
        <div>
          {getTranslation(selectedLanguage, 'medical_disclaimer')}
        </div>
      </div>

      <div className="grid-cards">
        <div className="dash-card primary" onClick={() => setTab('chat')}>
          <div className="icon-wrapper"><MessageCircle size={32} /></div>
          <h3>{getTranslation(selectedLanguage, 'start_consultation')}</h3>
          <p>{getTranslation(selectedLanguage, 'start_consultation_desc')}</p>
        </div>

        <div className="dash-card" onClick={() => setTab('doctor')}>
          <div className="icon-wrapper"><Stethoscope size={32} /></div>
          <h3>{getTranslation(selectedLanguage, 'virtual_doctor')}</h3>
          <p>{getTranslation(selectedLanguage, 'virtual_doctor_desc')}</p>
        </div>

        <div className="dash-card" onClick={() => setTab('nearby')}>
          <div className="icon-wrapper"><MapPin size={32} /></div>
          <h3>{getTranslation(selectedLanguage, 'nearby_hospitals')}</h3>
          <p>{getTranslation(selectedLanguage, 'nearby_hospitals_desc')}</p>
        </div>

        <div className="dash-card" onClick={() => setTab('reminders')}>
          <div className="icon-wrapper"><Bell size={32} /></div>
          <h3>{getTranslation(selectedLanguage, 'track_medicines')}</h3>
          <p>{getTranslation(selectedLanguage, 'track_medicines_desc')}</p>
        </div>

        <div className="dash-card featured" onClick={() => setTab('camera')}>
          <div className="icon-wrapper"><Scan size={32} /></div>
          <div className="badge">NEW</div>
          <h3>{getTranslation(selectedLanguage, 'camera_emergency')}</h3>
          <p>{getTranslation(selectedLanguage, 'camera_emergency_desc')}</p>
        </div>

        <div className="dash-card" onClick={() => setTab('guide')}>
          <div className="icon-wrapper"><BookOpen size={32} /></div>
          <h3>{getTranslation(selectedLanguage, 'emergency_steps')}</h3>
          <p>{getTranslation(selectedLanguage, 'emergency_steps_desc')}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
