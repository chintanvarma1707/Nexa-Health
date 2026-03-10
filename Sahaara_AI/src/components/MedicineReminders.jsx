import React, { useState } from 'react';
import { Plus, Mic, Play, Trash2, Clock } from 'lucide-react';
import { getTranslation } from '../utils/translations';
import './MedicineReminders.css';

const MedicineReminders = ({ selectedLanguage }) => {
  const [reminders, setReminders] = useState([
    { id: 1, name: 'Blood Pressure Med (Amlodipine)', time: '08:00', repeats: true, recording: true },
    { id: 2, name: 'Diabetes Pill (Metformin)', time: '20:00', repeats: true, recording: false }
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const [newMedName, setNewMedName] = useState('');
  const [newMedTime, setNewMedTime] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [hasNewRecording, setHasNewRecording] = useState(false);

  const handleAdd = () => {
    if (newMedName && newMedTime) {
      setReminders([...reminders, {
        id: Date.now(),
        name: newMedName,
        time: newMedTime,
        repeats: true,
        recording: hasNewRecording
      }]);
      setShowAdd(false);
      setNewMedName('');
      setNewMedTime('');
      setHasNewRecording(false);
    }
  };

  const removeReminder = (id) => {
    setReminders(reminders.filter(r => r.id !== id));
  };

  const simulateRecord = () => {
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      setHasNewRecording(true);
    }, 3000);
  };

  return (
    <div className="reminders-container">
      <div className="header-row">
        <h2 className="page-title">{getTranslation(selectedLanguage, 'medicine_reminders')}</h2>
        <button className="add-btn" onClick={() => setShowAdd(!showAdd)}>
          <Plus size={20} /> {getTranslation(selectedLanguage, 'add_medicine')}
        </button>
      </div>

      {showAdd && (
        <div className="add-reminder-card card">
          <h3>{getTranslation(selectedLanguage, 'add_new_reminder')}</h3>
          <div className="form-group">
            <label>{getTranslation(selectedLanguage, 'medicine_name')}</label>
            <input 
              type="text" 
              placeholder="e.g. Paracetamol"
              value={newMedName}
              onChange={(e) => setNewMedName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>{getTranslation(selectedLanguage, 'time')}</label>
            <input 
              type="time" 
              value={newMedTime}
              onChange={(e) => setNewMedTime(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>{getTranslation(selectedLanguage, 'custom_voice')}</label>
            <div className="recording-area">
              <button 
                className={`record-btn ${isRecording ? 'recording' : ''}`}
                onClick={simulateRecord}
                disabled={isRecording}
              >
                <Mic size={20} /> 
                {isRecording ? 'Recording...' : hasNewRecording ? getTranslation(selectedLanguage, 're_record') : getTranslation(selectedLanguage, 'record_voice_alert')}
              </button>
              {hasNewRecording && <span className="text-green">✓ Recorded</span>}
            </div>
            <p className="hint">{getTranslation(selectedLanguage, 'hint_custom_voice')}</p>
          </div>
          <div className="form-actions">
            <button className="cancel-btn" onClick={() => setShowAdd(false)}>{getTranslation(selectedLanguage, 'cancel')}</button>
            <button className="save-btn" onClick={handleAdd}>{getTranslation(selectedLanguage, 'save_reminder')}</button>
          </div>
        </div>
      )}

      <div className="reminders-grid">
        {reminders.map(rem => (
          <div key={rem.id} className="reminder-card card">
            <div className="reminder-info">
              <h3>{rem.name}</h3>
              <div className="time-badge">
                <Clock size={16} />
                <span>{rem.time}</span>
              </div>
              <p className="repeat-status">{rem.repeats ? getTranslation(selectedLanguage, 'repeats_daily') : getTranslation(selectedLanguage, 'one_time')}</p>
            </div>
            
            <div className="reminder-actions">
              {rem.recording && (
                <button className="icon-btn play-btn" title="Play Voice Alert">
                  <Play size={20} />
                </button>
              )}
              <button className="icon-btn delete-btn" onClick={() => removeReminder(rem.id)}>
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MedicineReminders;
