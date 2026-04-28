import React, { useState, useEffect } from 'react';
import { 
  FileText, Printer, Stethoscope, Clock, 
  AlertCircle, ChevronRight, Loader, History, 
  Trash2, Calendar, User, MessageSquare, Mic,
  Activity, Pill, CheckCircle2, ChevronDown
} from 'lucide-react';
import { getConversationHistory, deleteConversation } from '../utils/userDb';
import { callGroq } from '../utils/aiProviders';
import { useTranslation } from '../utils/translations';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import './HealthReport.css';

const HealthReport = ({ selectedLanguage, userId, token, userObj }) => {
  const t = useTranslation(selectedLanguage);
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

  const generateSummary = async (conv) => {
    setIsGenerating(true);
    setSelectedConv(conv);
    setSummary(null);

    try {
      if (!conv || !conv.messages || conv.messages.length === 0) {
        throw new Error("This consultation has no recorded messages to summarize.");
      }

      const convText = conv.messages
        .map(m => `${m.role === 'user' ? 'Patient' : 'Dr. Nexa'}: ${m.content}`)
        .join('\n\n');

      const prompt = `You are a professional medical scribe. Summarize the following clinical conversation into a CONCISE, formal, structured MEDICAL REPORT that fits on a single A4 page.
      
      Conversation:
      ${convText}
      
      Use the following Markdown structure:
      # 📋 CLINICAL SUMMARY
      
      ## 👤 Symptoms Reported
      ## 🏥 Clinical Interpretation
      ## 💊 Recommended Management
      ## 👨‍⚕️ Advice & Red Flags (⚠️)`;

      const result = await callGroq("Format as a clean medical report.", prompt);
      setSummary(result);
    } catch (error) {
      console.error("Health Report Error:", error);
      setSummary(`⚠️ **Error:** ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => window.print();

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
          <p className="subtitle">Synthesize clinical data and consultation history</p>
        </motion.div>
      </div>

      <div className="report-grid">
        <aside className="report-history-sidebar no-print">
          <div className="sidebar-header">
            <History size={18} />
            <span>Consultation History</span>
          </div>
          
          <div className="history-list">
            {isLoadingHistory ? (
              <div className="sidebar-loader">
                <Loader className="spin-icon" size={24} />
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
                    </div>
                  ))}
                </div>
              ))
            ) : (
              <div className="no-history-state">
                <FileText size={40} opacity={0.2} />
                <p>No consultations found</p>
              </div>
            )}
          </div>
        </aside>

        <main className="report-main-content">
          <AnimatePresence mode="wait">
            {isGenerating ? (
              <motion.div 
                key="loading"
                className="report-loading-state"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              >
                <div className="scanner-animation">
                  <div className="scan-line"></div>
                  <FileText size={64} className="file-icon" />
                </div>
                <h3>Generating Clinical Summary...</h3>
                <p>Our medical AI is analyzing the consultation data.</p>
              </motion.div>
            ) : summary ? (
              <motion.div 
                key="report"
                className="report-paper-wrapper"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              >
                <div className="report-actions no-print">
                  <button className="premium-btn print-btn" onClick={handlePrint}>
                    <Printer size={18} /> Export PDF
                  </button>
                </div>
                
                <div className="report-paper shadow-premium" id="printable-report">
                  <header className="clinical-header">
                    <div className="brand-box">
                      <div className="brand-logo"><Stethoscope size={28} /></div>
                      <div className="brand-text">
                        <h1>NEXA HEALTH</h1>
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
                    </div>
                  </header>

                  <div className="clinical-body">
                    <div className="markdown-report">
                      <ReactMarkdown>
                        {summary}
                      </ReactMarkdown>
                    </div>
                  </div>

                  <footer className="clinical-footer">
                    <div className="warning-box">
                      <AlertCircle size={16} />
                      <p>AI-synthesized report. Not a professional diagnosis. Please consult a human physician.</p>
                    </div>
                    <div className="verification">
                      <div className="signature">
                        <span className="sig-line"></span>
                        <span className="sig-label">Digital Signature: Nexa AI Medical Agent</span>
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
                  <Activity size={80} className="float-icon" />
                </div>
                <h3>Clinical History</h3>
                <p>Select a past consultation from the sidebar to generate a clinical summary report.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default HealthReport;
