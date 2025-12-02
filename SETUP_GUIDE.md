# CalmiPet Setup Guide

This guide will help you set up both the Django backend with PostgreSQL and the React TypeScript frontend for the CalmiPet wellness monitoring platform.

## Prerequisites

- Python 3.8+
- Node.js 16+
- PostgreSQL 12+
- Git

## Backend Setup (Django + PostgreSQL)

### 1. PostgreSQL Installation and Setup

#### Install PostgreSQL:
- **Windows**: Download from [postgresql.org](https://www.postgresql.org/download/windows/)
- **macOS**: `brew install postgresql`
- **Linux**: `sudo apt-get install postgresql postgresql-contrib`

#### Create Database and User:
```bash
# Connect to PostgreSQL as superuser
psql -U postgres

# Create database
create database calmipet;

# Create user (optional, can use postgres user)
create user calmipet_user with password 'your_secure_password';

# Grant privileges
grant all privileges on database calmipet to calmipet_user;

# Exit PostgreSQL
\q
```

### 2. Backend Environment Setup

#### Navigate to backend directory:
```bash
cd backend
```

#### Copy environment template:
```bash
cp .env.example .env
```

#### Update .env file with your PostgreSQL credentials:
```
DB_NAME=calmipet
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
DB_PORT=5432
SECRET_KEY=your_django_secret_key_here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

### 3. Install Dependencies

```bash
# Make sure you're in the backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Or install individually:
pip install django djangorestframework django-cors-headers psycopg2-binary python-dotenv
```

### 4. Database Migration

```bash
# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser (for admin access)
python manage.py createsuperuser
```

### 5. Start Backend Server

```bash
python manage.py runserver
```

The backend should now be running at: http://localhost:8000

API endpoints:
- Readings: http://localhost:8000/api/readings/
- Admin: http://localhost:8000/admin/

## Frontend Setup (React + TypeScript)

### 1. Navigate to Frontend Directory

```bash
cd frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Development Server

```bash
npm start
```

The frontend should now be running at: http://localhost:3000

## Project Structure

```
calmipet/
├── backend/                 # Django backend
│   ├── api/                 # Main API app
│   │   ├── models.py        # Data models
│   │   ├── views.py         # API views
│   │   ├── serializers.py   # Data serializers
│   │   └── urls.py          # API URLs
│   ├── backend/             # Django project settings
│   │   ├── settings.py      # Main settings
│   │   ├── urls.py          # Project URLs
│   │   └── wsgi.py          # WSGI configuration
│   ├── manage.py            # Django management
│   ├── .env.example         # Environment template
│   └── requirements.txt     # Python dependencies
└── frontend/                # React TypeScript frontend
    ├── src/
    │   ├── components/      # React components
    │   │   └── ReadingList.tsx
    │   ├── services/        # API services
    │   │   └── api.ts
    │   ├── App.tsx          # Main app component
    │   └── index.tsx        # App entry point
    ├── public/              # Static assets
    └── package.json         # Node.js dependencies
```

## Testing the Setup

### Test Backend API:
```bash
# Get all readings (should be empty initially)
curl http://localhost:8000/api/readings/

# Create a test reading
curl -X POST http://localhost:8000/api/readings/ \
  -H "Content-Type: application/json" \
  -d '{"user": 1, "ts": "2025-01-01T12:00:00Z", "hr_bpm": 75, "hrv_rmssd": 45}'
```

### Test Frontend:
1. Open http://localhost:3000 in your browser
2. Click "Add Test Reading" to create sample data
3. You should see wellness readings displayed

## Development Workflow

### Backend Development:
```bash
# Make model changes
python manage.py makemigrations
python manage.py migrate

# Create new apps
python manage.py startapp new_app

# Run tests
python manage.py test

# Access Django shell
python manage.py shell
```

### Frontend Development:
```bash
# Install new packages
npm install package_name

# Build for production
npm run build

# Run tests
npm test

# Check for security vulnerabilities
npm audit
```

## Common Issues and Solutions

### PostgreSQL Connection Issues:
- Ensure PostgreSQL service is running
- Check credentials in `.env` file
- Verify database exists
- Check firewall settings

### CORS Issues:
- Django CORS is configured to allow all origins in development
- For production, update `CORS_ALLOWED_ORIGINS` in settings

### Port Conflicts:
- Backend: Change port with `python manage.py runserver 8080`
- Frontend: Change port with `PORT=3001 npm start`

## Next Steps

1. **Authentication**: Implement user authentication (JWT or session-based)
2. **Data Visualization**: Add charts for wellness trends
3. **Real-time Updates**: Implement WebSocket for live data
4. **Mobile Optimization**: Ensure responsive design
5. **Testing**: Add comprehensive tests for both frontend and backend

## Security Considerations

- Change default secret keys in production
- Use environment variables for sensitive data
- Implement proper CORS settings for production
- Add rate limiting and input validation
- Use HTTPS in production
- Regularly update dependencies

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Django and React documentation
3. Check application logs for specific error messages
4. Ensure all dependencies are properly installed

Happy coding! 🐾💚