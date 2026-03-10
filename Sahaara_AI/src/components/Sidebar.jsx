import React, { useState } from 'react';
import {
  Home, MessageCircle, MapPin, Bell, BookOpen, AlertTriangle, FileText, Search, Globe, ChevronDown, LogOut, Stethoscope, Camera, Menu, X
} from 'lucide-react';
import { getTranslation } from '../utils/translations';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({
  currentTab, setTab, activatePanic, selectedLanguage, setSelectedLanguage,
  chatHistory, selectedHistoryItem, setSelectedHistoryItem,
  isMobileMenuOpen, setIsMobileMenuOpen
}) => {
  const [searchLang, setSearchLang] = useState('');
  const [showLangs, setShowLangs] = useState(false);
  const { logout, user } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: getTranslation(selectedLanguage, 'dashboard'), icon: <Home size={22} /> },
    { id: 'chat', label: getTranslation(selectedLanguage, 'ai_triage'), icon: <MessageCircle size={22} /> },
    { id: 'doctor', label: getTranslation(selectedLanguage, 'virtual_doctor'), icon: <Stethoscope size={22} /> },
    { id: 'nearby', label: getTranslation(selectedLanguage, 'nearby_help'), icon: <MapPin size={22} /> },
    { id: 'reminders', label: getTranslation(selectedLanguage, 'medicines'), icon: <Bell size={22} /> },
    { id: 'camera', label: getTranslation(selectedLanguage, 'camera_emergency'), icon: <Camera size={22} /> },
    { id: 'guide', label: getTranslation(selectedLanguage, 'emergency_guide'), icon: <BookOpen size={22} /> },
    { id: 'report', label: getTranslation(selectedLanguage, 'health_report'), icon: <FileText size={22} /> }
  ];

  const indianLanguages = [
    "English", "Hindi", "Bengali", "Marathi", "Telugu", "Tamil", "Gujarati", "Urdu",
    "Kannada", "Odia", "Malayalam", "Punjabi", "Sanskrit", "Assamese",
    "Maithili", "Santali", "Kashmiri", "Nepali", "Sindhi", "Konkani",
    "Dogri", "Manipuri", "Bodo"
  ];

  const filteredLangs = indianLanguages.filter(lang =>
    lang.toLowerCase().includes(searchLang.toLowerCase())
  );

  return (
    <>
      {/* Mobile Top Header (only visible on mobile) */}
      <div className="mobile-header">
        <button
          className="mobile-menu-btn"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <Menu size={24} />
        </button>
        <h1 className="mobile-title">Sahaara AI</h1>
        <div style={{ width: 24 }}></div> {/* Spacer for flex centering */}
      </div>

      <aside className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <h1 onClick={() => setTab('dashboard')} style={{ cursor: 'pointer' }}>Sahaara AI</h1>
          <button
            className="mobile-close-btn"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={24} />
          </button>
        </div>

        <nav className="nav-links">
          {menuItems.map(item => (
            <div
              key={item.id}
              className={`nav-item ${currentTab === item.id ? 'active' : ''}`}
              onClick={() => setTab(item.id)}
            >
              {item.icon}
              <span>{item.label}</span>
            </div>
          ))}

          <div className="language-selector-section">
            <div className="lang-header" onClick={() => setShowLangs(!showLangs)}>
              <div className="lang-info">
                <Globe size={18} />
                <span>{selectedLanguage}</span>
              </div>
              <ChevronDown size={14} className={showLangs ? 'rotate' : ''} />
            </div>

            {showLangs && (
              <div className="lang-dropdown">
                <div className="lang-search">
                  <Search size={14} />
                  <input
                    type="text"
                    placeholder={getTranslation(selectedLanguage, 'search_language')}
                    value={searchLang}
                    onChange={(e) => setSearchLang(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="lang-list">
                  {filteredLangs.map(lang => (
                    <div
                      key={lang}
                      className={`lang-option ${selectedLanguage === lang ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedLanguage(lang);
                        setShowLangs(false);
                        setSearchLang('');
                      }}
                    >
                      {lang}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="chat-history-section">
            <div className="history-header">
              <h3>{getTranslation(selectedLanguage, 'chat_history')}</h3>
              <button className="new-chat-btn" onClick={() => {
                setSelectedHistoryItem(null);
                if (currentTab !== 'chat' && currentTab !== 'doctor') {
                  setTab('chat');
                }
              }}>
                {getTranslation(selectedLanguage, 'new_chat')}
              </button>
            </div>
            <div className="history-list">
              {chatHistory && chatHistory.length > 0 ? (
                chatHistory.map((item) => (
                  <div
                    key={item.id}
                    className={`history-item ${selectedHistoryItem?.id === item.id ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedHistoryItem(item);
                      setTab(item.type === 'doctor' ? 'doctor' : 'chat');
                    }}
                  >
                    <div className="history-info">
                      <span className="condition">{item.condition || 'Unknown'}</span>
                      <span className="time">{item.time || ''}</span>
                    </div>
                    <div className="history-meta">
                      <span className="type-tag">{getTranslation(selectedLanguage, item.type || 'ai_triage')}</span>
                      <span className={`urgency-badge ${(item.urgency || 'low').toLowerCase()}`}>
                        {getTranslation(selectedLanguage, (item.urgency || 'low').toLowerCase()) || item.urgency || 'Low'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-history">{getTranslation(selectedLanguage, 'no_history')}</p>
              )}
            </div>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">{user?.name?.charAt(0) || 'U'}</div>
            <div className="user-details">
              <span className="user-name">{user?.name}</span>
              <button className="logout-link" onClick={logout}>
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          </div>
          <button className="panic-button" onClick={activatePanic}>
            <AlertTriangle size={24} strokeWidth={2.5} />
            <span>{getTranslation(selectedLanguage, 'panic_mode')}</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
