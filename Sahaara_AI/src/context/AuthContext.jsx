import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    try {
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);

  useEffect(() => {
    // Sync localStorage with state
    const storedUser = localStorage.getItem('user');
    if (storedUser && token) {
      // In a real app, we might verify token validity here
      // For speed, we populate history once on mount if logged in
      fetch(`${import.meta.env.VITE_API_URL}/user/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setChatHistory(data);
      })
      .catch(err => console.error('Failed to fetch history', err));
    }
  }, [token]);

  const addToHistory = async (entry) => {
    // Optimistic UI update
    setChatHistory(prev => [entry, ...prev]);

    if (token) {
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/user/history`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify(entry),
        });
      } catch (error) {
        console.error('Failed to save history', error);
      }
    }
  };

  const login = async (email, password) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (response.ok) {
        // Atomic session update
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Single batch of state updates
        setToken(data.token);
        setUser(data.user);
        if (Array.isArray(data.history)) setChatHistory(data.history);
        
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (err) {
      return { success: false, message: "Network connection failed" };
    }
  };

  const signup = async (name, email, password) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        setToken(data.token);
        setUser(data.user);
        if (Array.isArray(data.history)) setChatHistory(data.history);
        
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (err) {
      return { success: false, message: "Network connection failed" };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setChatHistory([]);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout, loading, chatHistory, addToHistory }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
