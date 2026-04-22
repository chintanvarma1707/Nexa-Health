/**
 * userDb.js
 * Persistent storage wrapper. Tries API first, falls back to localStorage.
 */

const STORAGE_PREFIX = 'nexa_data_';
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const getConversationHistory = async (userId, token) => {
  if (!userId) return [];
  
  try {
    const response = await fetch(`${API_BASE}/user/conversations`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    console.warn("API unavailable, falling back to local storage", e);
  }

  // Fallback
  const key = `${STORAGE_PREFIX}${userId}`;
  const data = localStorage.getItem(key);
  try {
    const db = data ? JSON.parse(data) : { conversations: [] };
    return db.conversations || [];
  } catch (e) {
    return [];
  }
};

export const addConversationToHistory = async (userId, conversation, token) => {
  if (!userId) return;
  
  // Try API
  try {
    const response = await fetch(`${API_BASE}/user/conversations`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(conversation)
    });
    if (response.ok) return;
  } catch (e) {
    console.warn("API save failed, saving locally", e);
  }

  // Local fallback
  const key = `${STORAGE_PREFIX}${userId}`;
  const data = localStorage.getItem(key);
  let db = { conversations: [] };
  try {
    if (data) db = JSON.parse(data);
  } catch (e) {}

  db.conversations = [conversation, ...(db.conversations || [])].slice(0, 50);
  localStorage.setItem(key, JSON.stringify(db));
};

export const deleteConversation = async (userId, convId, token) => {
  try {
    await fetch(`${API_BASE}/user/conversations/${convId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  } catch (e) {
    console.error("Delete failed", e);
  }
};

