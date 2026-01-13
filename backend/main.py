"""
Nomadic Big Year 2026 - FastAPI Backend
Main application entry point
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from routers import auth, upload, leaderboard, user, feedback
from database import SessionLocal
from sqlalchemy import text


def run_migrations():
    """Run database migrations on startup"""
    db = SessionLocal()
    try:
        # Check if materialized view needs the countable species filter
        # by looking for the filter pattern in the view definition
        check_query = text("""
            SELECT pg_get_viewdef('species_summary'::regclass, true)
        """)
        result = db.execute(check_query).scalar()

        # If the view doesn't have the countable filter, recreate it
        if result and "Domestic" not in result:
            print("Updating species_summary view with countable species filter...")
            migration_sql = text("""
                DROP MATERIALIZED VIEW IF EXISTS species_summary CASCADE;

                CREATE MATERIALIZED VIEW species_summary AS
                SELECT
                    u.id AS user_id,
                    u.name AS user_name,
                    u.email AS user_email,
                    u.privacy_level,
                    COUNT(DISTINCT o.scientific_name) AS species_count,
                    MAX(o.observation_date) AS last_observation_date,
                    MAX(o.uploaded_at) AS last_upload_date
                FROM users u
                LEFT JOIN observations o ON u.id = o.user_id
                    AND EXTRACT(YEAR FROM o.observation_date) = 2026
                    AND o.common_name NOT LIKE '%(Domestic%'
                    AND o.common_name NOT LIKE '%hybrid%'
                    AND o.common_name NOT LIKE '% x %'
                    AND o.common_name NOT LIKE '%/%'
                    AND o.common_name NOT LIKE '%sp.%'
                GROUP BY u.id, u.name, u.email, u.privacy_level
                ORDER BY species_count DESC, last_observation_date DESC;

                CREATE UNIQUE INDEX idx_species_summary_user ON species_summary(user_id);
            """)
            db.execute(migration_sql)
            db.commit()
            print("Migration complete!")
        else:
            print("species_summary view is up to date")
    except Exception as e:
        print(f"Migration check/run failed: {e}")
        db.rollback()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup/shutdown events"""
    # Startup
    run_migrations()
    yield
    # Shutdown (nothing to do)

# Create FastAPI app
app = FastAPI(
    title="Nomadic Big Year 2026 API",
    description="CSV upload portal for eBird data and leaderboard tracking",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
origins = [
    FRONTEND_URL,
    "https://nomadicbigyear.com",
    "https://www.nomadicbigyear.com",
    "http://localhost:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

# Include routers
app.include_router(auth.router)
app.include_router(upload.router)
app.include_router(leaderboard.router)
app.include_router(user.router)
app.include_router(feedback.router)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Nomadic Big Year 2026 API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    from database import SessionLocal

    try:
        db = SessionLocal()
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        db.close()
        return {
            "status": "healthy",
            "database": "connected"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
