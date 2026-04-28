import React from 'react';
import './Dashboard.css';
import { motion } from 'framer-motion';
import { AlertCircle, Pill, HeartPulse, Stethoscope, FileText, History, Scan } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';
import { useTranslation } from '../utils/translations';

const Dashboard = ({ setTab, selectedLanguage }) => {
  const { user } = useUser();
  const t = useTranslation(selectedLanguage);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t.greetingMorning || 'Good Morning';
    if (hour < 18) return t.greetingAfternoon || 'Good Afternoon';
    return t.greetingEvening || 'Good Evening';
  };

  const actions = [
    { 
      id: 'doctor', 
      title: t.virtualDoctor, 
      desc: t.descDoctor, 
      icon: Stethoscope, 
      color: 'primary',
      size: 'large'
    },
    { 
      id: 'report-ai', 
      title: t.reportAi, 
      desc: t.descReportAi, 
      icon: Scan, 
      color: 'secondary',
      size: 'medium'
    },
    { 
      id: 'medicine', 
      title: t.medicineAgent, 
      desc: t.descMedicine, 
      icon: Pill, 
      color: 'tertiary' 
    },
    { 
      id: 'nearby', 
      title: t.nearbyHelp, 
      desc: t.descNearby, 
      icon: HeartPulse, 
      color: 'tertiary' 
    },
    { 
      id: 'guide', 
      title: t.emergencyGuide || 'Emergency Guide', 
      desc: t.descGuide, 
      icon: AlertCircle, 
      color: 'emergency' 
    },
    { 
      id: 'report', 
      title: t.healthReport, 
      desc: t.descReport, 
      icon: FileText, 
      color: 'secondary' 
    },
    { 
      id: 'history', 
      title: t.history || 'Consultation History', 
      desc: t.descHistory, 
      icon: History, 
      color: 'tertiary' 
    }
  ];


  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="dashboard-container">
      <motion.div 
        className="dashboard-header"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1>{getGreeting()}, {user?.firstName || 'User'}</h1>
        <p className="welcome-message">{t.welcomeSub}</p>
      </motion.div>

      <motion.div 
        className="bento-grid"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {actions.map((action) => (
          <motion.div 
            key={action.id}
            className={`premium-card action-card ${action.color} ${action.id}-area ${action.size || 'small'}`}
            variants={itemVariants}
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setTab(action.id)}
          >
            <div className="card-glass-glow" />
            <div className="action-content">
              <div className="action-icon-wrap">
                <div className="action-icon">
                  <action.icon size={action.id === 'doctor' ? 32 : 24} />
                </div>
                {action.id === 'doctor' && (
                  <div className="card-pulse-decoration">
                    {[1, 2, 3].map(i => <div key={i} className="pulse-ring" style={{ animationDelay: `${i * 0.5}s` }} />)}
                  </div>
                )}
              </div>
              <div className="action-text">
                <h3>{action.title}</h3>
                <p>{action.desc}</p>
              </div>
            </div>
            {action.id === 'doctor' && (
              <div className="doctor-status-badge">
                <div className="status-dot" />
                <span>{t.activeVirtualDr}</span>
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>

      <motion.div 
        className="stats-grid"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <div className="premium-card stat-card">
          <span className="stat-value">98</span>
          <span className="stat-label">Health Score</span>
        </div>
        <div className="premium-card stat-card">
          <span className="stat-value">0</span>
          <span className="stat-label">Alerts</span>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
