import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, AlertTriangle, Mic, Key, Scan } from 'lucide-react';
import { callGroq } from '../utils/aiProviders';
import ReactMarkdown from 'react-markdown';
import { getTranslation } from '../utils/translations';
import './AIChatbot.css';

const AIChatbot = ({ setTab, selectedLanguage, addToHistory, selectedHistoryItem, setSelectedHistoryItem, apiKey, onApiKeyChange }) => {
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      id: 1,
      text: getTranslation(selectedLanguage, 'initial_msg'),
      type: 'normal'
    }
  ]);

  // Load selected history if it changes
  useEffect(() => {
    if (selectedHistoryItem && selectedHistoryItem.type === 'chat') {
      setMessages(selectedHistoryItem.messages || []);
    } else if (!selectedHistoryItem) {
      setMessages([
        {
          role: 'bot',
          id: 1,
          text: getTranslation(selectedLanguage, 'initial_msg'),
          type: 'normal'
        }
      ]);
    }
  }, [selectedHistoryItem]);

  // Update initial message if language changes and it is the only message
  useEffect(() => {
    if (messages.length === 1 && messages[0].id === 1 && !selectedHistoryItem) {
      setMessages([{
        role: 'bot',
        id: 1,
        text: getTranslation(selectedLanguage, 'initial_msg'),
        type: 'normal'
      }]);
    }
  }, [selectedLanguage]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleApiKeyChange = (e) => {
    const newKey = e.target.value;
    onApiKeyChange(newKey);
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', id: Date.now(), text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    analyzeResponse(userMessage.text);
  };

  const analyzeResponse = async (text) => {
    const lowerText = text.toLowerCase();

    // 1. QUICK EMOTION/PANIC DETECTION
    if (lowerText.includes('panic') || lowerText.includes('anxious') || lowerText.includes('scared') || lowerText.includes('breathe')) {
      const calmMsg = {
        role: 'bot',
        id: Date.now(),
        type: 'calm',
        text: "I can sense you are feeling anxious. It's going to be okay. Please find a safe spot to sit. Let's take a deep breath together. Inhale... 2... 3... 4... hold... and exhale slowly. I am right here with you."
      };
      setMessages(prev => [...prev, calmMsg]);
      setIsTyping(false);
      return;
    }

    // 2. IMMEDIATE EMERGENCY KEYWORD DETECTION
    if (lowerText.includes('chest pain') || lowerText.includes('bleeding') || lowerText.includes('fainting') || lowerText.includes('unconscious')) {
      const emergencyMsg = {
        role: 'bot',
        id: Date.now(),
        type: 'emergency',
        text: "URGENT: Your symptoms indicate a possible medical emergency. Please press the **PANIC MODE** button or call 102/112 (Emergency Services) immediately. Do not drive yourself. Stay calm and sit down."
      };
      setMessages(prev => [...prev, emergencyMsg]);
      setIsTyping(false);
      return;
    }

    // 3. AI MEDICAL ANALYSIS VIA GROQ API
    try {
      const systemPrompt = `You are Sahaara AI, the world's most advanced clinical triage system. Your goal is to provide ACCURATE, DATA-DRIVEN, and COMPREHENSIVE medical guidance.
      User Language: ${selectedLanguage}
      
      Respond professionally in **${selectedLanguage}** with the following structure:
      1. **Clinical Assessment**: Analyze the symptoms and identify potential conditions with high accuracy.
      2. **Home Remedies (Gharelu Upchar)**: Provide specific, safe actions the user can take right now.
      3. **Basic Medication (OTC)**: Suggest common, over-the-counter medicines (e.g., Paracetamol, Cetirizine) only if safe and standard for these symptoms. Always add a "Consult a pharmacist" note.
      4. **Urgency Classification**: Tell them clearly if this is a Routine, Urgent, or Emergency situation.
      5. **When to see a Doctor**: Specific "Red Flags" to watch out for.
      
      DISCLAIMER: State clearly that you are an AI and this is not a substitute for professional medical advice.
      
      At the very end, include [SUMMARY_DATA] followed by a JSON: {"condition": "...", "urgency": "Low/Medium/High"}`;

      const responseText = await callGroq(systemPrompt, text);

      let finalMessage = responseText;
      let summary = null;

      if (responseText.includes('[SUMMARY_DATA]')) {
        const parts = responseText.split('[SUMMARY_DATA]');
        finalMessage = parts[0].trim();
        try {
          summary = JSON.parse(parts[1].trim());
        } catch (e) {
          console.error("Summary parse error", e);
        }
      }

      const botMessage = {
        role: 'bot',
        id: Date.now(),
        text: finalMessage,
        type: summary?.urgency === 'High' ? 'emergency' : 'normal'
      };

      setMessages(prev => [...prev, botMessage]);

      addToHistory({
        id: Date.now(),
        type: 'chat',
        condition: summary?.condition || 'Medical Inquiry',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        urgency: summary?.urgency || 'Normal',
        messages: [...messages, { role: 'user', id: Date.now() - 1, text }, botMessage]
      });

    } catch (error) {
      console.error("Triage Analysis Error:", error);
      let errorText = "I am having trouble connecting to the AI medical database. Please check your API configuration.";
      if (error.message === "MISSING_GROQ_API_KEY") {
        errorText = "AI API Key is missing. Please configure the Groq API key in your .env file.";
      }
      setMessages(prev => [...prev, {
        role: 'bot',
        id: Date.now(),
        text: errorText,
        type: 'normal'
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Voice recognition is not supported in this browser.");
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    const langMap = {
      English: 'en-US', Hindi: 'hi-IN', Tamil: 'ta-IN', Bengali: 'bn-IN',
      Marathi: 'mr-IN', Telugu: 'te-IN', Gujarati: 'gu-IN', Kannada: 'kn-IN',
      Malayalam: 'ml-IN', Punjabi: 'pa-IN'
    };
    recognition.lang = langMap[selectedLanguage] || 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };

    recognition.onerror = (event) => {
      console.error("Speech Recognition Error:", event.error);
      setIsRecording(false);
    };

    recognition.start();
  };

  return (
    <div className="chatbot-container">
      <div className="chat-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Bot size={28} />
          <div>
            <h2>{getTranslation(selectedLanguage, 'ai_triage')}</h2>
            <span className="online-status">● {getTranslation(selectedLanguage, 'online')}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {!import.meta.env.VITE_GROQ_API_KEY && (
            <div className="api-key-input" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.1)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--color-primary-200)' }}>
              <Key size={16} color="var(--color-primary-600)" />
              <span style={{ fontSize: '0.75rem', color: 'var(--color-primary-600)' }}>Groq AI Connected ✓</span>
            </div>
          )}
          <button
            className="camera-switch-btn"
            onClick={() => setTab('camera')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-primary-600)', color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '12px', cursor: 'pointer', fontWeight: '800', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }}
          >
            <Scan size={18} />
            <span className="desktop-only">{getTranslation(selectedLanguage, 'camera_emergency')}</span>
          </button>
        </div>
      </div>

      <div className="chat-disclaimer">
        <AlertTriangle size={18} />
        <p>{getTranslation(selectedLanguage, 'medical_disclaimer')}</p>
      </div>

      <div className="chat-area">
        {!import.meta.env.VITE_GROQ_API_KEY && (
          <div className="api-setup-overlay">
            <div className="setup-card">
              <Key size={40} color="var(--color-primary-600)" />
              <h3>Connect AI Engine</h3>
              <p>To use Sahaara's medical AI, please configure the VITE_GROQ_API_KEY in your .env file.</p>
              <div className="setup-links">
                <a href="https://console.groq.com" target="_blank" rel="noreferrer">Get Free Groq Key</a>
                <button onClick={() => setTab('guide')}>How to setup?</button>
              </div>
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`message-bubble ${msg.role} ${msg.type || ''}`}>
            <div className="message-icon">
              {msg.role === 'bot' ? <Bot size={20} /> : <User size={20} />}
            </div>
            <div className="message-content">
              {msg.type === 'emergency' && (
                <div className="emergency-alert">
                  <AlertTriangle size={16} />
                  <strong>{getTranslation(selectedLanguage, 'emergency_action')}</strong>
                </div>
              )}
              {msg.type === 'calm' && (
                <div className="calm-alert">
                  <strong>{getTranslation(selectedLanguage, 'calm_mode')}</strong>
                </div>
              )}
              <div className="text-content">
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="message-bubble bot typing">
            <div className="dot"></div><div className="dot"></div><div className="dot"></div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <button
          className={`icon-btn voice-btn ${isRecording ? 'recording' : ''}`}
          onClick={handleVoiceInput}
          style={isRecording ? { background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' } : {}}
        >
          <Mic size={20} />
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={getTranslation(selectedLanguage, 'input_placeholder')}
        />
        <button className="icon-btn send-btn" onClick={handleSend}><Send size={20} /></button>
      </div>
    </div>
  );
};

export default AIChatbot;
