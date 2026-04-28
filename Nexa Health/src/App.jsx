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
import ReportAI from './components/ReportAI';

import PrivacyPolicy from './components/PrivacyPolicy';
import { useAuth } from './context/AuthContext';
import { SignedIn, SignedOut, SignIn, SignUp, useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
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
          <ReportAI 
            selectedLanguage={selectedLanguage} 
            userId={user?.id} 
            token={authToken} 
            userObj={user} 
          />
        );
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
        <div className="auth-page-container">
          <div className="auth-visual-side">
            <div className="visual-content">
              <div className="status-badge">
                <span className="pulse-dot"></span>
                System Live: Secure Connection Established
              </div>
              <h1 className="hero-title">Nexa Health</h1>
              <p className="hero-subtitle">
                Experience the future of personal healthcare.
                AI-driven insights, real-time monitoring, and expert consultations.
              </p>

              <div className="feature-list">
                <div className="feature-item">
                  <div className="feature-icon">🛡️</div>
                  <div className="feature-text">
                    <strong>Secure Data</strong>
                    <span>End-to-end encryption for all health records</span>
                  </div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">🤖</div>
                  <div className="feature-text">
                    <strong>AI Triage</strong>
                    <span>Instant medical guidance powered by Gemini</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="auth-form-side">
            <div className="auth-card-modern">
              <div className="auth-card-header">
                <h2>Welcome Back</h2>
                <p>Sign in to your premium health dashboard</p>
              </div>

              <div className="clerk-container-modern">
                {showSignup ?
                  <SignUp
                    routing="virtual"
                    signInUrl="/login"
                    appearance={{
                      baseTheme: dark,
                      variables: {
                        colorPrimary: '#10b981',
                        colorBackground: 'transparent',
                        colorInputBackground: 'rgba(255,255,255,0.05)',
                        colorText: '#fff',
                        borderRadius: '16px'
                      },
                      elements: {
                        card: {
                          background: 'transparent',
                          boxShadow: 'none',
                          border: 'none',
                          padding: '0'
                        },
                        formButtonPrimary: {
                          fontSize: '1rem',
                          textTransform: 'none',
                          fontWeight: '600',
                          height: '48px'
                        }
                      }
                    }}
                  /> :
                  <SignIn
                    routing="virtual"
                    signUpUrl="/signup"
                    appearance={{
                      baseTheme: dark,
                      variables: {
                        colorPrimary: '#10b981',
                        colorBackground: 'transparent',
                        colorInputBackground: 'rgba(255,255,255,0.05)',
                        colorText: '#fff',
                        borderRadius: '16px'
                      },
                      elements: {
                        card: {
                          background: 'transparent',
                          boxShadow: 'none',
                          border: 'none',
                          padding: '0'
                        },
                        formButtonPrimary: {
                          fontSize: '1rem',
                          textTransform: 'none',
                          fontWeight: '600',
                          height: '48px'
                        }
                      }
                    }}
                  />
                }
              </div>

              <div className="auth-footer">
                <button className="auth-toggle-btn" onClick={() => setShowSignup(!showSignup)}>
                  {showSignup ? 'Already have an account? Sign In' : "Don't have an account? Create one"}
                </button>
              </div>
            </div>
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
