import React, { useState } from 'react';
import './Settings.css';
import { useTranslation } from '../utils/translations';
import { useUser, useClerk } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import {
  User, Shield, Bell, Globe, LogOut, ChevronRight,
  Camera, Mail, Phone, Edit3, Save, X, Lock, Eye, EyeOff,
  Moon, Sun, Smartphone, HelpCircle
} from 'lucide-react';

const Settings = ({ selectedLanguage, setSelectedLanguage }) => {
  const { user } = useUser();
  const { signOut } = useClerk();
  const t = useTranslation(selectedLanguage);
  const [activeSection, setActiveSection] = useState('profile');
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.fullName || '');
  const [notifications, setNotifications] = useState({ emergency: true });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  
  // Emergency Contact State
  const [emergencyPhone, setEmergencyPhone] = useState(() => localStorage.getItem('nexa_emergency_phone') || '');
  const [emergencyEmail, setEmergencyEmail] = useState(() => localStorage.getItem('nexa_emergency_email') || '');
  const [emergencyMessage, setEmergencyMessage] = useState(() => localStorage.getItem('nexa_emergency_msg') || 'EMERGENCY! I need immediate help. My current live location is attached.');

  const handleSaveEmergency = () => {
    localStorage.setItem('nexa_emergency_phone', emergencyPhone);
    localStorage.setItem('nexa_emergency_email', emergencyEmail);
    localStorage.setItem('nexa_emergency_msg', emergencyMessage);
    setSaveMsg('Emergency contact saved!');
    setTimeout(() => setSaveMsg(''), 3000);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await user?.update({ firstName: displayName.split(' ')[0], lastName: displayName.split(' ').slice(1).join(' ') });
      setSaveMsg('Profile updated successfully!');
      setEditing(false);
    } catch (e) {
      setSaveMsg('Failed to update. Please try again.');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(''), 3000);
    }
  };

  const menuSections = [
    { id: 'profile', icon: User, label: t.profile, color: '#0b7a75' },
    { id: 'emergency_contacts', icon: Phone, label: t.emergencyContacts, color: '#ef4444' },
    { id: 'notifications', icon: Bell, label: t.notifications, color: '#8b5cf6' },
    { id: 'language', icon: Globe, label: t.languageRegion, color: '#f59e0b' },
    { id: 'privacy', icon: Shield, label: t.privacySecurity, color: '#64748b' },
    { id: 'about', icon: HelpCircle, label: t.aboutNexa, color: '#3b82f6' },
  ];

  const renderSection = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="settings-section-content">
            <div className="profile-hero">
              <div className="avatar-wrapper">
                {user?.imageUrl
                  ? <img src={user.imageUrl} alt="avatar" className="avatar-img" />
                  : <div className="avatar-fallback">{(user?.firstName?.[0] || 'U').toUpperCase()}</div>
                }
                <div className="avatar-badge"><Camera size={14} /></div>
              </div>
              <div className="profile-name-area">
                {editing ? (
                  <div className="edit-name-row">
                    <input
                      className="name-input"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Full Name"
                      autoFocus
                    />
                    <button className="save-btn" onClick={handleSaveProfile} disabled={saving}>
                      {saving ? '…' : <><Save size={16} /> Save</>}
                    </button>
                    <button className="cancel-btn" onClick={() => { setEditing(false); setDisplayName(user?.fullName || ''); }}>
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="name-row">
                    <h2 className="profile-display-name">{user?.fullName || 'User'}</h2>
                    <button className="edit-btn" onClick={() => setEditing(true)}>
                      <Edit3 size={15} /> Edit
                    </button>
                  </div>
                )}
                {saveMsg && <p className="save-msg">{saveMsg}</p>}
                <p className="profile-email">
                  <Mail size={14} /> {user?.primaryEmailAddress?.emailAddress}
                </p>
              </div>
            </div>

            <div className="info-cards">
              <div className="info-card">
                <span className="info-label">User ID</span>
                <span className="info-value mono">{user?.id?.slice(0, 20)}…</span>
              </div>
              <div className="info-card">
                <span className="info-label">Account Created</span>
                <span className="info-value">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="info-card">
                <span className="info-label">Last Sign In</span>
                <span className="info-value">{user?.lastSignInAt ? new Date(user.lastSignInAt).toLocaleDateString() : 'N/A'}</span>
              </div>
            </div>

            <div className="danger-zone">
              <h4>Account Actions</h4>
              <button className="sign-out-btn" onClick={() => signOut()}>
                <LogOut size={18} /> Sign Out of Nexa Health
              </button>
            </div>
          </div>
        );

      case 'emergency_contacts':
        return (
          <div className="settings-section-content">
            <h3 className="section-heading">Emergency SOS Contact</h3>
            <p className="section-subheading">Configure the contact who will receive your live location and message when you press the Emergency SOS button in Panic Mode.</p>
            
            <div className="emergency-form">
              <div className="form-group">
                <label>Emergency Phone Number</label>
                <input 
                  type="tel" 
                  placeholder="e.g. +1234567890" 
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  className="settings-input"
                />
              </div>

              <div className="form-group">
                <label>Emergency Email ID</label>
                <input 
                  type="email" 
                  placeholder="e.g. emergency@example.com" 
                  value={emergencyEmail}
                  onChange={(e) => setEmergencyEmail(e.target.value)}
                  className="settings-input"
                />
              </div>
              
              <div className="form-group">
                <label>Custom SOS Message</label>
                <textarea 
                  value={emergencyMessage}
                  onChange={(e) => setEmergencyMessage(e.target.value)}
                  className="settings-input settings-textarea"
                  rows="3"
                />
              </div>
              
              <button className="save-btn w-full mt-4" onClick={handleSaveEmergency}>
                <Save size={16} /> Save Emergency Settings
              </button>
              {saveMsg === 'Emergency contact saved!' && <p className="save-msg mt-2 text-center">{saveMsg}</p>}
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="settings-section-content">
            <h3 className="section-heading">Notification Preferences</h3>
            {[
              { key: 'emergency', label: 'Emergency Alerts', desc: 'Critical health and safety alerts' },
              { key: 'updates', label: 'App Updates', desc: 'New features and improvements' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="toggle-row">
                <div>
                  <p className="toggle-label">{label}</p>
                  <p className="toggle-desc">{desc}</p>
                </div>
                <div
                  className={`toggle-switch ${notifications[key] ? 'on' : 'off'}`}
                  onClick={() => setNotifications(prev => ({ ...prev, [key]: !prev[key] }))}
                >
                  <div className="toggle-knob" />
                </div>
              </div>
            ))}
          </div>
        );

      case 'language':
        return (
          <div className="settings-section-content">
            <h3 className="section-heading">Language & Region</h3>
            <div className="lang-grid">
              {[
                { code: 'English', label: 'English', native: 'English', flag: '🇬🇧' },
                { code: 'Hindi', label: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
                { code: 'Marathi', label: 'Marathi', native: 'मराठी', flag: '🇮🇳' },
                { code: 'Gujarati', label: 'Gujarati', native: 'ગુજરાતી', flag: '🇮🇳' },
              ].map((lang) => (
                <button
                  key={lang.code}
                  className={`lang-card ${selectedLanguage === lang.code ? 'selected' : ''}`}
                  onClick={() => setSelectedLanguage(lang.code)}
                >
                  <span className="lang-flag">{lang.flag}</span>
                  <span className="lang-name">{lang.label}</span>
                  <span className="lang-native">{lang.native}</span>
                  {selectedLanguage === lang.code && <span className="lang-check">✓</span>}
                </button>
              ))}
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="settings-section-content">
            <h3 className="section-heading">Privacy & Security</h3>
            <div className="privacy-items">
              {[
                { icon: Lock, label: 'Change Password', desc: 'Managed securely via Clerk authentication' },
                { icon: Shield, label: 'Two-Factor Authentication', desc: 'Add an extra layer of security' },
                { icon: Eye, label: 'Data Privacy', desc: 'Control what data Nexa Health collects' },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="privacy-item">
                  <div className="privacy-icon"><Icon size={20} /></div>
                  <div>
                    <p className="privacy-label">{label}</p>
                    <p className="privacy-desc">{desc}</p>
                  </div>
                  <ChevronRight size={18} className="privacy-arrow" />
                </div>
              ))}
            </div>
          </div>
        );

      case 'about':
        return (
          <div className="settings-section-content about-container">
            <div className="version-badge">v2.1.0</div>
            
            <div className="about-hero">
              <div className="about-logo">
                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 3 }}>
                  💚
                </motion.div>
              </div>
              <h2>Nexa Health</h2>
              <p className="about-tagline">Advanced Clinical Intelligence for Everyone</p>
            </div>

            <div className="mission-grid">
              <div className="mission-card">
                <div className="mission-icon">🩺</div>
                <h4>Clinical Triage</h4>
                <p>Advanced AI that interprets symptoms and provides structured clinical assessment for you and your doctor.</p>
              </div>
              <div className="mission-card">
                <div className="mission-icon">💊</div>
                <h4>Drug Intelligence</h4>
                <p>Instant pharmacological analysis identifying drug classes, interactions, and safe dosage guidelines.</p>
              </div>
              <div className="mission-card">
                <div className="mission-icon">🚨</div>
                <h4>Emergency Ready</h4>
                <p>Real-time SOS protocols and critical red-flag detection to keep you safe in high-risk health situations.</p>
              </div>
              <div className="mission-card">
                <div className="mission-icon">📋</div>
                <h4>Health Insights</h4>
                <p>Converting conversation history into structured medical reports to bridge the gap with healthcare providers.</p>
              </div>
            </div>

            <div className="about-statement">
              <h4>Empowering Your Health Journey</h4>
              <p>Nexa Health is built to democratize medical intelligence, providing you with instant, accurate, and actionable health insights whenever you need them.</p>
            </div>

            <p className="about-disclaimer">
              Nexa Health is an AI assistant designed for educational information. It does NOT provide formal medical diagnosis or treatment.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="settings-container">
      <motion.div className="settings-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1>Settings</h1>
        <p>Manage your Nexa Health preferences</p>
      </motion.div>

      <div className="settings-layout">
        {/* Left Menu */}
        <motion.nav
          className="settings-nav"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          {menuSections.map((item, i) => (
            <motion.button
              key={item.id}
              className={`settings-nav-item ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => setActiveSection(item.id)}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              <span className="settings-nav-icon" style={{ background: `${item.color}18`, color: item.color }}>
                <item.icon size={18} />
              </span>
              <span>{item.label}</span>
              <ChevronRight size={16} className="nav-arrow" />
            </motion.button>
          ))}
        </motion.nav>

        {/* Right Content */}
        <motion.div
          className="settings-content"
          key={activeSection}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderSection()}
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;
