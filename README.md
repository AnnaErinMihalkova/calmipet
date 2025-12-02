# CalmiPet - Human Wellness Monitoring Platform

## 🐾 Project Overview

CalmiPet is a human wellness monitoring platform that uses a friendly pet representation to make health tracking more approachable and engaging. While the branding features adorable pet imagery, this Django-based backend API is designed to track and analyze human health metrics, particularly focusing on heart rate and heart rate variability (HRV) data. The platform provides a robust foundation for building wellness applications that help users monitor their health in a stress-free, pet-friendly interface.

## 🚀 Current Development Status

**Phase**: Initial Backend Development  
**Status**: Core API Structure Complete  
**Last Updated**: December 2024

### ✅ Completed Features
- **RESTful API**: Complete API structure with Django REST Framework
- **Authentication**: User authentication system with Django's built-in auth
- **Data Models**: Core models for human wellness monitoring (Readings, Events)
- **API Endpoints**: ViewSets for managing personal health data
- **Database**: SQLite database with proper schema design
- **CORS Support**: Cross-origin resource sharing enabled for frontend integration
- **Pet-Friendly Branding**: Approachable interface design using pet imagery

### 🔄 In Progress
- Frontend integration preparation
- Data visualization capabilities
- Mobile app API optimization

## 🛠️ Technology Stack

### Backend
- **Framework**: Django 5.2.7
- **API**: Django REST Framework
- **Database**: SQLite (Development), PostgreSQL (Production-ready)
- **Authentication**: Django's built-in authentication system
- **CORS**: django-cors-headers for cross-origin requests

### Development Environment
- **Python**: 3.11+
- **Virtual Environment**: venv
- **Version Control**: Git with GitHub integration

## 📊 Data Models

### Reading Model
Tracks human wellness measurements with the following fields:
- `user`: Foreign key to the user who recorded the reading
- `ts`: Timestamp of the reading (auto-generated)
- `hr_bpm`: Heart rate in beats per minute (required)
- `hrv_rmssd`: Heart rate variability RMSSD metric (optional)

### Event Model
*(Structure available in models - additional functionality being developed)*

## 🔗 API Endpoints

### Authentication Required Endpoints
- `GET /api/readings/`: List all readings for authenticated user
- `POST /api/readings/`: Create new reading
- `GET /api/readings/{id}/`: Retrieve specific reading
- `PUT /api/readings/{id}/`: Update reading
- `DELETE /api/readings/{id}/`: Delete reading

### Event Endpoints
- Similar CRUD operations for event management

## 🏃‍♂️ Quick Start

### Prerequisites
- Python 3.11 or higher
- pip package manager
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/AnnaErinMihalkova/calmipet.git
   cd calmipet
   ```

2. **Set up virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install django djangorestframework django-cors-headers
   ```

4. **Run migrations**
   ```bash
   cd backend
   python manage.py migrate
   ```

5. **Create superuser**
   ```bash
   python manage.py createsuperuser
   ```

6. **Start development server**
   ```bash
   python manage.py runserver
   ```

## 📚 API Documentation

### Authentication
All API endpoints require authentication. Use Django's built-in authentication or implement token-based authentication as needed.

### Data Format
All API responses are in JSON format. Example reading data:
```json
{
  "id": 1,
  "user": 1,
  "ts": "2024-12-01T10:30:00Z",
  "hr_bpm": 85,
  "hrv_rmssd": 45.2
}
```

## 🎯 Future Roadmap

### Short-term Goals
- [ ] Frontend dashboard development
- [ ] Real-time data visualization
- [ ] Mobile app API optimization
- [ ] Data export functionality

### Medium-term Goals
- [ ] Advanced analytics and insights
- [ ] Machine learning for health pattern detection
- [ ] Multi-user family support
- [ ] Healthcare provider integration

### Long-term Vision
- [ ] IoT wearable device integration
- [ ] Community features for wellness support
- [ ] Healthcare professional tools
- [ ] Health trend predictions
- [ ] Gamified wellness challenges with pet themes

## 🤝 Contributing

This project is in active development. Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is currently private and not licensed for public use.

## 📞 Contact

For questions or collaboration opportunities, please reach out through the GitHub repository.

---

**CalmiPet** - Making human wellness monitoring friendly and approachable through pet-inspired design! 🐕🐱💗