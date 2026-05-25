# CalmIPet - Stress Monitoring & Mental Wellness App

A comprehensive mental wellness application that combines wearable device integration, machine learning stress prediction, and gamified breathing exercises to help users manage stress and improve their mental health.

## 🌟 Overview

CalmIPet is a full-stack application designed to monitor stress levels through wearable device data (primarily heart rate readings) and provide personalized wellness recommendations. The app features an adorable pet companion that responds to your stress levels and guides you through breathing exercises.

## ✨ Key Features

### Core Functionality
- **Stress Level Monitoring**: Real-time heart rate tracking and stress prediction using machine learning
- **Personalized Pet Companion**: Choose from 4 adorable animals (Raccoon 🦝, Cat 🐱, Fox 🦊, Owl 🦉) that serve as your wellness coach
- **Breathing Exercises**: Guided breathing sessions with visual feedback and progress tracking
- **Achievement System**: Gamified wellness journey with unlockable achievements
- **Progress Tracking**: Visual charts showing stress trends and improvement over time

### User Experience
- **Responsive Web Interface**: Clean, modern design optimized for desktop and mobile
- **Dark/Light Theme Toggle**: Personalized viewing experience
- **Intuitive Navigation**: Simple, user-friendly interface
- **Real-time Updates**: Live stress monitoring and instant feedback

### Technical Features
- **Machine Learning Integration**: Advanced stress prediction algorithms
- **RESTful API**: Secure backend with JWT authentication
- **Real-time Communication**: WebSocket support for live updates
- **Data Export**: Export your wellness data in multiple formats
- **Rate Limiting**: API protection and performance optimization

## 🏗️ Architecture

### Backend (Django + Django REST Framework)
- **Authentication**: JWT-based secure user authentication
- **API Endpoints**: RESTful endpoints for readings, users, achievements, and sessions
- **Machine Learning**: Integrated ML models for stress prediction
- **Database**: PostgreSQL for data persistence
- **Real-time**: WebSocket support via Django Channels

### Frontend (React + TypeScript)
- **Modern Stack**: React 19 with TypeScript for type safety
- **State Management**: React hooks and context for state management
- **Styling**: CSS modules with theme support
- **API Integration**: Axios for backend communication
- **Port**: Runs on port 3001 (configurable)

### Mobile (React Native/Expo)
- **Cross-platform**: iOS and Android support
- **Native Features**: Device sensor integration
- **Offline Support**: Local data storage capabilities

### ESP32 Super Mini (Bluetooth LE)
- Firmware in `firmware/calmipet_esp32/` streams JSON vitals over BLE
- Web app connects via **Web Bluetooth** (Chrome/Edge) on the dashboard
- See `firmware/README.md` for wiring (MAX30102 on SDA=8, SCL=9) and flashing steps

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- Node.js 16+
- PostgreSQL (or SQLite for development)
- Git

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 127.0.0.1:8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

The frontend will be available at `http://localhost:3001`

### Environment Configuration
Create a `.env` file in the backend directory:
```
SECRET_KEY=your-secret-key
DEBUG=True
DATABASE_URL=postgresql://user:password@localhost:5432/calmipet
CORS_ALLOWED_ORIGINS=http://localhost:3001
```

## 📊 Machine Learning

The application includes sophisticated ML models for stress prediction:

- **Baseline Comparison**: Compares current readings to user's historical baseline
- **Rule-based Classification**: Traditional algorithmic approaches
- **Advanced Models**: Scikit-learn integration for complex pattern recognition
- **Continuous Learning**: Models improve with more user data

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **CORS Configuration**: Proper cross-origin resource sharing setup
- **Input Validation**: Comprehensive data validation on all endpoints
- **Rate Limiting**: API protection against abuse
- **Data Encryption**: Sensitive data encryption in transit and at rest

## 📱 Pet System

Users can choose from four adorable companions:

1. **Raccoon 🦝** - The default curious companion
2. **Cat 🐱** - Calm and independent
3. **Fox 🦊** - Clever and adaptive
4. **Owl 🦉** - Wise and observant

Each pet has unique animations and responds differently to stress levels, providing a personalized experience.

## 🎯 Achievement System

Users earn achievements for:
- Completing breathing exercises
- Maintaining low stress levels
- Consistent daily usage
- Reaching wellness milestones
- Sharing progress with friends

## 📈 Data Visualization

- **Stress Trend Charts**: Line graphs showing stress levels over time
- **Achievement Progress**: Visual progress bars for unlocked achievements
- **Session History**: Detailed logs of breathing exercises and readings
- **Export Options**: Data export in CSV, JSON, and PDF formats

## 🧪 Testing

The project includes comprehensive testing:
- **Unit Tests**: Backend API endpoint testing
- **Integration Tests**: Frontend-backend integration testing
- **ML Model Validation**: Stress prediction accuracy testing
- **Performance Tests**: Load testing for concurrent users

## 📝 Documentation

Detailed documentation is available in the `docs_phase1/` directory:
- Architecture diagrams
- API specifications
- User flow diagrams
- ML experiment reports
- Sprint planning and retrospectives

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with love for mental wellness and stress management
- Inspired by the need for accessible mental health tools
- Powered by modern web technologies and machine learning
- Designed with user experience and accessibility in mind

---

**CalmIPet** - Your personal wellness companion for a calmer, healthier life. 🌈✨