import React, { useState, useEffect } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import AIChatbot from './components/AIChatbot';
import NearbyHelp from './components/NearbyHelp';
import MedicineReminders from './components/MedicineReminders';
import EmergencyGuide from './components/EmergencyGuide';
import HealthReport from './components/HealthReport';
import PanicMode from './components/PanicMode';
import Login, { Signup } from './components/Login';
import Loader from './components/Loader';
import VirtualDoctor from './components/VirtualDoctor';
import EmergencyCamera from './components/EmergencyCamera';
import { useAuth } from './context/AuthContext';

function App() {
  const { user, token, loading, chatHistory, addToHistory } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isPanicMode, setIsPanicMode] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [showSignup, setShowSignup] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('sahaara_gemini_key') || '');

  const handleApiKeyChange = (newKey) => {
    setApiKey(newKey);
    localStorage.setItem('sahaara_gemini_key', newKey);
  };

  if (loading) return <Loader />;

  if (!user) {
    return showSignup ? (
      <Signup onToggle={() => setShowSignup(false)} />
    ) : (
      <Login onToggle={() => setShowSignup(true)} />
    );
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard setTab={setCurrentTab} selectedLanguage={selectedLanguage} />;
      case 'chat':
        return (
          <AIChatbot
            setTab={setCurrentTab}
            selectedLanguage={selectedLanguage}
            addToHistory={addToHistory}
            selectedHistoryItem={selectedHistoryItem}
            setSelectedHistoryItem={setSelectedHistoryItem}
            apiKey={apiKey}
            onApiKeyChange={handleApiKeyChange}
          />
        );
      case 'doctor':
        return (
          <VirtualDoctor
            selectedLanguage={selectedLanguage}
            token={token}
            addToHistory={addToHistory}
            selectedHistoryItem={selectedHistoryItem}
            setSelectedHistoryItem={setSelectedHistoryItem}
            apiKey={apiKey}
          />
        );
      case 'nearby':
        return <NearbyHelp selectedLanguage={selectedLanguage} />;
      case 'reminders':
        return <MedicineReminders selectedLanguage={selectedLanguage} />;
      case 'camera':
        return (
          <EmergencyCamera
            selectedLanguage={selectedLanguage}
            onCancel={() => setCurrentTab('dashboard')}
            setTab={setCurrentTab}
            globalApiKey={apiKey}
            onApiKeyChange={handleApiKeyChange}
          />
        );
      case 'guide':
        return <EmergencyGuide selectedLanguage={selectedLanguage} />;
      case 'report':
        return <HealthReport selectedLanguage={selectedLanguage} />;
      default:
        return <Dashboard setTab={setCurrentTab} />;
    }
  };

  if (isPanicMode) {
    return <PanicMode onCancel={() => setIsPanicMode(false)} selectedLanguage={selectedLanguage} />;
  }

  return (
    <div className="app-container">
      {/* Mobile top bar is now handled inside Sidebar or alongside it */}

      {/* Overlay to close menu on mobile */}
      {isMobileMenuOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      <Sidebar
        currentTab={currentTab}
        setTab={(tab) => {
          setCurrentTab(tab);
          setIsMobileMenuOpen(false); // Auto close on select
        }}
        activatePanic={() => setIsPanicMode(true)}
        selectedLanguage={selectedLanguage}
        setSelectedLanguage={setSelectedLanguage}
        chatHistory={chatHistory}
        selectedHistoryItem={selectedHistoryItem}
        setSelectedHistoryItem={setSelectedHistoryItem}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
