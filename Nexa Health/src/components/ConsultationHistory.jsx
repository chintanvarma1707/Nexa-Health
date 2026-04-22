import React, { useState, useEffect } from 'react';
import { 
  History, Clock, MessageSquare, Mic, Trash2, 
  Search, ChevronRight, FileText, Loader, AlertCircle
} from 'lucide-react';
import { getConversationHistory, deleteConversation } from '../utils/userDb';
import { motion, AnimatePresence } from 'framer-motion';
import './ConsultationHistory.css';

const ConsultationHistory = ({ userId, token, onSelect }) => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const data = await getConversationHistory(userId, token);
      setHistory(data);
      setIsLoading(false);
    };
    if (userId) loadData();
  }, [userId, token]);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm("Permanently delete this consultation?")) {
      await deleteConversation(userId, id, token);
      setHistory(prev => prev.filter(h => h.id !== id));
    }
  };

  const filteredHistory = history.filter(conv => 
    conv.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group by relative time
  const groupHistory = (items) => {
    const groups = {
      Today: [],
      Yesterday: [],
      'Earlier this month': [],
      Older: []
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    items.forEach(item => {
      const date = new Date(item.timestamp);
      if (date >= today) groups.Today.push(item);
      else if (date >= yesterday) groups.Yesterday.push(item);
      else if (date > new Date(now.getFullYear(), now.getMonth() - 1, 1)) groups['Earlier this month'].push(item);
      else groups.Older.push(item);
    });

    return groups;
  };

  const grouped = groupHistory(filteredHistory);

  return (
    <div className="history-page">
      <div className="history-header">
        <div className="header-text">
          <h1>Consultation History</h1>
          <p>Review and manage your past AI medical consultations.</p>
        </div>
        <div className="search-bar">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search symptoms or topics..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="history-content">
        {isLoading ? (
          <div className="history-loading">
            <Loader className="spin" size={40} />
            <p>Retrieving your medical records...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="history-empty">
            <div className="empty-icon-box">
              <History size={60} />
            </div>
            <h3>No Records Yet</h3>
            <p>Your AI consultations will appear here automatically.</p>
          </div>
        ) : (
          <div className="groups-container">
            {Object.entries(grouped).map(([label, items]) => (
              items.length > 0 && (
                <div key={label} className="history-group">
                  <h3 className="group-label">{label}</h3>
                  <div className="items-grid">
                    {items.map((item) => (
                      <motion.div 
                        key={item.id}
                        className="history-card"
                        whileHover={{ y: -4, scale: 1.01 }}
                        onClick={() => onSelect(item)}
                      >
                        <div className="card-top">
                          <div className={`type-badge ${item.type}`}>
                            {item.type === 'voice' ? <Mic size={14} /> : <MessageSquare size={14} />}
                            <span>{item.type === 'voice' ? 'Voice' : 'Chat'}</span>
                          </div>
                          <button 
                            className="delete-card-btn"
                            onClick={(e) => handleDelete(e, item.id)}
                            title="Delete Record"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <h4 className="card-title">{item.title || 'General Consultation'}</h4>
                        <div className="card-footer">
                          <span className="msg-count">{item.messages?.length || 0} messages</span>
                          <span className="card-time">
                            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div className="card-hover-overlay">
                          <span>View Details</span>
                          <ChevronRight size={18} />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsultationHistory;
