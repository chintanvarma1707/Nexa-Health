import React, { createContext, useState, useEffect, useContext } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const { getToken } = useClerkAuth();
  const [chatHistory, setChatHistory] = useState([]);
  const [token, setToken] = useState(null);

  // Map Clerk user to the format expected by the app
  const user = isSignedIn ? {
    id: clerkUser.id,
    name: clerkUser.fullName || clerkUser.firstName || 'User',
    email: clerkUser.primaryEmailAddress?.emailAddress
  } : null;

  useEffect(() => {
    if (isSignedIn) {
      getToken().then(t => {
        setToken(t);
        fetch(`${(import.meta.env.VITE_API_URL || 'http://localhost:8000/api')}/user/conversations`, {
          headers: { 'Authorization': `Bearer ${t}` }
        })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setChatHistory(data);
        })
        .catch(err => console.error('Failed to fetch history', err));
      });
    } else {
      setToken(null);
      setChatHistory([]);
    }
  }, [isSignedIn, getToken]);

  const addToHistory = async (entry) => {
    // Optimistic UI update
    setChatHistory(prev => [entry, ...prev]);

    if (token) {
      try {
        await fetch(`${(import.meta.env.VITE_API_URL || 'http://localhost:8000/api')}/user/conversations`, {
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

  // Login and signup are now handled by Clerk components, we provide dummy functions just in case
  const login = async () => {};
  const signup = async () => {};
  const logout = async () => {};

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout, loading: !isLoaded, chatHistory, addToHistory }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
