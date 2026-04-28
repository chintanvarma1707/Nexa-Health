import React, { useRef, useState, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-backend-webgl';
import { Camera, Upload, AlertTriangle, ShieldCheck, X, Activity, Scan, Loader2, Image as ImageIcon, CheckCircle, RefreshCw, Key } from 'lucide-react';
import { useTranslation } from '../utils/translations';
import { callGroqVision } from '../utils/aiProviders';
import ReactMarkdown from 'react-markdown';
import './EmergencyCamera.css';

const VisualScanner = ({ selectedLanguage, onCancel, setTab, reportState, setReportState, setDoctorInitialContext }) => {
  const t = useTranslation(selectedLanguage);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [detector, setDetector] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [emergencyAlert, setEmergencyAlert] = useState(null);

  // Destructure persistent state
  const { mode = null, previewImage = null, scanResult = null, errorStatus = null } = reportState || {};

  // Helpers to update persistent state
  const setMode = (val) => setReportState(prev => ({ ...prev, mode: val }));
  const setPreviewImage = (val) => setReportState(prev => ({ ...prev, previewImage: val }));
  const setScanResult = (val) => setReportState(prev => ({ ...prev, scanResult: val }));
  const setErrorStatus = (val) => setReportState(prev => ({ ...prev, errorStatus: val }));
  const requestRef = useRef();



  useEffect(() => {
    const loadModel = async () => {
      try {
        await tf.setBackend('webgl');
        await tf.ready();
        const model = poseDetection.SupportedModels.MoveNet;
        const detectorInstance = await poseDetection.createDetector(model);
        setDetector(detectorInstance);
      } catch (err) {
        console.error("Pose model load error", err);
      }
    };
    loadModel();
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      stopCamera();
    };
  }, []);

  const startCamera = async () => {

    setMode('camera');
    setScanResult(null);
    setEmergencyAlert(null);
    setErrorStatus(null);
    setIsCameraActive(false);

    try {
      const constraints = {
        video: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          facingMode: 'environment'
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().then(() => {
            setIsCameraActive(true);
            detectFrame();
          }).catch(e => {
            console.error("Video Play Error:", e);
            setErrorStatus("Auto-play stopped by browser. Please click Capture.");
          });
        };
      }
    } catch (err) {
      console.error("Camera Device Error:", err);
      setErrorStatus("Camera not found or permission denied. Please check your browser settings or try Uploading a Photo.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const handleFileUpload = (e) => {

    const file = e.target.files[0];
    if (file) {
      setMode('upload');
      setScanResult(null);
      setPreviewImage(null);
      setEmergencyAlert(null);
      setErrorStatus(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
        const base64 = reader.result.split(',')[1];
        analyzeVisualContent(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const captureAndAnalyze = () => {
    if (!videoRef.current || !isCameraActive) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0);
      const dataURL = canvas.toDataURL('image/jpeg', 0.9);
      const base64 = dataURL.split(',')[1];

      setPreviewImage(dataURL);
      stopCamera();
      analyzeVisualContent(base64);
    } catch (err) {
      console.error("Capture Error:", err);
      setErrorStatus("Failed to capture image. Please try again.");
    }
  };

  const resizeImage = (base64Str, maxSize = 1024) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = "data:image/jpeg;base64," + base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxSize) {
            height *= maxSize / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width *= maxSize / height;
            height = maxSize;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8).split(',')[1]);
      };
    });
  };

  const analyzeVisualContent = async (originalBase64) => {

    setIsAnalyzing(true);
    setErrorStatus(null);
    setScanResult(null);

    try {
      // Step 1: Resize image to max 1024px for performance
      const resizedBase64 = await resizeImage(originalBase64, 1024);

      // Step 2: Call Gemini Vision API via centralized helper
      const prompt = `You are Nexa Health's highly advanced Virtual Doctor.
Analyze the provided image. It may be a medical laboratory report, a prescription, or a physical symptom (like a rash or injury).

Adopt the persona of an empathetic, authoritative, and professional doctor consulting a patient.
Speak directly to the user (e.g., "I have reviewed your report", "I can see that...").

You MUST return your response ENTIRELY as a valid JSON object matching this exact structure, with NO markdown formatting outside the JSON:
{
  "condition": "A short, clear title of what you observe (e.g., 'Normal CBC Report', 'Minor Skin Abrasion')",
  "explanation": "A thorough, doctor-like explanation of what you see in the image. If it's a lab report, explain the key metrics and what they mean for their health.",
  "care": [
    "Step-by-step actionable guidance or lifestyle recommendations",
    "Clear, easy to understand point"
  ],
  "advice": "Your final professional advice and recommended next steps as a doctor.",
  "emergency": false
}

Respond in ${selectedLanguage}. IMPORTANT: ONLY output the raw JSON object. Do not wrap in \`\`\`json or add conversational text.`;

      const text = await callGroqVision(prompt, resizedBase64, 'image/jpeg');

      // Step 3: Handle response display
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsedData = JSON.parse(jsonMatch[0]);
          setScanResult(parsedData);
          if (parsedData.emergency) {
            setEmergencyAlert(t.possible_emergency_detected);
          }
        } catch (e) {
          setScanResult({ rawText: text });
        }
      } else {
        setScanResult({ rawText: text });
      }
    } catch (err) {
      console.error("Final Analysis Error:", err);
      setErrorStatus(`API Error: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const detectFrame = async () => {
    if (!detector || !videoRef.current || videoRef.current.readyState < 2) {
      requestRef.current = requestAnimationFrame(detectFrame);
      return;
    }
    try {
      const poses = await detector.estimatePoses(videoRef.current);
      if (poses && poses.length > 0) {
        const nose = poses[0].keypoints.find(k => k.name === 'nose');
        if (nose?.score > 0.4 && nose.y > 420) {
          setEmergencyAlert(t.unconscious_detected);
        }
      }
    } catch (e) {
      // Silent catch for pose errors
    }
    requestRef.current = requestAnimationFrame(detectFrame);
  };

  return (
    <div className="camera-help-container">
      <div className="camera-help-header">
        <div className="title-section">
          <h2><Scan className="icon" /> AI Report Agent</h2>
          <p>Scan symptoms using your camera or upload a photo for AI analysis.</p>
        </div>
      </div>

      {!mode ? (
        <div className="scanner-setup-container">


          <div className={`scanner-mode-picker`}>
            <div className="mode-card" onClick={startCamera}>
              <div className="mode-icon"><Camera size={48} /></div>
              <h3>{t.scan_using_camera}</h3>
              <p>Use live feed for real-time body scan</p>
            </div>
            <div className="mode-card" onClick={() => fileInputRef.current.click()}>
              <div className="mode-icon"><Upload size={48} /></div>
              <h3>{t.upload_photo_analysis}</h3>
              <p>Choose an existing photo from gallery</p>
              <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileUpload} />
            </div>
          </div>
        </div>
      ) : (
        <div className="camera-main-layout">
          <div className="video-card card">
            <div className="video-wrapper">
              {mode === 'camera' && !previewImage ? (
                <>
                  <video ref={videoRef} autoPlay playsInline muted className="live-video" />
                  <div className="camera-controls">
                    <button className="capture-btn" onClick={captureAndAnalyze}>
                      <div className="inner-circle"></div>
                    </button>
                  </div>
                </>
              ) : (
                <img src={previewImage} className="preview-img" alt="Preview" />
              )}

              {isAnalyzing && (
                <div className="scanning-overlay">
                  <div className="scan-line-v2"></div>
                  <div className="analyzing-text">{t.analyzing_image}</div>
                </div>
              )}

              {emergencyAlert && (
                <div className="emergency-alert-banner pulse">
                  <AlertTriangle size={24} /> {emergencyAlert}
                </div>
              )}
            </div>

            <div className="scanner-footer">
              <button className="reset-btn" onClick={() => { stopCamera(); setMode(null); setScanResult(null); setPreviewImage(null); setEmergencyAlert(null); setErrorStatus(null); }}>
                <RefreshCw size={18} /> Rescan / Back
              </button>
              <div className="safety-badge">
                <ShieldCheck size={14} /> {t.scanner_safety_disclaimer}
              </div>
            </div>
          </div>

          <div className="instructions-card card">
            <div className="inst-header">
              <h3><Activity size={20} /> Analysis Result</h3>
              {scanResult && <span className="completed-badge">SCAN COMPLETE</span>}
            </div>

            <div className="result-container">
              {isAnalyzing ? (
                <div className="analyzing-placeholder">
                  <Loader2 className="spin" size={48} />
                  <p>{t.processingPatterns}</p>
                </div>
              ) : scanResult ? (
                <div className="scan-data">
                  {scanResult.rawText ? (
                    <div className="result-field">
                      <label>AI Analysis & Description</label>
                      <div className="raw-description">
                        <ReactMarkdown>{scanResult.rawText}</ReactMarkdown>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="result-field">
                        <label>{t.possible_condition}</label>
                        <div className="condition-name">{scanResult.condition}</div>
                      </div>

                      <div className="result-field">
                        <label>{t.explanation}</label>
                        <p>{scanResult.explanation}</p>
                      </div>

                      <div className="result-field">
                        <label>{t.suggested_care}</label>
                        <ul className="care-list">
                          {(scanResult.care || []).map((step, i) => (
                            <li key={i}><CheckCircle size={14} /> {step}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="result-field">
                        <label>{t.doctor_advice}</label>
                        <p className="advice-text">{scanResult.advice}</p>
                      </div>
                    </>
                  )}

                  <button className="follow-up-btn" onClick={() => {
                    const promptText = scanResult?.rawText 
                      ? `I just scanned a medical document/symptom. The AI identified the following: \n\n${scanResult.rawText}\n\nCan you explain this further and provide detailed advice?`
                      : `I just scanned a medical document/symptom. The AI identified it as "${scanResult?.condition}".\n\nExplanation given: ${scanResult?.explanation}\n\nSuggested care: ${(scanResult?.care || []).join(', ')}\n\nCan you explain this further in detail?`;
                    
                    setDoctorInitialContext(promptText);
                    setTab('doctor');
                  }}>
                    Ask Virtual Doctor for Follow-up
                  </button>
                </div>
              ) : errorStatus ? (
                <div className="error-view">
                  <AlertTriangle className="error-icon" size={48} />
                  <p className="error-msg">{errorStatus}</p>
                  <button className="retry-btn" onClick={() => { 
                    if (mode === 'camera') {
                      startCamera(); 
                    } else {
                      setMode(null);
                      setPreviewImage(null);
                      setErrorStatus(null);
                    }
                  }}>Try Again</button>
                </div>
              ) : (
                <div className="empty-results">
                  <p>Capture or upload an image to receive AI-powered health guidance.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisualScanner;
