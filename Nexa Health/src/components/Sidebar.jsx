import React from 'react';
import './Sidebar.css';
import {
  Home, MessageSquare, AlertCircle, HeartPulse,
  FileText, Settings, LogOut, Menu, X, Shield, Stethoscope, User, History, Pill
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

  const navItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'doctor', icon: Stethoscope, label: 'AI Medical Consultant' },
    { id: 'nearby', icon: HeartPulse, label: 'Nearby Help' },
    { id: 'medicine', icon: Pill, label: 'Medicine Agent' },
    { id: 'guide', icon: FileText, label: 'Emergency Guide' },
    { id: 'report', icon: FileText, label: 'Health Report' },

  ];



  const bottomNavItems = [
    { id: 'history', icon: History, label: 'History' },
    { id: 'privacy', icon: Shield, label: 'Privacy Policy' },
    { id: 'settings', icon: Settings, label: 'Settings' },
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
            <option value="Bengali">🇧🇩 Bengali (বাংলা)</option>
            <option value="Marathi">🇮🇳 Marathi (मराठी)</option>
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
