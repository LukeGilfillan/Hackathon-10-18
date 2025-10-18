# Cardinal Concordia

A full-stack AI-powered research discovery platform with Django REST API backend and React frontend.

## Setup Instructions

### Backend (Django)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Activate the virtual environment:
   ```bash
   source venv/bin/activate
   ```

3. Run the Django development server:
   ```bash
   python manage.py runserver
   ```

The backend will be available at `http://localhost:8000`

### Frontend (React)

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies (if not already done):
   ```bash
   npm install
   ```

3. Start the React development server:
   ```bash
   npm start
   ```

The frontend will be available at `http://localhost:3000`

## API Endpoints

- `GET /api/hello/` - Test endpoint that returns a hello message

## Project Structure

```
├── backend/          # Django REST API
│   ├── venv/         # Python virtual environment
│   ├── grantmatch/   # Django project settings
│   ├── api/          # API app with endpoints
│   └── manage.py     # Django management script
└── frontend/         # React application
    ├── src/          # React source code
    ├── public/       # Static files
    └── package.json  # Node.js dependencies
```

## About Cardinal Concordia

Cardinal Concordia (Latin for "harmony") is an AI-powered research discovery platform that brings together grant opportunities and researcher profiles in perfect harmony. The platform integrates with IgniteHub's comprehensive database to help researchers find funding opportunities and connect with potential collaborators.

## Development

Both servers need to be running simultaneously for full functionality:
- Backend: `http://localhost:8000`
- Frontend: `http://localhost:3000`

The Django backend is configured with CORS to allow requests from the React frontend.
