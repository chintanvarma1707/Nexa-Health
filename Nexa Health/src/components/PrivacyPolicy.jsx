import React, { useState } from 'react';
import './PrivacyPolicy.css';
import { motion } from 'framer-motion';
import { Shield, ChevronDown, ChevronUp, Lock, Eye, Database, Globe, Mail } from 'lucide-react';

const sections = [
  { icon: Database, title: 'Information We Collect', content: 'Nexa Health collects information you provide directly, including your name, email address, and health-related queries you submit to our AI assistant. We also collect usage data such as feature interactions and session duration to improve the service. We do NOT store your chat conversations on our servers beyond the session.' },
  { icon: Eye, title: 'How We Use Your Data', content: 'Your information is used solely to provide and improve Nexa Health services. Specifically: (1) To personalize your health dashboard. (2) To process queries through our AI providers (Google Gemini and Groq). (3) To authenticate your identity via Clerk.dev. We do not sell, rent, or share your personal data with third-party advertisers.' },
  { icon: Lock, title: 'Data Security', content: 'All data transmitted is encrypted using industry-standard TLS 1.3. Authentication is handled by Clerk.dev, a SOC 2 Type II certified identity provider. Your API keys are saved only in your browser localStorage and are never transmitted to our servers.' },
  { icon: Globe, title: 'Third-Party Services', content: 'Nexa Health integrates with: Google Gemini API (AI responses), Groq API (AI responses), Clerk.dev (authentication), OpenStreetMap & Leaflet (mapping), ESRI (satellite imagery). Each of these services has its own privacy policy. We select partners who maintain high standards of data protection.' },
  { icon: Shield, title: 'Your Rights', content: 'You have the right to access, correct, or delete your personal data at any time. You can manage your account information in Settings > Profile. To request complete data deletion, contact us at privacy@nexahealth.app. Requests are processed within 30 business days.' },
  { icon: Mail, title: 'Contact & Updates', content: 'For privacy-related inquiries, contact our Data Protection Officer at privacy@nexahealth.app. This policy was last updated on April 22, 2026. Material changes will be communicated via email or in-app notification.' },
];

const PrivacyPolicy = () => {
  const [openSection, setOpenSection] = useState(0);
  return (
    <div className="privacy-page-wrapper">
    <div className="privacy-container">
      <motion.div className="privacy-hero" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="privacy-hero-icon"><Shield size={48} /></div>
        <h1>Privacy Policy</h1>
        <p>Your privacy is fundamental to Nexa Health. Last updated: <strong>April 22, 2026</strong></p>
      </motion.div>

      <div className="privacy-intro">
        <p>At <strong>Nexa Health</strong>, we are committed to protecting your personal information and your right to privacy.</p>
      </div>

      <div className="privacy-sections">
        {sections.map((section, idx) => (
          <motion.div key={idx} className={`privacy-accordion ${openSection === idx ? 'open' : ''}`} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.07 }}>
            <button className="privacy-accordion-header" onClick={() => setOpenSection(openSection === idx ? -1 : idx)}>
              <span className="privacy-acc-icon"><section.icon size={20} /></span>
              <span className="privacy-acc-title">{section.title}</span>
              {openSection === idx ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {openSection === idx && (
              <motion.div className="privacy-accordion-body" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                <p>{section.content}</p>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="privacy-footer">
        <Shield size={15} />
        <span>By using Nexa Health, you agree to the terms of this Privacy Policy.</span>
      </div>
    </div>
    </div>
  );
};

export default PrivacyPolicy;
