import React, { useState, useRef } from 'react';
import { 
  FileText, Upload, Scan, AlertCircle, 
  CheckCircle2, Loader, ChevronRight, Activity,
  Brain, ShieldCheck, Microscope, Download
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { smartScan } from '../utils/aiProviders';
import { useTranslation } from '../utils/translations';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import './ReportAI.css';

const ReportAI = ({ selectedLanguage, userId, token, userObj }) => {
  const t = useTranslation(selectedLanguage);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const fileInputRef = useRef(null);
  const reportRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Support both images and PDF
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setScanError("Please upload a medical report (Image or PDF).");
      return;
    }

    setUploadedFile(file);
    setIsScanning(true);
    setScanError(null);
    setScanResult(null);

    try {
      const base64 = await fileToBase64(file);
      const prompt = `You are a world-class clinical diagnostic assistant. Your task is to provide a highly detailed, informative, and accurate analysis of the attached medical report. 
      
      CRITICAL INSTRUCTIONS:
      - Perform deep OCR to extract every laboratory value, unit, and reference range.
      - Identify any abnormal values (High/Low) and highlight them.
      - Cross-reference findings to provide a cohesive health narrative.
      - Use professional medical terminology but explain it in simple terms for the patient.
      
      Structure your response using Markdown with these exact sections:
      # 🧬 NEXA HEALTH INTELLIGENCE REPORT
      
      ## 📋 Executive Summary
      (A high-level overview of the most important findings and the overall health status indicated by the report)
      
      ## 🔍 Reported Symptoms & Conditions
      (Extract all symptoms, existing conditions, or clinician observations mentioned)
      
      ## 🧪 Comprehensive Clinical Findings
      (A detailed table or list of all lab results. For each value, include: 
      - Parameter Name
      - Result Value & Unit
      - Reference Range (if present)
      - Interpretation (Normal/High/Low))
      
      ## 💊 Medications & Treatments
      (List every medication, dosage, frequency, and the likely reason for the prescription based on the report)
      
      ## 🏥 Clinical Interpretation & Red Flags
      (Explain what the findings mean collectively. Highlight any critical values (⚠️) that require URGENT medical attention)
      
      ## 💡 Recommended Next Steps
      (Actionable advice: lifestyle changes, follow-up tests, or specialist referrals. Include 3 specific questions the patient should ask their doctor)
      
      ## 📖 Medical Glossary
      (Explain any complex medical terms found in the report in simple language)
      
      Tone: Clinical, authoritative yet empathetic. If a section is absolutely not applicable, state "No relevant data detected in this document."`;
      
      const result = await smartScan(prompt, base64, file.type);
      setScanResult(result);
    } catch (error) {
      console.error("Report Scan Error:", error);
      const errorMsg = error.message.includes('Gemini API Error') 
        ? `${error.message}. Please verify your Gemini API key is valid.`
        : error.message.includes('Groq API Error')
          ? `${error.message}. Please verify your Groq API key is valid.`
          : "An unexpected error occurred during analysis. Please try again.";
      setScanError(errorMsg);
    } finally {
      setIsScanning(false);
    }
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = (error) => reject(error);
    });
  };
  
  const handleExportPDF = () => {
    window.print();
  };

  const resetScanner = () => {
    setUploadedFile(null);
    setScanResult(null);
    setScanError(null);
  };

  return (
    <div className="report-ai-container">
      <div className="report-ai-header no-print">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="page-title">Report Intelligence AI</h2>
          <p className="subtitle">Instant clinical analysis of your medical documents</p>
        </motion.div>
      </div>

      <div className="scanner-layout">
        {!scanResult && !isScanning ? (
          <motion.div 
            className="upload-zone-wrapper no-print"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div 
              className="upload-zone premium-card"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="upload-content">
                <div className="upload-icon-circle">
                  <Upload size={40} />
                </div>
                <h3>Drop your medical report here</h3>
                <p>or click to browse (PDF or Image)</p>
                <div className="upload-specs">
                  <span><ShieldCheck size={14} /> Encrypted</span>
                  <span><FileText size={14} /> PDF / Image</span>
                </div>
              </div>
              <input 
              type="file" 
              ref={fileInputRef} 
              hidden 
              onChange={handleFileUpload}
              accept="image/*,.pdf"
            />
            </div>
            
            <div className="scanner-features-grid">
              <div className="feature-mini-card">
                <Brain size={20} />
                <h4>AI Analysis</h4>
                <p>Gemini Pro powered processing</p>
              </div>
              <div className="feature-mini-card">
                <Activity size={20} />
                <h4>Symptom Tracker</h4>
                <p>Automated symptom extraction</p>
              </div>
              <div className="feature-mini-card">
                <Microscope size={20} />
                <h4>Clinical Insights</h4>
                <p>Lab result interpretation</p>
              </div>
            </div>
          </motion.div>
        ) : isScanning ? (
          <div className="scanning-state-wrapper">
            <div className="scanner-animation-large">
              <div className="scan-line-active"></div>
              <FileText size={100} className="floating-file" />
              <div className="pulse-rings-large">
                <div className="ring"></div>
                <div className="ring"></div>
              </div>
            </div>
            <h3>Analyzing {uploadedFile?.name}...</h3>
            <p>Dr. Nexa is synthesizing your medical data for accuracy.</p>
          </div>
        ) : (
          <motion.div 
            className="result-wrapper"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="result-controls no-print">
              <button className="back-btn" onClick={resetScanner}>
                <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} />
                Scan Another Report
              </button>
              <button 
                className="export-btn" 
                onClick={handleExportPDF}
              >
                <Download size={18} />
                Export PDF
              </button>
            </div>
            
            <div className="report-intelligence-paper premium-card" ref={reportRef}>
              <div className="report-brand-header">
                <div className="brand">
                  <div className="logo-icon"><Activity size={24} /></div>
                  <div>
                    <h4>NEXA HEALTH</h4>
                    <span>REPORT INTELLIGENCE AI</span>
                  </div>
                </div>
                <div className="meta">
                  <span>DATE: {new Date().toLocaleDateString()}</span>
                  <span>ID: {userId?.slice(-8).toUpperCase()}</span>
                </div>
              </div>
              
              <div className="intelligence-content markdown-report">
                <ReactMarkdown>{scanResult}</ReactMarkdown>
              </div>
              
              <div className="report-footer">
                <div className="warning-pill">
                  <AlertCircle size={16} />
                  <span>This is an AI analysis. Present this to a doctor for formal diagnosis.</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
      
      {scanError && (
        <motion.div 
          className="scan-error-container no-print"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="error-card premium-card">
            <AlertCircle size={40} className="error-icon" />
            <h3>Analysis Failed</h3>
            <p>{scanError}</p>
            <button className="retry-btn" onClick={resetScanner}>
              Try Again
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ReportAI;
