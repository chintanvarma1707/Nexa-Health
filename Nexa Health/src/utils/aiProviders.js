/**
 * Centralized AI Provider Module
 * 
 * Distributes API calls across multiple providers to avoid rate limits:
 * - Groq (llama-3.3-70b-versatile): Text-based features (Chat, Doctor)
 * - Gemini (gemini-2.5-flash): Vision/Image features (Camera/Scan)
 */

// ============ GROQ API (Text Generation) ============
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

/**
 * Call Groq API for text-based AI responses.
 * Used by: AIChatbot (Triage), VirtualDoctor
 * 
 * @param {string} systemPrompt - The system/instruction prompt
 * @param {string} userMessage - The user's message
 * @returns {Promise<string>} The AI response text
 */
export async function callGroq(systemPrompt, userMessage) {
  const API_KEY = import.meta.env.VITE_GROQ_API_KEY;
  if (!API_KEY) {
    throw new Error('MISSING_GROQ_API_KEY');
  }

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Groq API Error:', errorData);
    throw new Error(`Groq API Error: ${response.status}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error('Empty response from Groq');
  }

  return text;
}


// ============ GEMINI API (Vision / Image Analysis) ============
const GEMINI_MODEL = 'gemini-1.5-flash-latest';

/**
 * Call Gemini API for text-only responses (fallback).
 * 
 * @param {string} prompt - The full prompt text
 * @returns {Promise<string>} The AI response text
 */
export async function callGemini(prompt) {
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  if (!API_KEY) {
    throw new Error('MISSING_GEMINI_API_KEY');
  }

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${API_KEY}`;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Gemini API Error:', errorData);
    throw new Error(`Gemini API Error: ${response.status}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('Empty response from Gemini');
  }

  return text;
}

/**
 * Call Groq API with image input (Vision).
 * Used by: EmergencyCamera (Scan/Upload)
 * 
 * @param {string} prompt - The text prompt
 * @param {string} imageBase64 - Base64-encoded image data
 * @param {string} mimeType - Image MIME type (default: 'image/jpeg')
 * @returns {Promise<string>} The AI response text
 */
export async function callGroqVision(prompt, imageBase64, mimeType = 'image/jpeg') {
  const API_KEY = import.meta.env.VITE_GROQ_API_KEY;
  if (!API_KEY) {
    throw new Error('MISSING_GROQ_API_KEY');
  }

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`
              }
            }
          ]
        }
      ],
      temperature: 0.5,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Groq Vision API Error:', errorData);
    const apiErrorMsg = errorData?.error?.message || response.statusText;
    throw new Error(`Groq API Error: ${response.status} - ${apiErrorMsg}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error('Empty response from Groq Vision');
  }

  return text;
}

