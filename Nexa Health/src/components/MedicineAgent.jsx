import React, { useState, useRef } from 'react';
import { 
  Pill, Camera, Search, AlertTriangle, CheckCircle2, 
  Loader, X, Scan, ChevronRight, Shield, Clock,
  BookOpen, Zap, Package, ThumbsUp, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { callGroq, callGroqVision } from '../utils/aiProviders';
import { useTranslation } from '../utils/translations';
import './MedicineAgent.css';

const MEDICINE_PROMPT = `You are a clinical pharmacist AI. Analyze the given medicine and respond in this exact structured markdown format:

## 🔬 Generic Name & Classification
State the generic name and drug class (e.g., Antibiotic – Penicillin group).

## 💊 What It Treats
List the primary uses and indications clearly.

## 📏 Dosage Guide
| Group | Dose | Frequency |
|-------|------|-----------|
| Adults | ... | ... |
| Children | ... | ... |
| Max daily | ... | — |

## ⚠️ Side Effects
**Common:** list 3–4 common ones
**Serious (seek help):** list 2–3 warning signs

## 🚫 Who Should NOT Take This
List contraindications and drug interactions clearly.

## 🌡️ Storage Instructions
How to store this medicine properly.

Be concise, accurate, and use plain clinical language.`;

const IMAGE_PROMPT = `You are a clinical pharmacist AI. Analyze this medicine image (prescription, packaging, or tablet). 
Identify the medicine and provide:
1. Medicine name and generic equivalent
2. What it is used for
3. Standard dosage and instructions visible or typical
4. Important warnings from the label
5. Storage requirements

Format clearly with headers. If unclear, state what you can identify.`;

const QUICK_SEARCHES = [
  { name: 'Paracetamol', icon: '🌡️' },
  { name: 'Amoxicillin', icon: '🦠' },
  { name: 'Metformin', icon: '💉' },
  { name: 'Omeprazole', icon: '🫀' },
  { name: 'Ibuprofen', icon: '💊' },
  { name: 'Atorvastatin', icon: '❤️' },
];

const MedicineAgent = ({ selectedLanguage }) => {
  const t = useTranslation(selectedLanguage);
  const [medicineName, setMedicineName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [currentMedicine, setCurrentMedicine] = useState('');
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [inputMode, setInputMode] = useState('text'); // 'text' | 'image'
  const fileRef = useRef();

  const handleAnalyze = async (nameOverride) => {
    const name = nameOverride || medicineName;
    if (!name && !selectedImage) return;

    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    setCurrentMedicine(name || 'Scanned Medication');

    try {
      let response;
      if (selectedImage && imageBase64) {
        response = await callGroqVision(IMAGE_PROMPT, imageBase64, 'image/jpeg');
      } else {
        response = await callGroq(
          MEDICINE_PROMPT,
          `Analyze this medicine: "${name}". Provide comprehensive clinical information.`
        );
      }
      setResult(response);
    } catch (err) {
      setError(err.message?.includes('MISSING') 
        ? 'API key not configured. Please add VITE_GROQ_API_KEY to your .env file.'
        : 'Analysis failed. Please check your connection and try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMedicineName('');
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result);
      // Strip the data:image/...;base64, prefix
      setImageBase64(reader.result.split(',')[1]);
    };
    reader.readAsDataURL(file);
    setInputMode('image');
  };

  const handleReset = () => {
    setResult(null);
    setMedicineName('');
    setSelectedImage(null);
    setImageBase64(null);
    setError(null);
    setCurrentMedicine('');
    setInputMode('text');
  };

  return (
    <div className="ma-page">
      {/* ── Header ── */}
      <motion.div className="ma-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="ma-header-left">
          <div className="ma-icon-badge">
            <Pill size={26} />
          </div>
          <div>
            <h1 className="ma-title">{t.medIntelTitle}</h1>
            <p className="ma-subtitle">{t.medIntelSub}</p>
          </div>
        </div>
        {result && (
          <motion.button 
            className="ma-reset-btn" 
            onClick={handleReset}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
          >
            <RefreshCw size={16} /> {t.newSearch}
          </motion.button>
        )}
      </motion.div>

      <div className={`ma-layout ${result ? 'has-result' : ''}`}>

        {/* ── Input Panel ── */}
        <motion.aside
          className="ma-input-panel"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Mode tabs */}
          <div className="ma-mode-tabs">
            <button 
              className={`ma-mode-tab ${inputMode === 'text' ? 'active' : ''}`}
              onClick={() => setInputMode('text')}
            >
              <Search size={15} /> {t.searchByName}
            </button>
            <button 
              className={`ma-mode-tab ${inputMode === 'image' ? 'active' : ''}`}
              onClick={() => { setInputMode('image'); fileRef.current?.click(); }}
            >
              <Camera size={15} /> {t.scanImage}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {inputMode === 'text' ? (
              <motion.div key="text" className="ma-text-mode" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="ma-search-wrap">
                  <Search size={18} className="ma-search-icon" />
                  <input
                    type="text"
                    className="ma-search-input"
                    placeholder="e.g. Amoxicillin, Ibuprofen..."
                    value={medicineName}
                    onChange={e => setMedicineName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
                  />
                  {medicineName && (
                    <button className="ma-clear-btn" onClick={() => setMedicineName('')}><X size={15} /></button>
                  )}
                </div>

                {/* Quick Searches */}
                <div className="ma-quick-section">
                  <p className="ma-quick-label">{t.commonMeds}</p>
                  <div className="ma-quick-grid">
                    {QUICK_SEARCHES.map(q => (
                      <motion.button
                        key={q.name}
                        className="ma-quick-chip"
                        onClick={() => { setMedicineName(q.name); handleAnalyze(q.name); }}
                        whileHover={{ scale: 1.04, y: -2 }}
                        whileTap={{ scale: 0.96 }}
                      >
                        <span>{q.icon}</span> {q.name}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="image" className="ma-image-mode" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {selectedImage ? (
                  <div className="ma-img-preview">
                    <img src={selectedImage} alt="Medicine scan" />
                    <div className="ma-img-overlay">
                      <button className="ma-img-remove" onClick={() => { setSelectedImage(null); setImageBase64(null); }}>
                        <X size={16} /> Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="ma-dropzone" onClick={() => fileRef.current?.click()}>
                    <Camera size={36} />
                    <span>Upload prescription or packaging</span>
                    <p>JPEG, PNG, WebP accepted</p>
                  </label>
                )}
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleImageUpload} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Analyze button */}
          <motion.button
            className="ma-analyze-btn"
            onClick={() => handleAnalyze()}
            disabled={isAnalyzing || (!medicineName && !selectedImage)}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.97 }}
          >
            {isAnalyzing ? (
              <><Loader className="ma-spin" size={20} /> {t.analyzing}</>
            ) : (
              <><Scan size={20} /> {t.analyzeMed}</>
            )}
          </motion.button>

          {/* Disclaimer */}
          <div className="ma-disclaimer">
            <Shield size={16} />
            <p>{t.disclaimer}</p>
          </div>
        </motion.aside>

        {/* ── Results Panel ── */}
        <main className="ma-result-panel">
          <AnimatePresence mode="wait">
            {isAnalyzing ? (
              <motion.div
                key="loading"
                className="ma-state-card loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="ma-scanner">
                  <div className="ma-scanner-line" />
                  <div className="ma-scanner-grid" />
                </div>
                <Loader className="ma-big-spin" size={52} />
                <h3>Synthesizing Clinical Data</h3>
                <p>Consulting pharmacological databases…</p>
                <div className="ma-loading-steps">
                  <div className="ma-step active"><CheckCircle2 size={14} />Identifying compound</div>
                  <div className="ma-step active"><CheckCircle2 size={14} />Fetching drug class</div>
                  <div className="ma-step pulse"><Loader className="ma-spin-sm" size={14} />Analyzing interactions</div>
                </div>
              </motion.div>

            ) : error ? (
              <motion.div
                key="error"
                className="ma-state-card error"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <AlertTriangle size={56} />
                <h3>Analysis Failed</h3>
                <p>{error}</p>
                <button className="ma-retry-btn" onClick={() => handleAnalyze()}>
                  <RefreshCw size={16} /> Try Again
                </button>
              </motion.div>

            ) : result ? (
              <motion.div
                key="result"
                className="ma-result-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="ma-result-header">
                  <div className="ma-result-badge">
                    <CheckCircle2 size={14} /> Analysis Complete
                  </div>
                  <h2 className="ma-result-name">{currentMedicine}</h2>
                  <div className="ma-result-meta">
                    <span><Clock size={12} /> {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span><BookOpen size={12} /> Clinical AI Report</span>
                  </div>
                </div>

                <div className="ma-result-body">
                  <ReactMarkdown
                    components={{
                      h2: ({ children }) => <h2 className="ma-md-h2">{children}</h2>,
                      p: ({ children }) => <p className="ma-md-p">{children}</p>,
                      table: ({ children }) => <div className="ma-table-wrap"><table className="ma-md-table">{children}</table></div>,
                      th: ({ children }) => <th className="ma-md-th">{children}</th>,
                      td: ({ children }) => <td className="ma-md-td">{children}</td>,
                      strong: ({ children }) => <strong className="ma-md-strong">{children}</strong>,
                      li: ({ children }) => <li className="ma-md-li">{children}</li>,
                      ul: ({ children }) => <ul className="ma-md-ul">{children}</ul>,
                    }}
                  >
                    {result}
                  </ReactMarkdown>
                </div>

                <div className="ma-result-footer">
                  <Shield size={14} /> Powered by Nexa Clinical AI · For educational use only
                </div>
              </motion.div>

            ) : (
              <motion.div
                key="empty"
                className="ma-state-card empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div
                  className="ma-empty-icon"
                  animate={{ y: [0, -12, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                >
                  <Pill size={64} />
                </motion.div>
                <h3>Ready to Scan</h3>
                <p>Search a medicine name or upload a photo to get instant clinical intelligence.</p>
                <div className="ma-feature-chips">
                  <span><Zap size={13} /> Instant Analysis</span>
                  <span><Package size={13} /> Drug Class & Dosage</span>
                  <span><ThumbsUp size={13} /> Safe Interaction Check</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default MedicineAgent;
