# Nomadic Big Year 2026 - CSV Upload Portal

A web portal for tracking bird observations from eBird CSV exports. Built for the Nomadic Big Year 2026 competition for full-time RVers.

## Features

- **Magic Link Authentication** - Passwordless email-only login
- **CSV Upload** - Import eBird CSV exports (filters to 2026 observations only)
- **Automatic Leaderboard** - Rankings by species count with tiebreaker
- **Privacy Controls** - Choose between public, counts-only, or private
- **User Profiles** - View stats, observations, and geographic coverage
- **Deduplication** - Prevents duplicate observations on re-upload

## Tech Stack

### Backend
- **FastAPI** - Python web framework
- **PostgreSQL** - Database with materialized views for performance
- **SQLAlchemy** - ORM for database models
- **SendGrid** - Email service for magic links
- **Pandas** - CSV parsing
- **JWT** - Authentication tokens

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Axios** - HTTP client

## Project Structure

```
nomadic-big-year/
├── backend/
│   ├── main.py                 # FastAPI application entry point
│   ├── database.py             # Database connection and session
│   ├── models.py               # SQLAlchemy ORM models
│   ├── schemas.py              # Pydantic request/response schemas
│   ├── auth.py                 # Authentication utilities (magic link, JWT)
│   ├── csv_parser.py           # eBird CSV parsing logic
│   ├── routers/
│   │   ├── auth.py             # Auth endpoints
│   │   ├── upload.py           # CSV upload endpoints
│   │   ├── leaderboard.py      # Leaderboard endpoints
│   │   └── user.py             # User profile endpoints
│   ├── requirements.txt        # Python dependencies
│   └── .env.example            # Environment variables template
├── frontend/
│   ├── src/
│   │   ├── main.jsx            # React entry point
│   │   ├── App.jsx             # Main app component with routing
│   │   ├── pages/              # Page components
│   │   │   ├── HomePage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── VerifyPage.jsx
│   │   │   ├── LeaderboardPage.jsx
│   │   │   ├── UploadPage.jsx
│   │   │   └── ProfilePage.jsx
│   │   └── services/           # API and auth services
│   │       ├── api.js
│   │       └── auth.js
│   ├── package.json            # Node dependencies
│   ├── vite.config.js          # Vite configuration
│   └── index.html              # HTML template
├── database/
│   └── schema.sql              # PostgreSQL schema with functions
└── README.md
```

## Setup Instructions

### Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **PostgreSQL 12+**
- **SendGrid account** (for production) or use dev mode (prints links to console)

### 1. Database Setup

Create a PostgreSQL database:

```bash
createdb nomadic_big_year
```

Run the schema SQL:

```bash
psql nomadic_big_year < database/schema.sql
```

### 2. Backend Setup

Navigate to backend directory:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create `.env` file (copy from `.env.example`):

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/nomadic_big_year
JWT_SECRET_KEY=your-random-32-byte-secret-key
FRONTEND_URL=http://localhost:5173
SENDGRID_API_KEY=your-sendgrid-api-key  # Optional for dev
FROM_EMAIL=noreply@nomadicbigyear.com
PORT=8000
```

**Generate JWT secret key:**

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Run the backend:

```bash
python main.py
```

The API will be available at `http://localhost:8000`
API docs at `http://localhost:8000/docs`

### 3. Frontend Setup

Navigate to frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create `.env` file:

```bash
echo "VITE_API_URL=http://localhost:8000" > .env
```

Run the frontend:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Usage

### For Participants

1. **Sign Up/Login**
   - Go to the app and click "Log In"
   - Enter your email address
   - Check your email for the magic link
   - Click the link to log in (expires in 15 minutes)

2. **Export eBird Data**
   - Go to [ebird.org/downloadMyData](https://ebird.org/downloadMyData)
   - Request your data download
   - Check email for download link
   - Download and extract the ZIP file
   - Locate `MyEBirdData.csv`

3. **Upload CSV**
   - Click "Upload CSV" in the nav
   - Drag and drop or browse for your CSV file
   - Click "Upload CSV"
   - View import statistics
   - Only 2026 observations are imported
   - Duplicates are automatically skipped on re-upload

4. **View Leaderboard**
   - Rankings by species count for 2026
   - Ties broken by most recent observation date
   - See participant privacy levels

5. **Manage Profile**
   - Edit your name
   - Change privacy settings:
     - **Public:** Full observation details visible
     - **Counts Only:** Only species count visible
     - **Private:** Don't appear on leaderboard
   - View your statistics

### Privacy Levels

- **Public (default):** Appear on leaderboard with species count. Other logged-in users can view your observation details.
- **Counts Only:** Appear on leaderboard with species count. Observation details are hidden from others.
- **Private:** Don't appear on leaderboard at all. Only you can see your data.

### CSV Upload Notes

- Only observations from 2026 are imported
- Deduplication based on `(user_id, submission_id, scientific_name)` unique constraint
- Re-uploading same CSV will skip duplicates automatically
- Historical data (2022-2025) is filtered out during import
- Maximum file size: 10MB
- Format: Must be the standard eBird CSV export with 23 columns

## Deployment

### Backend (Railway)

1. Create new project on Railway
2. Add PostgreSQL service
3. Add Python service:
   - Connect GitHub repo
   - Root directory: `backend`
   - Build command: `pip install -r requirements.txt`
   - Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Set environment variables:
   - `DATABASE_URL` (auto-set by Railway)
   - `JWT_SECRET_KEY`
   - `FRONTEND_URL` (your Vercel URL)
   - `SENDGRID_API_KEY`
   - `FROM_EMAIL`
5. Deploy

### Frontend (Vercel)

1. Import GitHub repo to Vercel
2. Framework preset: Vite
3. Root directory: `frontend`
4. Build command: `npm run build`
5. Output directory: `dist`
6. Environment variable:
   - `VITE_API_URL` = your Railway backend URL
7. Deploy

### Database Migration

Run the schema SQL on your production database:

```bash
psql $DATABASE_URL < database/schema.sql
```

## API Endpoints

### Authentication
- `POST /auth/request-magic-link` - Request magic link email
- `GET /auth/verify?token={token}` - Verify magic link and get JWT
- `POST /auth/logout` - Logout (client-side)

### CSV Upload
- `POST /upload/csv` - Upload eBird CSV file (requires auth)

### Leaderboard
- `GET /leaderboard?year=2026&limit=100` - Get leaderboard
- `GET /leaderboard/{user_id}/progress?year=2026` - Get monthly progress

### User Profile
- `GET /user/me` - Get current user profile with stats
- `PATCH /user/me` - Update profile (name, privacy)
- `GET /user/me/observations` - Get observation list with pagination
- `GET /user/me/geographic-stats` - Get states/counties visited

### Health Check
- `GET /health` - Check API and database health

## Database Schema

### Tables

- **users** - Participant accounts, magic link tokens, privacy settings
- **observations** - All eBird observations (23 columns from CSV)
- **monthly_stats** - Monthly species count progression per user
- **geographic_stats** - States/counties visited per user

### Materialized View

- **species_summary** - Leaderboard view with species counts, last observation dates

### Functions

- `refresh_species_summary()` - Refresh materialized view
- `calculate_monthly_stats(user_id, year)` - Recalculate monthly stats
- `calculate_geographic_stats(user_id)` - Recalculate geographic stats

## Development

### Running Tests

Backend tests (TODO):
```bash
cd backend
pytest
```

### Code Style

Backend:
- Follow PEP 8
- Use type hints
- Document functions with docstrings

Frontend:
- Use functional components with hooks
- Keep components small and focused
- Use meaningful variable names

## Troubleshooting

### Backend Issues

**Database connection fails:**
- Check `DATABASE_URL` in `.env`
- Ensure PostgreSQL is running
- Verify database exists: `psql -l`

**Magic link emails not sending:**
- Check `SENDGRID_API_KEY` is set
- In dev mode, links are printed to console
- Check SendGrid dashboard for errors

**CSV upload fails:**
- Ensure file is valid eBird CSV export
- Check file size (max 10MB)
- Verify 23 required columns exist
- Check backend logs for parsing errors

### Frontend Issues

**API calls fail:**
- Check `VITE_API_URL` in `.env`
- Verify backend is running
- Check browser console for CORS errors
- Ensure JWT token is in localStorage

**Login doesn't work:**
- Check magic link hasn't expired (15 min)
- Verify email service is working
- Check browser allows localStorage
- Try clearing localStorage and retry

## Future Enhancements (Phase 2-3)

Phase 2 - Analytics:
- [ ] Monthly progress charts (Recharts)
- [ ] Geographic coverage map (Leaflet)
- [ ] Recent activity feed
- [ ] Species comparison tool

Phase 3 - Features:
- [ ] Rare bird alerts
- [ ] Photo uploads (ML Catalog integration)
- [ ] Export leaderboard as image for Facebook
- [ ] Email notifications (weekly digest)
- [ ] County-level tracking
- [ ] Life list vs Big Year toggle
- [ ] Search observations
- [ ] Filter leaderboard by state

## Contributing

This is a private project for the Nomadic Big Year 2026 RV community.

## Support

For technical issues or questions, post in the Facebook group or contact the challenge organizer.

## License

Private project - All rights reserved.

---

**Good luck and happy birding! 🦅 🚐**

*Let's see who can spot the most birds while exploring this beautiful country in 2026!*
