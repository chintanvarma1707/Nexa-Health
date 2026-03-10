import React, { useState, useMemo } from 'react';
import { BookOpen, Search, Droplets, Flame, Wind, EyeOff, Activity, ShieldAlert } from 'lucide-react';
import { getTranslation } from '../utils/translations';
import './EmergencyGuide.css';

const EmergencyGuide = ({ selectedLanguage }) => {
  const [selectedGuideId, setSelectedGuideId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const guides = useMemo(() => {
    const localizedGuides = getTranslation(selectedLanguage, 'guides') || [];
    const icons = {
      choking: <Wind size={32} />,
      bleeding: <Droplets size={32} />,
      burns: <Flame size={32} />,
      fainting: <EyeOff size={32} />,
      snakebite: <ShieldAlert size={32} />,
      panic: <Activity size={32} />
    };
    const colors = {
      choking: 'var(--color-panic-500)',
      bleeding: 'var(--color-panic-600)',
      burns: 'var(--color-light-blue-600)',
      fainting: 'var(--color-text-muted)',
      snakebite: 'var(--color-soft-green-600)',
      panic: 'var(--color-light-blue-500)'
    };

    return localizedGuides.map(g => ({
      ...g,
      icon: icons[g.id],
      color: colors[g.id]
    }));
  }, [selectedLanguage]);

  const filteredGuides = guides.filter(g => 
    g.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    g.steps.some(step => step.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const selectedGuide = guides.find(g => g.id === selectedGuideId);

  return (
    <div className="guide-container">
      <div className="guide-header">
        <div>
          <h2 className="page-title">{getTranslation(selectedLanguage, 'offline_emergency_guide')}</h2>
          <p className="subtitle">{getTranslation(selectedLanguage, 'first_aid_offline')}</p>
        </div>
        <div className="search-bar">
          <Search size={20} color="var(--color-text-muted)" />
          <input 
            type="text" 
            placeholder={getTranslation(selectedLanguage, 'search_guides')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="guide-layout">
        <div className="guide-list">
          {filteredGuides.map(guide => (
            <div 
              key={guide.id} 
              className={`guide-card card ${selectedGuideId === guide.id ? 'active' : ''}`}
              onClick={() => setSelectedGuideId(guide.id)}
            >
              <div className="guide-icon" style={{ backgroundColor: `${guide.color}20`, color: guide.color }}>
                {guide.icon}
              </div>
              <div className="guide-info">
                <h3>{guide.title}</h3>
                <p>{guide.description}</p>
              </div>
            </div>
          ))}
          {filteredGuides.length === 0 && (
            <p className="no-results">No guides found for "{searchTerm}"</p>
          )}
        </div>

        <div className="guide-details card">
          {selectedGuide ? (
            <div className="details-content animation-fade-in">
              <div className="details-header" style={{ color: selectedGuide.color }}>
                {selectedGuide.icon}
                <h2>{selectedGuide.title}</h2>
              </div>
              
              <ul className="steps-list">
                {selectedGuide.steps.map((step, index) => (
                  <li key={index}>
                    <div className="step-number" style={{ backgroundColor: selectedGuide.color }}>
                      {index + 1}
                    </div>
                    <p>{step}</p>
                  </li>
                ))}
              </ul>
              <div className="offline-badge">
                <BookOpen size={16} /> {getTranslation(selectedLanguage, 'accessible_offline')}
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <BookOpen size={64} color="var(--color-border)" />
              <p>{getTranslation(selectedLanguage, 'select_topic')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmergencyGuide;
