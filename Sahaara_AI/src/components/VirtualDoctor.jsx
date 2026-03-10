import React, { useState, useRef, useEffect } from 'react';
import NearbyHelp from './NearbyHelp';
import {
  Send, Mic, MicOff, AlertCircle, Download, User, Bot,
  PhoneCall, ShieldAlert, Heart, Calendar, FileText, ChevronRight,
  Play, Pause
} from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import ReactMarkdown from 'react-markdown';
import { getTranslation } from '../utils/translations';
import doctorAvatar from '../assets/doctor/avatar.png';
import './VirtualDoctor.css';

const VirtualDoctor = ({ selectedLanguage, token, addToHistory, selectedHistoryItem, setSelectedHistoryItem, apiKey }) => {
  const [messages, setMessages] = useState([
    {
      role: 'doctor',
      id: 1,
      text: getTranslation(selectedLanguage, 'initial_msg_doctor'),
      type: 'normal'
    }
  ]);

  // Load selected history if it changes
  useEffect(() => {
    if (selectedHistoryItem && selectedHistoryItem.type === 'doctor') {
      setMessages(selectedHistoryItem.messages || []);
    } else if (!selectedHistoryItem) {
      setMessages([
        {
          role: 'doctor',
          id: 1,
          text: getTranslation(selectedLanguage, 'initial_msg_doctor'),
          type: 'normal'
        }
      ]);
    }
  }, [selectedHistoryItem]);

  // Update initial message if language changes and it is the only message
  useEffect(() => {
    if (messages.length === 1 && messages[0].id === 1 && !selectedHistoryItem) {
      setMessages([{
        role: 'doctor',
        id: 1,
        text: getTranslation(selectedLanguage, 'initial_msg_doctor'),
        type: 'normal'
      }]);
    }
  }, [selectedLanguage]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [summary, setSummary] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isAudioPaused, setIsAudioPaused] = useState(false);

  // When summary is set, check risk level
  useEffect(() => {
    if (summary && (summary.risk_level === 'High' || summary.risk_level === 'Critical')) {
      setShowLocationPrompt(true);
    }
  }, [summary]);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setShowLocationPrompt(false);
      },
      (err) => {
        console.error(err);
        alert('Unable to retrieve location');
      }
    );
  };

  // Render location prompt UI
  const renderLocationPrompt = () => (
    <div className="location-prompt">
      <p>{getTranslation(selectedLanguage, 'high_risk_location_prompt')}</p>
      <button className="location-btn" onClick={requestLocation}>
        {getTranslation(selectedLanguage, 'turn_on_location')}
      </button>
    </div>
  );

  // Render NearbyHelp when location is available
  const renderNearbyHelp = () => (
    <NearbyHelp
      selectedLanguage={selectedLanguage}
      location={userLocation}
      condition={summary?.condition}
    />
  );

  // Insert the new UI sections after the disclaimer text
  // (Will be placed just before the closing </div> of the main container)

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', id: Date.now(), text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    await processDoctorResponse(input);
  };

  const speak = (text) => {
    if (!window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const langMap = {
      English: 'en-US', Hindi: 'hi-IN', Tamil: 'ta-IN', Bengali: 'bn-IN',
      Marathi: 'mr-IN', Telugu: 'te-IN', Gujarati: 'gu-IN', Kannada: 'kn-IN',
      Malayalam: 'ml-IN', Punjabi: 'pa-IN'
    };
    utterance.lang = langMap[selectedLanguage] || 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;

    window.speechSynthesis.speak(utterance);
    setIsAudioPaused(false);
  };

  const toggleAudioPlayback = () => {
    if (!window.speechSynthesis) return;

    if (isAudioPaused) {
      window.speechSynthesis.resume();
      setIsAudioPaused(false);
    } else {
      window.speechSynthesis.pause();
      setIsAudioPaused(true);
    }
  };

  // Speak initial message on load
  useEffect(() => {
    if (messages.length === 1 && messages[0].role === 'doctor') {
      speak(messages[0].text);
    }
  }, [selectedLanguage]);

  const processDoctorResponse = async (userInput) => {
    // 1. Local Emergency Detection (multi-language keywords could be added here)
    const emergencyKeywords = [
      'chest pain', 'breathing difficulty', 'choking', 'heavy bleeding', 'unconscious',
      'सीने में दर्द', 'सांस लेने में तकलीफ', 'दम घुटना', 'भारी रक्तस्राव', 'बेहोश'
    ];

    const isEmergencyInput = emergencyKeywords.some(keyword => userInput.toLowerCase().includes(keyword.toLowerCase()));

    if (isEmergencyInput && !isEmergency) {
      setIsEmergency(true);
    }

    if (!apiKey) {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'doctor',
          id: Date.now(),
          text: "I need an API key to provide a full medical assessment. Please enter it in the AI Chat section.",
          type: 'normal'
        }]);
        setIsTyping(false);
      }, 1000);
      return;
    }

    // 3. GLOBAL MEDICAL DATABASE VIA STABLE v1 REST API
    try {
      const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || apiKey;
      if (!API_KEY) throw new Error("MISSING_API_KEY");

      const modelName = "gemini-2.5-flash";
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`;

      const doctorPrompt = `You are Dr. Sahaara, a world-class AI medical specialist. You provide extremely high-accuracy clinical analysis and empathetic care.
      User message: "${userInput}"
      Language: ${selectedLanguage}
      Emergency State: ${isEmergency ? "ACTIVE" : "NONE"}
      
      Respond professionally in **${selectedLanguage}** with this exact structure:
      1. **Clinical Analysis**: Deep dive into the symptoms.
      2. **Possible Condition**: The most likely diagnosis (with confidence level).
      3. **Gharelu Upchar (Home Remedies)**: Specific, verified home-based care.
      4. **OTC Medications**: Safe over-the-counter medicine suggestions (e.g., Crocin, Avil) with a strong mandatory disclaimer to consult a doctor.
      5. **Emergency Signal**: Specific signs that mean "Go to ER immediately".
      
      Keep the tone reassuring and clinically precise. Always include a disclaimer at the end.
      
      At the end, include [SUMMARY_DATA] followed by a JSON: {"condition": "...", "severity": "...", "risk_level": "...", "duration": "...", "symptoms_list": []}`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: doctorPrompt }] }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Doctor API error details:", errorData);
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!responseText) throw new Error("Empty response");

      let finalMessage = responseText;
      let localSummary = null;

      if (responseText.includes('[SUMMARY_DATA]')) {
        const parts = responseText.split('[SUMMARY_DATA]');
        finalMessage = parts[0].trim();
        try {
          localSummary = JSON.parse(parts[1].trim());
          setSummary(localSummary);
        } catch (e) {
          console.error("Summary parse error", e);
        }
      }

      const doctorMessage = {
        role: 'doctor',
        id: Date.now(),
        text: finalMessage,
        type: isEmergency ? 'emergency' : 'normal'
      };

      setMessages(prev => [...prev, doctorMessage]);

      addToHistory({
        id: Date.now(),
        type: 'doctor',
        condition: localSummary?.condition || 'Medical Checkup',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        urgency: localSummary?.risk_level || 'Moderate',
        messages: [...messages, { role: 'user', id: Date.now() - 1, text: userInput }, doctorMessage]
      });

      speak(finalMessage);

    } catch (error) {
      console.error("Doctor Analysis Error:", error);
      let errorMsg = "I am having trouble connecting to my medical database. Please ensure your Gemini API key is configured correctly.";
      if (error.message === "MISSING_API_KEY") {
        errorMsg = "Doctor access requires a Gemini API Key. Please provide it in the AI Chat settings.";
      }
      setMessages(prev => [...prev, {
        role: 'doctor',
        id: Date.now(),
        text: errorMsg,
        type: 'normal'
      }]);
      speak(errorMsg);
    } finally {
      setIsTyping(false);
    }
  };

  const downloadSummary = () => {
    if (!summary) return;

    const content = `
SAHAARA AI - VIRTUAL DOCTOR VISIT SUMMARY
------------------------------------------
Date: ${new Date().toLocaleDateString()}
Language: ${selectedLanguage}

Primary Condition: ${summary.condition}
Duration: ${summary.duration}
Severity: ${summary.severity}
Risk Level: ${summary.risk_level}

Symptoms Noted:
${summary.symptoms_list.map(s => `- ${s}`).join('\n')}

DISCLAIMER: This summary was generated by Sahaara AI.
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Sahaara_Medical_Summary_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  const toggleRecording = () => {
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
    <div className={`virtual-doctor-container ${isEmergency ? 'emergency-mode' : ''}`}>
      <div className="virtual-doctor-header">
        <h1>{getTranslation(selectedLanguage, 'virtual_doctor')}</h1>
        <p>{getTranslation(selectedLanguage, 'talk_to_doctor')}</p>
      </div>

      {isEmergency && (
        <div className="emergency-alert-banner">
          <ShieldAlert size={28} />
          <div>
            <strong>{getTranslation(selectedLanguage, 'serious_symptoms')}</strong>
            <p>{getTranslation(selectedLanguage, 'visit_hospital')}</p>
          </div>
        </div>
      )}

      <div className="doctor-layout">
        <div className="doctor-video-panel">
          <div className="avatar-container">
            <img src={doctorAvatar} alt="Doctor Avatar" className="doctor-avatar" />
            <div className="lang-badge">{selectedLanguage}</div>
          </div>
          <div className="doctor-info-overlay">
            <p className="doctor-name">Dr. Sahaara (AI)</p>
            <div className="doctor-status">
              <span className="status-dot"></span>
              <span>{getTranslation(selectedLanguage, 'online')}</span>
            </div>
            <button
              className="audio-control-btn"
              onClick={toggleAudioPlayback}
              title={isAudioPaused ? getTranslation(selectedLanguage, 'resume') || "Resume Audio" : getTranslation(selectedLanguage, 'pause') || "Pause Audio"}
            >
              {isAudioPaused ? <Play size={16} /> : <Pause size={16} />}
              {isAudioPaused ? (getTranslation(selectedLanguage, 'resume') || "Resume") : (getTranslation(selectedLanguage, 'pause') || "Pause")}
            </button>
          </div>
        </div>

        <div className="conversation-panel">
          <div className="chat-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`message-bubble ${msg.role === 'doctor' ? 'doctor' : 'user'} ${msg.type === 'emergency' ? 'emergency' : ''}`}>
                <div className="text-content">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="message-bubble doctor typing">
                <div className="dot"></div><div className="dot"></div><div className="dot"></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-area">
            <button
              className={`icon-button ${isRecording ? 'recording' : ''}`}
              onClick={toggleRecording}
              style={{ color: isRecording ? '#ef4444' : '' }}
            >
              {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            <input
              type="text"
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={getTranslation(selectedLanguage, 'medical_concern')}
            />
            <button className="icon-button primary" onClick={handleSend}>
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>

      {summary && (
        <div className="summary-download-card">
          <div className="summary-info">
            <h3><FileText size={20} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> {getTranslation(selectedLanguage, 'visit_summary')}</h3>
            <p>{summary.condition} • {getTranslation(selectedLanguage, 'risk_level')}: {summary.risk_level}</p>
          </div>
          <button className="download-btn" onClick={downloadSummary}>
            <Download size={18} />
            {getTranslation(selectedLanguage, 'download_summary')}
          </button>
        </div>
      )}

      {/* Real Location-based Help */}
      {showLocationPrompt && renderLocationPrompt()}
      {userLocation && renderNearbyHelp()}

      <div className="disclaimer-text">
        {getTranslation(selectedLanguage, 'medical_disclaimer')}
      </div>
    </div>
  );
};

export default VirtualDoctor;
