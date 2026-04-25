import React from 'react';
import './Sidebar.css';
import { useTranslation } from '../utils/translations';
import {
  Home, MessageSquare, AlertCircle, HeartPulse,
  FileText, Settings, LogOut, Menu, X, Shield, Stethoscope, User, History, Pill,
  LayoutDashboard, FileSearch, MapPin
} from 'lucide-react';


import { useClerk } from '@clerk/clerk-react';
import { motion } from 'framer-motion';

const Sidebar = ({
  currentTab,
  setTab,
  activatePanic,
  selectedLanguage,
  setSelectedLanguage,
  isMobileMenuOpen,
  setIsMobileMenuOpen
}) => {
  const { signOut } = useClerk();
  const t = useTranslation(selectedLanguage);

  const navItems = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'doctor', label: t.virtualDoctor, icon: Stethoscope, badge: 'AI' },
    { id: 'report-ai', label: t.reportAi, icon: FileSearch },
    { id: 'nearby', label: t.nearbyHelp, icon: MapPin },
    { id: 'medicine', label: t.medicineAgent, icon: Pill },
    { id: 'guide', icon: FileText, label: t.emergencyGuide },
    { id: 'report', icon: FileText, label: t.healthReport },
  ];

  const bottomNavItems = [
    { id: 'history', icon: History, label: t.history },
    { id: 'privacy', icon: Shield, label: t.privacyPolicy },
    { id: 'settings', icon: Settings, label: t.settings },
  ];


  return (
    <>
      {/* Mobile Top Bar */}
      <div className="mobile-topbar">
        <div className="mobile-brand">
          <div className="logo-icon"><HeartPulse size={18} /></div>
          <span className="mobile-brand-name">Nexa Health</span>
        </div>
        <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(true)}>
          <Menu size={24} />
        </button>
      </div>

      {/* Sidebar */}
      <motion.aside
        className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}
        initial={false}
      >
        {/* Header */}
        <div className="sidebar-header">
          <div className="logo-icon"><HeartPulse size={24} /></div>
          <span className="logo-text">Nexa Health</span>
          {isMobileMenuOpen && (
            <button className="sidebar-close-btn" onClick={() => setIsMobileMenuOpen(false)}>
              <X size={20} />
            </button>
          )}
        </div>

        {/* Main Nav */}
        <div className="nav-links">
          <p className="nav-section-label">MAIN MENU</p>
          {navItems.map((item, i) => (
            <motion.button
              key={item.id}
              className={`nav-item ${currentTab === item.id ? 'active' : ''}`}
              onClick={() => setTab(item.id)}
              whileHover={{ x: 3 }}
              whileTap={{ scale: 0.97 }}
            >
              <item.icon size={19} />
              <span>{item.label}</span>
              {item.id === 'doctor' && <span className="nav-badge">AI</span>}
            </motion.button>
          ))}

          <p className="nav-section-label" style={{ marginTop: '1rem' }}>ACCOUNT</p>
          {bottomNavItems.map((item) => (
            <motion.button
              key={item.id}
              className={`nav-item ${currentTab === item.id ? 'active' : ''}`}
              onClick={() => setTab(item.id)}
              whileHover={{ x: 3 }}
              whileTap={{ scale: 0.97 }}
            >
              <item.icon size={19} />
              <span>{item.label}</span>
            </motion.button>
          ))}
        </div>

        {/* Footer */}
        <div className="sidebar-footer">
          <select
            className="lang-select"
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
          >
            <option value="English">🇬🇧 English</option>
            <option value="Hindi">🇮🇳 Hindi (हिन्दी)</option>
            <option value="Marathi">🇮🇳 Marathi (मराठी)</option>
            <option value="Gujarati">🇮🇳 Gujarati (ગુજરાતી)</option>
          </select>

          <button className="panic-button" onClick={activatePanic}>
            <AlertCircle size={18} />
            PANIC / SOS
          </button>

          <button className="nav-item sign-out-nav" onClick={() => signOut()}>
            <LogOut size={19} />
            <span>Sign Out</span>
          </button>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
