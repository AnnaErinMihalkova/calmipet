CalmiPet - Stress Monitoring & Mental Wellness App

https://calmipet.onrender.com/

CalmiPet is a comprehensive mental wellness application that combines wearable device integration (ESP32), real-time biofeedback, and gamified breathing exercises to help users manage stress and improve their mental health.

🌟 Overview

CalmiPet monitors stress levels through wearable device data (heart rate and HRV) and provides personalized wellness recommendations. The app features an adorable pet companion that responds to your stress levels and guides you through breathing exercises using a scientifically-backed 4-7-8 rhythm.

✨ Key Features

Core Functionality
- **Live Stress Monitoring**: Real-time heart rate (BPM) and Heart Rate Variability (HRV) tracking via Bluetooth LE (ESP32).
- **Personalized Pet Companion**: Choose from 4 animated animals (Raccoon 🦝, Cat 🐱, Fox 🦊, Owl 🦉) that act as your wellness coach.
- **Guided Breathing**: Interactive 4-7-8 breathing sessions with smooth animations and visual guidance.
- **Daily Summary**: Comprehensive overview of your daily wellness metrics, including heart rate ranges and average stress levels.
- **Progress Tracking**: Visual trends of your HRV and stress history over time.

User Experience
- **Responsive Web & Mobile**: Modern, dark-themed interface optimized for both browser and mobile (WebView).
- **Interactive Animations**: Pets that respond to your breathing phases and stress states.
- **Quick Navigation**: Simple bottom navigation for Dashboard, Readings, Progress, and Account.

Technical Features
- **FastAPI Backend**: High-performance Python backend with JWT authentication.
- **Dual Database Support**: Uses PostgreSQL (Supabase) for production and SQLite for local development.
- **Bluetooth LE Integration**: Connects directly to ESP32 "Super Mini" hardware for real-time vitals.
- **Session Persistence**: Securely keeps you logged in across browser refreshes and mobile app restarts.

🏗️ Architecture

Backend (FastAPI)
- **Authentication**: JWT-based secure user authentication with password salting.
- **API Endpoints**: RESTful endpoints for readings, user profiles, and breathing sessions.
- **Database Logic**: Automatic schema migrations for both PostgreSQL and SQLite.
- **Stress Engine**: Rule-based stress prediction based on HRV and BPM metrics.

Frontend (React + TypeScript)
- **Modern Stack**: React 19 with TypeScript for type safety.
- **State Management**: React Hooks and Context API for global vitals and theme management.
- **Styling**: CSS with variable-based themes (Deep Purple Dark Mode).
- **Real-time UI**: Listens for custom events (e.g., `calmipet-pet-changed`) to update the UI instantly.

 Mobile (React Native + Expo)
- **WebView Architecture**: Wraps the web frontend for a native feel on iOS and Android.
- **Native Bridge**: Custom logic to sync authentication tokens and handle device-specific features.
- **Cache Management**: Integrated refresh mechanism to ensure you always see the latest features.

ESP32 Super Mini (Firmware)
- Firmware written in C++/Arduino (`firmware/calmipet_esp32/`).
- Streams JSON-formatted vitals (BPM, SpO2) over BLE.
- **Wiring**: MAX30102 sensor on SDA=8, SCL=9.

🚀 Getting Started

Prerequisites
- Python 3.10+
- Node.js 18+
- Git

### One-Command Setup (Windows)
We provide a PowerShell script to start everything at once:
```powershell
.\run-dev.ps1
```
This script will:
1. Detect your local IP address.
2. Start the FastAPI backend on port 8000.
3. Start the React frontend on port 3001.
4. Launch the Expo Metro Bundler for the mobile app.

### Manual Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
# Database initializes automatically on first run
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Manual Frontend Setup
```bash
cd frontend
npm install
npm start
```

## 📱 Companion System

Your wellness journey is guided by your choice of pet:
- **Raccoon 🦝**: The curious default.
- **Cat 🐱**: Calm and composed.
- **Fox 🦊**: Quick and adaptive.
- **Owl 🦉**: Wise and observant.

Each pet features unique animations for **Inhale**, **Hold**, and **Exhale** phases during breathing exercises.

## 📈 Data Visualization

- **HRV Trends**: Real-time line charts showing your heart rate variability.
- **Daily Stats**: Min/Max/Avg heart rate and mood tracking.
- **Stress Labels**: Automated classification (Low, Medium, High) based on biofeedback.

## 🔒 Security

- **JWT Security**: Tokens are handled via HTTP headers and stored securely.
- **Password Salting**: Uses unique salts for every user to ensure database security.
- **Environment Isolation**: Configurable via `.env` files for production and development.

---

**CalmiPet** - Breathe better, live calmer. 🌈✨
