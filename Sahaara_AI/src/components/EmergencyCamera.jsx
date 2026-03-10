import React, { useRef, useState, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-backend-webgl';
import { Camera, Upload, AlertTriangle, ShieldCheck, X, Activity, Scan, Loader2, Image as ImageIcon, CheckCircle, RefreshCw } from 'lucide-react';
import { getTranslation } from '../utils/translations';
import { GoogleGenerativeAI } from '@google/generative-ai';
import ReactMarkdown from 'react-markdown';
import './EmergencyCamera.css';

const VisualScanner = ({ selectedLanguage, onCancel, setTab, globalApiKey, onApiKeyChange }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [detector, setDetector] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [mode, setMode] = useState(null); // 'camera', 'upload'
  const [previewImage, setPreviewImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [errorStatus, setErrorStatus] = useState(null);
  const [emergencyAlert, setEmergencyAlert] = useState(null);
  const requestRef = useRef();

  const handleApiKeyChange = (e) => {
    onApiKeyChange(e.target.value);
  };

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
    if (!globalApiKey) {
      setErrorStatus("API Key is required for scanning.");
      return;
    }
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
    if (!globalApiKey) {
      setErrorStatus("API Key is required for analysis.");
      return;
    }
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
    if (!globalApiKey) {
      setErrorStatus("API Key MISSING. Please enter your Gemini API Key in the 'AI Triage/Chat' tab first.");
      return;
    }
    setIsAnalyzing(true);
    setErrorStatus(null);
    setScanResult(null);

    try {
      // Step 1: Resize image to max 1024px as previously implemented for performance
      const resizedBase64 = await resizeImage(originalBase64, 1024);

      // Step 2: Call stable /v1/ REST API with exact structure requested
      // GLOBAL MEDICAL DATABASE VIA STABLE v1 REST API
      const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || globalApiKey;
      const modelName = "gemini-2.5-flash";
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`;

      // User requested exact prompt
      const prompt = `Analyze this image and describe any visible skin condition, injury, rash, acne, burn, or infection. Provide simple health guidance. Respond in ${selectedLanguage}.`;

      const requestBody = {
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: resizedBase64
                }
              }
            ]
          }
        ]
      };

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        // Log detailed error for debugging as requested
        const errorData = await response.json().catch(() => ({ error: "Could not parse error response" }));
        console.error("Gemini API Error details:", errorData);
        throw new Error(`Gemini API returned ${response.status}: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error("Empty response from AI");
      }

      // Step 3: Handle response display
      // If it looks like JSON, try to parse it (for structured UI), otherwise show as raw text
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsedData = JSON.parse(jsonMatch[0]);
          setScanResult(parsedData);
          if (parsedData.emergency) {
            setEmergencyAlert(getTranslation(selectedLanguage, 'possible_emergency_detected'));
          }
        } catch (e) {
          setScanResult({ rawText: text });
        }
      } else {
        setScanResult({ rawText: text });
      }
    } catch (err) {
      console.error("Final Analysis Error:", err);
      setErrorStatus("Unable to analyze image right now. Please try again.");
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
          setEmergencyAlert(getTranslation(selectedLanguage, 'unconscious_detected'));
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
          <h2><ImageIcon className="icon" /> {getTranslation(selectedLanguage, 'camera_emergency')}</h2>
          <p>{getTranslation(selectedLanguage, 'camera_emergency_desc')}</p>
        </div>
        <button className="close-btn" onClick={onCancel}><X /></button>
      </div>

      {!mode ? (
        <div className="scanner-setup-container">
          {!globalApiKey && (
            <div className="api-setup-card card">
              <div className="api-icon-bg"><Key size={32} /></div>
              <h3>API Key Required</h3>
              <p>To analyze medical images, please enter your Google Gemini API Key.</p>
              <div className="api-input-group">
                <input
                  type="password"
                  placeholder="Paste your API key here..."
                  value={globalApiKey}
                  onChange={handleApiKeyChange}
                />
              </div>
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="get-key-link">
                Don't have a key? Get one for free here
              </a>
            </div>
          )}

          <div className={`scanner-mode-picker ${!globalApiKey ? 'disabled' : ''}`}>
            <div className="mode-card" onClick={startCamera}>
              <div className="mode-icon"><Camera size={48} /></div>
              <h3>{getTranslation(selectedLanguage, 'scan_using_camera')}</h3>
              <p>Use live feed for real-time body scan</p>
            </div>
            <div className="mode-card" onClick={() => fileInputRef.current.click()}>
              <div className="mode-icon"><Upload size={48} /></div>
              <h3>{getTranslation(selectedLanguage, 'upload_photo_analysis')}</h3>
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
                  <div className="analyzing-text">{getTranslation(selectedLanguage, 'analyzing_image')}</div>
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
                <ShieldCheck size={14} /> {getTranslation(selectedLanguage, 'scanner_safety_disclaimer')}
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
                  <p>Sahaara AI is processing medical patterns...</p>
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
                        <label>{getTranslation(selectedLanguage, 'possible_condition')}</label>
                        <div className="condition-name">{scanResult.condition}</div>
                      </div>

                      <div className="result-field">
                        <label>{getTranslation(selectedLanguage, 'explanation')}</label>
                        <p>{scanResult.explanation}</p>
                      </div>

                      <div className="result-field">
                        <label>{getTranslation(selectedLanguage, 'suggested_care')}</label>
                        <ul className="care-list">
                          {(scanResult.care || []).map((step, i) => (
                            <li key={i}><CheckCircle size={14} /> {step}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="result-field">
                        <label>{getTranslation(selectedLanguage, 'doctor_advice')}</label>
                        <p className="advice-text">{scanResult.advice}</p>
                      </div>
                    </>
                  )}

                  <button className="follow-up-btn" onClick={() => setTab('doctor')}>
                    Ask Virtual Doctor for Follow-up
                  </button>
                </div>
              ) : errorStatus ? (
                <div className="error-view">
                  <AlertTriangle className="error-icon" size={48} />
                  <p className="error-msg">{errorStatus}</p>
                  <button className="retry-btn" onClick={() => { if (mode === 'camera') startCamera(); else fileInputRef.current.click(); }}>Try Again</button>
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
