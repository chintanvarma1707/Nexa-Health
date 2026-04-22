import React, { useState, useEffect } from 'react';
import { 
  FileText, Printer, Stethoscope, Clock, 
  AlertCircle, ChevronRight, Loader, History, 
  Trash2, Calendar, User, MessageSquare, Mic 
} from 'lucide-react';
import { getConversationHistory, deleteConversation } from '../utils/userDb';
import { callGroq } from '../utils/aiProviders';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import './HealthReport.css';

const HealthReport = ({ selectedLanguage, userId, token, userObj }) => {
  const [history, setHistory] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [summary, setSummary] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [userId, token]);

  const loadHistory = async () => {
    if (userId && token) {
      setIsLoadingHistory(true);
      const convs = await getConversationHistory(userId, token);
      setHistory(convs);
      setIsLoadingHistory(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm("Delete this consultation from your records?")) {
      await deleteConversation(userId, id, token);
      setHistory(prev => prev.filter(h => h.id !== id));
      if (selectedConv?.id === id) {
        setSelectedConv(null);
        setSummary(null);
      }
    }
  };

  const generateSummary = async (conv) => {
    setIsGenerating(true);
    setSelectedConv(conv);
    setSummary(null);

    const convText = conv.messages
      .map(m => `${m.role === 'user' ? 'Patient' : 'Dr. Nexa'}: ${m.content}`)
      .join('\n\n');

    const prompt = `You are a professional medical scribe. Summarize the following clinical conversation into a formal, structured MEDICAL REPORT for a licensed physician.
    
    Conversation:
    ${convText}
    
    Use the following Markdown structure strictly:
    # 📋 CLINICAL SUMMARY
    
    ## 👤 Patient Reported Symptoms
    (Bullet points of symptoms reported by the patient, duration, and severity)
    
    ## 🏥 Clinical Interpretation
    (The AI's assessment of what might be happening)
    
    ## 💊 Recommended Management
    (List specific OTC medications with dosage/frequency IF suggested in chat, and home remedies)
    
    ## ⚠️ Urgent Red Flags
    (List specific symptoms that require immediate ER attention for this condition)
    
    ## 👨‍⚕️ Follow-up Advice
    (When to see a doctor in person)
    
    Write in a clinical, objective tone. Do not use conversational filler.`;

    try {
      const result = await callGroq("Format as a clean medical report.", prompt);
      setSummary(result);
    } catch (error) {
      setSummary("⚠️ **Error:** Failed to generate clinical summary. Please ensure your Groq API key is valid in the settings.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Group history by date
  const groupedHistory = history.reduce((acc, conv) => {
    const date = new Date(conv.timestamp).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    if (!acc[date]) acc[date] = [];
    acc[date].push(conv);
    return acc;
  }, {});

  return (
    <div className="report-container">
      <div className="report-header no-print">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h2 className="page-title">Health Intelligence</h2>
          <p className="subtitle">AI-generated clinical summaries for your healthcare provider.</p>
        </motion.div>
      </div>

      <div className="report-grid">
        {/* Sidebar: Conversation List */}
        <aside className="report-history-sidebar no-print">
          <div className="sidebar-header">
            <History size={18} />
            <span>Consultation History</span>
          </div>
          
          <div className="history-list">
            {isLoadingHistory ? (
              <div className="sidebar-loader">
                <Loader className="spin-icon" size={24} />
                <span>Fetching records...</span>
              </div>
            ) : history.length > 0 ? (
              Object.entries(groupedHistory).map(([date, convs]) => (
                <div key={date} className="date-group">
                  <h4 className="date-label">{date}</h4>
                  {convs.map((conv) => (
                    <div 
                      key={conv.id} 
                      className={`history-item ${selectedConv?.id === conv.id ? 'active' : ''}`}
                      onClick={() => generateSummary(conv)}
                    >
                      <div className="conv-type-icon">
                        {conv.type === 'voice' ? <Mic size={14} /> : <MessageSquare size={14} />}
                      </div>
                      <div className="conv-info">
                        <span className="conv-title">{conv.title || 'General Consultation'}</span>
                        <span className="conv-time">{new Date(conv.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <button className="delete-conv-btn" onClick={(e) => handleDelete(e, conv.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ))
            ) : (
              <div className="no-history-state">
                <FileText size={40} opacity={0.2} />
                <p>No records found</p>
              </div>
            )}
          </div>
        </aside>

        {/* Main: Report Content */}
        <main className="report-main-content">
          <AnimatePresence mode="wait">
            {isGenerating ? (
              <motion.div 
                key="loading"
                className="report-loading-state"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              >
                <div className="pulse-circles">
                  <div className="circle"></div>
                  <div className="circle"></div>
                  <div className="circle"></div>
                </div>
                <h3>Analyzing Clinical Data</h3>
                <p>Synthesizing conversation into a professional summary...</p>
              </motion.div>
            ) : summary ? (
              <motion.div 
                key="report"
                className="report-paper-wrapper"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              >
                <div className="report-actions no-print">
                  <button className="premium-btn print-btn" onClick={handlePrint}>
                    <Printer size={18} /> Export as PDF
                  </button>
                </div>
                
                <div className="report-paper shadow-premium" id="printable-report">
                  <div className="report-watermark">NEXA AI</div>
                  
                  <header className="clinical-header">
                    <div className="brand-box">
                      <div className="brand-logo"><Stethoscope size={28} /></div>
                      <div className="brand-text">
                        <h1>SAHAARA AI</h1>
                        <span>DIGITAL HEALTH INTELLIGENCE</span>
                      </div>
                    </div>
                    <div className="meta-grid">
                      <div className="meta-item">
                        <Calendar size={12} />
                        <span><strong>DATE:</strong> {new Date().toLocaleDateString()}</span>
                      </div>
                      <div className="meta-item">
                        <User size={12} />
                        <span><strong>PATIENT:</strong> {userObj?.fullName || 'Valued User'}</span>
                      </div>
                      <div className="meta-item">
                        <Clock size={12} />
                        <span><strong>ID:</strong> {userId?.slice(-8).toUpperCase()}</span>
                      </div>
                    </div>
                  </header>

                  <div className="clinical-body">
                    <ReactMarkdown className="markdown-report">
                      {summary}
                    </ReactMarkdown>
                  </div>

                  <footer className="clinical-footer">
                    <div className="warning-box">
                      <AlertCircle size={16} />
                      <p>This report is synthesized by AI. It is NOT a professional diagnosis. Please present this to a human doctor for formal evaluation.</p>
                    </div>
                    <div className="verification">
                      <div className="qr-code-placeholder"></div>
                      <div className="signature">
                        <span className="sig-line"></span>
                        <span className="sig-label">Digital Signature: Sahaara AI Agent</span>
                      </div>
                    </div>
                  </footer>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="empty"
                className="report-empty-state"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              >
                <div className="empty-illustration">
                  <FileText size={80} className="float-icon" />
                  <div className="sparkle s1"></div>
                  <div className="sparkle s2"></div>
                </div>
                <h3>Ready to Generate</h3>
                <p>Select a consultation from the history to create a structured report for your doctor.</p>
                {history.length === 0 && (
                  <div className="empty-hint">Start a chat with Dr. Nexa to see records here.</div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default HealthReport;

