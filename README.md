# 🏥 Nexa Health — AI-Powered Healthcare Ecosystem

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![TensorFlow](https://img.shields.io/badge/TensorFlow-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white)](https://wwww.tensorflow.org/)
[![Clerk](https://img.shields.io/badge/Clerk-6C47FF?style=for-the-badge&logo=clerk&logoColor=white)](https://clerk.com/)
[![Gemini](https://img.shields.io/badge/Google_Gemini-8E75C2?style=for-the-badge&logo=googlegemini&logoColor=white)](https://deepmind.google/technologies/gemini/)

**Nexa Health** is a premium, high-fidelity healthcare assistant designed to bridge the gap between AI and patient care. Built with a modern glassmorphism UI, it integrates state-of-the-art Computer Vision for posture detection, Generative AI for virtual consultations, and a robust backend for secure health data management.

---

## ✨ Key Features

### 🤖 AI Virtual Doctor
- **Intelligent Consultations**: Powered by Google Gemini for accurate, context-aware medical guidance.
- **Multilingual Support**: Real-time translation and support for multiple regional languages.
- **Persistent Memory**: Retains consultation history for longitudinal health tracking.

### 👁️ Computer Vision Diagnostics
- **Emergency Camera**: Real-time pose detection using TensorFlow.js to detect falls or distress.
- **AI Report Agent**: Scan and analyze medical reports instantly using OCR and LLMs.

### 🔐 Professional Infrastructure
- **Enterprise Auth**: Secure user management via Clerk.
- **Bento Dashboard**: A modern, data-driven UI featuring heartbeat animations and live clinical clocks.
- **Panic Mode**: Immediate SOS triggering with background email alerts via EmailJS.

### 📍 Healthcare Locator
- **Nearby Help**: Interactive Leaflet maps to locate hospitals and pharmacies instantly.

---

## 🛠️ Tech Stack

| Frontend | Backend | AI & Logic |
| :--- | :--- | :--- |
| React 19 (Vite) | FastAPI (Python) | Google Gemini AI |
| Framer Motion | Node.js (Vercel) | TensorFlow.js |
| CSS3 (Glassmorphism) | SQLite / Supabase | Pose Detection |
| Lucide Icons | JWT & Clerk Auth | EmailJS |

---

## 📂 Repository Structure

```text
NEXA-HEALTH/
├── client/              # React + Vite Frontend
│   ├── src/             # Source code
│   └── public/          # Static assets
├── server-python/       # FastAPI Backend (Logic & DB)
├── server-node/         # Node.js API (Serverless Functions)
├── docs/                # Project documentation & media
└── README.md            # Project Hub
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python (3.9+)
- Gemini API Key
- Clerk Frontend API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/nexa-health.git
   cd nexa-health
   ```

2. **Setup Client**
   ```bash
   cd client
   npm install
   cp .env.example .env
   npm run dev
   ```

3. **Setup Server**
   ```bash
   cd server-python
   python -m venv venv
   source venv/bin/activate  # venv\Scripts\activate on Windows
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```

---

## 🛡️ Professional Features: Authentication & Security

Nexa Health implements industry-standard security:
- **Clerk Auth**: Handles session management, MFA, and user metadata.
- **JWT Protection**: Backend routes are secured via Clerk JWT verification.
- **Environment Isolation**: Sensitive keys are managed via `.env` files.

---

## 🎨 UI/UX Design

The application follows a **Glassmorphism** design language:
- **Translucency**: Frosted glass effects for a premium feel.
- **Vibrant Accents**: Neon blues and teals for high visibility.
- **Responsive Layout**: Optimized for both Desktop Bento-grids and Mobile-first navigation.

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
<p align="center">Made with ❤️ by the Nexa Health Team</p>
