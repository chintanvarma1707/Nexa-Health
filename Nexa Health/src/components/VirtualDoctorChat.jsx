import React, { useState, useRef, useEffect, useCallback } from 'react';
import './VirtualDoctor.css';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, Stethoscope, PhoneOff, Volume2, Loader,
  SkipForward, MessageSquare, Radio, Send, AlertTriangle,
  Home, Pill, HeartPulse, ChevronDown, ChevronUp, Camera, Upload
} from 'lucide-react';

import { callGroq } from '../utils/aiProviders';
import ReactMarkdown from 'react-markdown';
import { addConversationToHistory } from '../utils/userDb';

// ─── VOICE System Prompt (Short, Natural, Accurate) ──────────────────────────
const VOICE_PROMPT = `You are Dr. Nexa, a highly experienced AI medical consultant on a voice call.

CRITICAL ACCURACY RULES:
- Always auto-correct speech-to-text errors. "fear" = "fever", "seek" = "sick", etc. Never ask for clarification — interpret medically.
- You CAN and SHOULD recommend common OTC medications with correct dosage when appropriate (e.g., "You can take Paracetamol 500mg every 6 hours for the fever").
- Suggest safe home remedies whenever relevant.
- Clearly state when symptoms are EMERGENCIES requiring immediate hospital/911.
- Ask targeted clinical questions: duration, severity (1-10), location, pattern, associated symptoms.
- Keep each response SHORT (2-4 sentences) for voice. End with ONE follow-up question.
- NO markdown, no bullet points. Speak naturally.
- Be confident, warm, and clinically accurate.`;

// ─── CHAT System Prompt (Detailed, Structured) ────────────────────────────────
const CHAT_PROMPT = `You are Dr. Nexa, a highly accurate AI medical consultant providing DETAILED written medical guidance.

For every patient concern, structure your response EXACTLY as follows using markdown:

## 🔍 Assessment
Brief clinical interpretation of symptoms (be specific and accurate).

## ⚠️ Emergency Signs — Seek Immediate Help If:
- List 3-5 RED FLAG symptoms that need 911/ER immediately (be specific to their condition)

## 💊 Medications
Specific OTC medication recommendations with:
- Drug name (generic), dosage, frequency, duration
- Important contraindications/warnings
- Example: "Paracetamol (Acetaminophen) 500-1000mg every 6 hours (max 4g/day) — avoid if liver issues"

## 🏠 Home Remedies & Self-Care
- 4-6 specific, evidence-based home remedies
- Practical steps with timing/method

## 👨‍⚕️ When to See a Doctor
Clear criteria for scheduling a non-emergency appointment.

## 📋 My Clinical Recommendation
A direct, confident summary of what the patient should do right now.

RULES:
- Be medically accurate. Do not be vague or overly cautious.
- Auto-correct any spelling mistakes in the patient's query.
- Always recommend professional consultation for serious conditions.
- End with: "⚕️ This is AI guidance. Always consult a licensed physician for diagnosis and treatment."`;

// ─── Waveform ─────────────────────────────────────────────────────────────────
const Waveform = ({ active, color }) => (
  <div className="vd-waveform">
    {Array.from({ length: 30 }).map((_, i) => (
      <motion.div key={i} className="vd-wave-bar" style={{ background: color }}
        animate={active ? { scaleY: [0.15, 0.5 + (i % 5) * 0.15, 0.15] } : { scaleY: 0.12 }}
        transition={{ duration: active ? 0.45 + (i % 4) * 0.08 : 0.2, repeat: active ? Infinity : 0, repeatType: 'mirror', delay: i * 0.028, ease: 'easeInOut' }}
      />
    ))}
  </div>
);

// ─── Doctor Avatar ────────────────────────────────────────────────────────────
const DoctorAvatar = ({ status }) => {
  const STATUS = { idle: 'idle', listening: 'listening', processing: 'processing', speaking: 'speaking' };
  return (
    <div className="vd-avatar-outer">
      <AnimatePresence>
        {(status === 'speaking' || status === 'listening') && [0, 1].map(n => (
          <motion.div key={n} className="vd-pulse-ring"
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 1.9 + n * 0.5, opacity: 0 }}
            transition={{ duration: 2, repeat: Infinity, delay: n * 0.6, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>
      <div className={`vd-avatar-circle ${status}`}><Stethoscope size={50} /></div>
    </div>
  );
};

// ─── CHAT MODE ────────────────────────────────────────────────────────────────
const ChatMode = ({ initialContext, clearInitialContext, userId, token, messages, setMessages }) => {

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [chatHistory, setChatHistory] = useState([]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);

  useEffect(() => {
    if (initialContext) {
      handleSend(initialContext);
      clearInitialContext();
    }
  }, [initialContext]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = async (text) => {
    const msg = text || input.trim();
    if (!msg || isLoading) return;
    setInput('');
    const userMsg = { role: 'user', content: msg };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    const newHistory = [...chatHistory, { role: 'user', content: msg }];
    const contextPrompt = newHistory.slice(-6).map(m =>
      `${m.role === 'user' ? 'Patient' : 'Dr. Nexa'}: ${m.content}`
    ).join('\n\n');

    try {
      const response = await callGroq(
        CHAT_PROMPT,
        `Patient message (auto-correct any typos/speech errors): "${msg}"\n\nPrevious context:\n${contextPrompt}`
      );
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase();
      const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short' });
      const timestamp = { time: timeStr, date: dateStr };

      const assistantMsg = { 
        role: 'assistant', 
        content: response,
        timestamp 
      };
      
      const updatedMessages = [...messages, { ...userMsg, timestamp }, assistantMsg];
      setMessages(prev => {
        const withUser = prev.map((m, idx) => idx === prev.length - 1 ? { ...m, timestamp } : m);
        return [...withUser, assistantMsg];
      });
      setChatHistory([...newHistory, { role: 'assistant', content: response }]);
      
      // Save to local DB
      if (userId) {
        addConversationToHistory(userId, {
          id: Date.now().toString(),
          type: 'chat',
          timestamp: now.toISOString(),
          title: msg.slice(0, 40) + (msg.length > 40 ? '...' : ''),
          messages: updatedMessages
        }, token);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Connection error. Please check your Groq API key and try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("Voice recording not supported in this browser.");
        return;
      }
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.onresult = (event) => {
        const text = event.results[0][0].transcript;
        handleSend(text);
      };
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleSend(`[Sent a photo of: ${file.name}] Please analyze this medical image.`);
    }
  };


  const QUICK = [
    'I have fever for 2 hours, what should I take?',
    'I have a severe headache for 2 days',
    'I have chest pain and shortness of breath',
    'I have stomach pain and nausea',
    'My throat is sore and I have body aches',
    'I have a cold, what home remedies can help?',
  ];

  return (
    <div className="vd-chat-mode">
      <div className="vd-chat-messages">
        {messages.map((msg, i) => (
          <motion.div key={i} className={`vd-chat-msg ${msg.role}`}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            {msg.role === 'assistant' && (
              <div className="vd-chat-avatar-sm"><Stethoscope size={15} /></div>
            )}
            <div className={`vd-chat-bubble ${msg.role}`}>
              <ReactMarkdown>{msg.content}</ReactMarkdown>
              {msg.timestamp && (
                <div className="vd-chat-timestamp">
                  <span className="vd-time">{msg.timestamp.time}</span>
                  <span className="vd-date">{msg.timestamp.date}</span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <motion.div className="vd-chat-msg assistant" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="vd-chat-avatar-sm"><Stethoscope size={15} /></div>
            <div className="vd-chat-bubble assistant vd-typing">
              <span /><span /><span />
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {messages.length <= 2 && (
        <div className="vd-quick-grid">
          {QUICK.map(q => (
            <button key={q} className="vd-quick-card" onClick={() => handleSend(q)}>{q}</button>
          ))}
        </div>
      )}

      <div className="vd-chat-input-bar">
        <label className="vd-chat-tool-btn" title="Upload Photo">
          <Camera size={19} />
          <input type="file" accept="image/*" hidden onChange={handleFileUpload} />
        </label>
        
        <button 
          className={`vd-chat-tool-btn ${isRecording ? 'recording' : ''}`} 
          onClick={toggleRecording}
          title="Voice Message"
        >
          <Mic size={19} />
        </button>

        <input
          className="vd-chat-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Describe your symptoms in detail…"
          disabled={isLoading}
        />
        <motion.button
          className="vd-chat-send"
          onClick={() => handleSend()}
          disabled={!input.trim() || isLoading}
          whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
          <Send size={19} />
        </motion.button>
      </div>

    </div>
  );
};

// ─── VOICE MODE ───────────────────────────────────────────────────────────────
const VoiceMode = ({ userId, token, setMessages }) => {
  const [status, setStatus] = useState('idle');
  const [transcript, setTranscript] = useState('');
  const [doctorCaption, setDoctorCaption] = useState('');
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [exchanges, setExchanges] = useState(0);

  const synthRef = useRef(window.speechSynthesis);
  const recognitionRef = useRef(null);
  const statusRef = useRef('idle');
  const transcriptRef = useRef('');
  const historyRef = useRef([]);

  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => { historyRef.current = history; }, [history]);
  useEffect(() => { transcriptRef.current = transcript; }, [transcript]);
  useEffect(() => { return () => { synthRef.current?.cancel(); recognitionRef.current?.abort(); }; }, []);

  const speak = useCallback((text, onFinished) => {
    synthRef.current.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    const voices = synthRef.current.getVoices();
    const voice = voices.find(v =>
      v.name.includes('Google UK English Female') || v.name.includes('Samantha') ||
      v.name.includes('Karen') || (v.lang === 'en-GB' && v.name.toLowerCase().includes('female'))
    ) || voices.find(v => v.lang.startsWith('en')) || voices[0];
    if (voice) utt.voice = voice;
    utt.rate = 0.92; utt.pitch = 1.08; utt.volume = 1;
    setStatus('speaking'); setDoctorCaption(text);
    utt.onend = () => { setStatus('idle'); onFinished?.(); };
    utt.onerror = () => { setStatus('idle'); onFinished?.(); };
    synthRef.current.speak(utt);
  }, []);

  const startListening = useCallback(() => {
    if (statusRef.current === 'listening' || statusRef.current === 'processing') return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    recognitionRef.current?.abort();
    const rec = new SR();
    rec.lang = 'en-US'; rec.interimResults = true; rec.maxAlternatives = 1;
    recognitionRef.current = rec;
    let finalText = '';
    setTranscript(''); setStatus('listening');
    rec.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalText += e.results[i][0].transcript + ' ';
        else interim += e.results[i][0].transcript;
      }
      setTranscript((finalText + interim).trim());
    };
    rec.onend = () => {
      const text = finalText.trim() || transcriptRef.current.trim();
      if (text && statusRef.current !== 'processing') processAndRespond(text, historyRef.current);
      else if (!text) setStatus('idle');
    };
    rec.onerror = (e) => { if (e.error !== 'aborted') setError('Mic: ' + e.error); setStatus('idle'); };
    rec.start();
  }, []); // eslint-disable-line

  const processAndRespond = useCallback(async (userText, currentHistory) => {
    setStatus('processing'); setTranscript('');
    const context = currentHistory.slice(-8).map(m => `${m.role === 'user' ? 'Patient' : 'Dr. Nexa'}: ${m.content}`).join('\n\n');
    const isFirst = currentHistory.length === 0;
    const prompt = isFirst
      ? 'Greet the patient warmly and ask what brings them in. 2 natural sentences.'
      : `Conversation:\n${context}\n\nPatient said (fix any speech-to-text errors, interpret medically): "${userText}"\n\nRespond as Dr. Nexa. Include OTC medication name + dosage if relevant. 2-4 natural sentences, 1 follow-up question.`;
    try {
      const raw = await callGroq(VOICE_PROMPT, prompt);
      const clean = raw.replace(/\*\*/g, '').replace(/\*/g, '').replace(/#{1,6}\s/g, '').replace(/\n- /g, ' ').trim();
      const newHistory = [...currentHistory, ...(userText ? [{ role: 'user', content: userText }] : []), { role: 'assistant', content: clean }];
      setHistory(newHistory); historyRef.current = newHistory;
      setExchanges(e => e + (userText ? 1 : 0));
      speak(clean, () => setTimeout(() => startListening(), 500));
    } catch {
      setStatus('idle'); setError('Could not reach AI. Check your Groq API key.');
    }
  }, [speak, startListening]);

  const interrupt = useCallback(() => { synthRef.current.cancel(); setStatus('idle'); setTimeout(() => startListening(), 100); }, [startListening]);
  const handleMicClick = useCallback(() => {
    if (status === 'speaking') interrupt();
    else if (status === 'idle') startListening();
    else if (status === 'listening') recognitionRef.current?.stop();
  }, [status, interrupt, startListening]);

  const handleStartVoice = useCallback(() => {
    setError('');
    const tryStart = () => {
      if (synthRef.current.getVoices().length > 0) processAndRespond('', []);
      else synthRef.current.onvoiceschanged = () => processAndRespond('', []);
    };
    setTimeout(tryStart, 120);
  }, [processAndRespond]);

  const handleEndVoice = () => {
    // Save voice session to history before clearing
    if (userId && history.length > 0) {
      addConversationToHistory(userId, {
        id: Date.now().toString(),
        type: 'voice',
        timestamp: new Date().toISOString(),
        title: history[0]?.content?.slice(0, 40) || 'Voice Consultation',
        messages: history
      }, token);
      // Sync to persistent state if desired
      setMessages(history);
    }

    synthRef.current.cancel(); recognitionRef.current?.abort();
    setStatus('idle'); setHistory([]); setTranscript(''); setDoctorCaption(''); setExchanges(0); setError('');
  };

  const isSpeaking = status === 'speaking', isListening = status === 'listening', isProcessing = status === 'processing';

  // Not started yet
  if (history.length === 0 && status === 'idle' && !doctorCaption) {
    return (
      <div className="vd-voice-start-area">
        <DoctorAvatar status="idle" />
        <div className="vd-voice-info">
          <h2>Dr. Nexa — Voice</h2>
          <p>I'll speak to you and listen to your symptoms. I can recommend medications, home remedies, and tell you when to go to the ER.</p>
          <div className="vd-voice-features">
            <span>⚡ Interrupt anytime</span><span>💊 Medication advice</span><span>🏠 Home remedies</span>
          </div>
        </div>
        <motion.button className="vd-voice-start-btn" onClick={handleStartVoice} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}>
          <Mic size={20} /> Start Voice Consultation
        </motion.button>
      </div>
    );
  }

  return (
    <div className="vd-voice-active">
      <div className="vd-voice-topbar">
        <div className="vd-voice-call-info">
          <div className={`vd-call-dot ${isSpeaking ? 'speaking' : isProcessing ? 'processing' : isListening ? 'listening-dot' : 'idle'}`} />
          <span className="vd-status-text">
            {isSpeaking ? 'Dr. Nexa is speaking…' : isProcessing ? 'Analyzing…' : isListening ? 'Listening…' : 'Ready — tap mic'}
          </span>
        </div>
        <button className="vd-end-call-btn" onClick={handleEndVoice}><PhoneOff size={15} /> End</button>
      </div>

      <div className="vd-voice-stage">
        <DoctorAvatar status={status} />
        {isProcessing && <div className="vd-processing-indicator"><Loader size={16} className="spin-icon" /> <span>Analyzing symptoms…</span></div>}
        {(isSpeaking || (!isListening && !isProcessing && doctorCaption)) && <Waveform active={isSpeaking} color="rgba(11,122,117,0.85)" />}
        {isListening && <Waveform active color="rgba(239,68,68,0.85)" />}
        <AnimatePresence mode="wait">
          {doctorCaption && (
            <motion.div className={`vd-caption ${isSpeaking ? 'active' : 'faded'}`} key={doctorCaption.slice(0, 15)}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Volume2 size={13} style={{ color: '#0b7a75', flexShrink: 0 }} />
              <p>{doctorCaption}</p>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {(isListening || transcript) && (
            <motion.div className="vd-user-transcript" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Mic size={12} /><span>{transcript || 'Listening…'}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && <div className="vd-voice-error">⚠️ {error}</div>}

      <div className="vd-controls-area">
        <AnimatePresence>
          {isSpeaking && (
            <motion.button className="vd-interrupt-btn" onClick={interrupt}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.93 }}>
              <SkipForward size={14} /> Interrupt & Speak
            </motion.button>
          )}
        </AnimatePresence>
        <div className="vd-mic-wrap">
          <motion.button
            className={`vd-mic-btn ${isListening ? 'listening' : ''} ${isProcessing ? 'disabled' : ''} ${isSpeaking ? 'interrupt-mode' : ''}`}
            onClick={handleMicClick} disabled={isProcessing}
            whileHover={!isProcessing ? { scale: 1.07 } : {}} whileTap={!isProcessing ? { scale: 0.93 } : {}}>
            {isListening ? <motion.div animate={{ scale: [1, 1.18, 1] }} transition={{ repeat: Infinity, duration: 1 }}><Mic size={32} /></motion.div>
              : isSpeaking ? <SkipForward size={28} /> : <Mic size={32} />}
          </motion.button>
          <p className="vd-mic-label">
            {isListening ? 'Tap to finish' : isSpeaking ? 'Tap to interrupt' : isProcessing ? 'Processing…' : 'Tap to speak'}
          </p>
        </div>
        {exchanges > 0 && <p className="vd-exchange-count">{exchanges} exchange{exchanges !== 1 ? 's' : ''}</p>}
      </div>
    </div>
  );
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
const VirtualDoctorChat = ({ 
  selectedLanguage, 
  initialContext, 
  clearInitialContext, 
  userId, 
  token,
  activeMessages,
  setActiveMessages,
  activeMode,
  setActiveMode,
  onNewChat
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase();
  const dateStr = currentTime.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short' });


  return (
    <div className="vd-page">
      {/* Tab Header */}
      <div className="vd-tab-header">
        <div className="vd-tab-brand">
          <Stethoscope size={22} />
          <span>Dr. Nexa — AI Medical Consultant</span>
        </div>
        <div className="vd-tab-switcher">
          <button className={`vd-tab-btn ${activeMode === 'chat' ? 'active' : ''}`} onClick={() => setActiveMode('chat')}>
            <MessageSquare size={16} /> Chat
          </button>
          <button className={`vd-tab-btn ${activeMode === 'voice' ? 'active' : ''}`} onClick={() => setActiveMode('voice')}>
            <Radio size={16} /> Voice
          </button>
          <div className="vd-separator" style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)', margin: '0 10px' }}></div>
          <button className="vd-tab-btn new-chat" onClick={onNewChat} style={{ color: '#10b981' }}>
            <Radio size={16} /> New Chat
          </button>
        </div>
        
        <div className="vd-header-clock">
          <span className="vd-clock-time">{timeStr}</span>
          <span className="vd-clock-date">{dateStr}</span>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeMode} className="vd-mode-content"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
          {activeMode === 'chat' ? (
            <ChatMode 
              initialContext={initialContext} 
              clearInitialContext={clearInitialContext} 
              userId={userId} 
              token={token}
              messages={activeMessages}
              setMessages={setActiveMessages}
            />
          ) : (
            <VoiceMode userId={userId} token={token} setMessages={setActiveMessages} />
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default VirtualDoctorChat;
