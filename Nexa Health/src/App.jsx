import React, { useState, useEffect } from 'react';

import './App.css';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import NearbyHelp from './components/NearbyHelp';
import EmergencyGuide from './components/EmergencyGuide';
import HealthReport from './components/HealthReport';
import EmergencyCamera from './components/EmergencyCamera';
import PanicMode from './components/PanicMode';
import Loader from './components/Loader';
import VirtualDoctorChat from './components/VirtualDoctorChat';
import MedicineAgent from './components/MedicineAgent';
import ConsultationHistory from './components/ConsultationHistory';

import Settings from './components/Settings';

import PrivacyPolicy from './components/PrivacyPolicy';
import { useAuth } from './context/AuthContext';
import { SignedIn, SignedOut, SignIn, SignUp, useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';



function App() {
  const { loading, chatHistory, addToHistory, token: legacyToken } = useAuth();
  const { user } = useUser();
  const { getToken } = useClerkAuth();

  const [authToken, setAuthToken] = useState(null);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isPanicMode, setIsPanicMode] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [showSignup, setShowSignup] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Persistent Chat State
  const [activeMessages, setActiveMessages] = useState([
    {
      role: 'assistant',
      content: "Namaste! Please select your preferred language to continue:",
      type: 'language-selector'
    }
  ]);
  const [activeMode, setActiveMode] = useState('chat'); // 'chat' | 'voice'
  const [activeHistory, setActiveHistory] = useState([]);

  const resetActiveChat = () => {
    setActiveMessages([
      {
        role: 'assistant',
        content: "Namaste! Please select your preferred language to continue:",
        type: 'language-selector'
      }
    ]);
    setActiveMode('chat');
  };

  // Fetch fresh token on load
  useEffect(() => {

    if (user) {
      getToken().then(t => setAuthToken(t));
    }
  }, [user, getToken]);

  const [apiKey, setApiKey] = useState(import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('nexa_gemini_key') || '');

  // Lifted state for persistent AI Report Agent
  const [reportState, setReportState] = useState({
    mode: null,
    previewImage: null,
    scanResult: null,
    errorStatus: null
  });

  // Follow-up context for Virtual Doctor Chat
  const [doctorInitialContext, setDoctorInitialContext] = useState(null);

  const handleApiKeyChange = (newKey) => {
    setApiKey(newKey);
    localStorage.setItem('nexa_gemini_key', newKey);
  };

  if (loading) return <Loader />;

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard setTab={setCurrentTab} selectedLanguage={selectedLanguage} />;
      case 'doctor':
        return (
          <VirtualDoctorChat
            selectedLanguage={selectedLanguage}
            initialContext={doctorInitialContext}
            clearInitialContext={() => setDoctorInitialContext(null)}
            userId={user?.id}
            token={authToken}
            activeMessages={activeMessages}
            setActiveMessages={setActiveMessages}
            activeMode={activeMode}
            setActiveMode={setActiveMode}
            onNewChat={resetActiveChat}
            setSelectedLanguage={setSelectedLanguage}
          />
        );
      case 'history':
        return (
          <ConsultationHistory
            userId={user?.id}
            token={authToken}
            selectedLanguage={selectedLanguage}
            onSelect={(conv) => {
              setActiveMessages(conv.messages);
              setActiveMode(conv.type || 'chat');
              setCurrentTab('doctor');
            }}
          />
        );

      case 'settings':
        return <Settings selectedLanguage={selectedLanguage} setSelectedLanguage={setSelectedLanguage} />;
      case 'privacy':
        return <PrivacyPolicy />;
      case 'nearby':
        return <NearbyHelp selectedLanguage={selectedLanguage} />;
      case 'camera':
        return (
          <EmergencyCamera
            selectedLanguage={selectedLanguage}
            onCancel={() => setCurrentTab('dashboard')}
            setTab={setCurrentTab}
            reportState={reportState}
            setReportState={setReportState}
            setDoctorInitialContext={setDoctorInitialContext}
          />
        );
      case 'medicine':
        return <MedicineAgent selectedLanguage={selectedLanguage} />;
      case 'guide':
        return <EmergencyGuide selectedLanguage={selectedLanguage} />;
      case 'report':
        return <HealthReport selectedLanguage={selectedLanguage} userId={user?.id} token={authToken} userObj={user} />;
      case 'report-ai':
        return (
          <EmergencyCamera
            selectedLanguage={selectedLanguage}
            onCancel={() => setCurrentTab('dashboard')}
            setTab={setCurrentTab}
            reportState={reportState}
            setReportState={setReportState}
            setDoctorInitialContext={setDoctorInitialContext}
          />
        );
      case 'history':
        return <Dashboard setTab={setCurrentTab} selectedLanguage={selectedLanguage} />;
      default:
        return <Dashboard setTab={setCurrentTab} selectedLanguage={selectedLanguage} />;
    }
  };


  if (isPanicMode) {
    return <PanicMode onCancel={() => setIsPanicMode(false)} selectedLanguage={selectedLanguage} />;
  }

  return (
    <>
      <SignedOut>
        <div className="auth-wrapper">
          <div className="auth-card">
            <h1 className="brand-title">Nexa Health</h1>
            <p className="brand-subtitle">Your Premium Healthcare Assistant</p>
            <div className="clerk-container">
              {showSignup ?
                <SignUp routing="virtual" signInUrl="/login" /> :
                <SignIn routing="virtual" signUpUrl="/signup" />
              }
            </div>
            <button className="toggle-auth-btn" onClick={() => setShowSignup(!showSignup)}>
              {showSignup ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="app-container">
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
              setIsMobileMenuOpen(false);
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
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="content-wrapper"
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </SignedIn>
    </>
  );
}

export default App;
