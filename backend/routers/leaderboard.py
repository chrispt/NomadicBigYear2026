"""
Leaderboard endpoints
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text

from database import get_db
from schemas import LeaderboardResponse, LeaderboardEntry, MonthlyProgressResponse, MonthlyProgress
from models import MonthlyStat, User

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])

@router.get("", response_model=LeaderboardResponse)
async def get_leaderboard(
    year: int = Query(2026, description="Year to filter by"),
    limit: int = Query(100, description="Number of results", le=500),
    db: Session = Depends(get_db)
):
    """
    Get public leaderboard with rankings.
    Excludes users with privacy_level='private'.
    Ranks by species_count DESC, then last_observation_date DESC (tiebreaker).
    """
    # Query species_summary materialized view
    query = text("""
        SELECT
            user_id,
            user_name,
            species_count,
            last_observation_date,
            privacy_level
        FROM species_summary
        WHERE privacy_level != 'private'
        ORDER BY species_count DESC, last_observation_date DESC
        LIMIT :limit
    """)

    result = db.execute(query, {"limit": limit})
    rows = result.fetchall()

    # Add rank numbers
    leaderboard = []
    for rank, row in enumerate(rows, start=1):
        leaderboard.append(LeaderboardEntry(
            rank=rank,
            user_id=row.user_id,
            name=row.user_name,
            species_count=row.species_count or 0,
            last_observation_date=row.last_observation_date,
            privacy_level=row.privacy_level
        ))

    # Count total participants (excluding private)
    count_query = text("""
        SELECT COUNT(*)
        FROM species_summary
        WHERE privacy_level != 'private'
    """)
    participants = db.execute(count_query).scalar()

    return LeaderboardResponse(
        year=year,
        participants=participants or 0,
        leaderboard=leaderboard
    )

@router.get("/{user_id}/progress", response_model=MonthlyProgressResponse)
async def get_user_progress(
    user_id: int,
    year: int = Query(2026, description="Year to filter by"),
    db: Session = Depends(get_db)
):
    """
    Get monthly progress chart data for a user.
    Returns cumulative species count by month.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Get monthly stats
    monthly_stats = db.query(MonthlyStat).filter(
        MonthlyStat.user_id == user_id,
        MonthlyStat.year == year
    ).order_by(MonthlyStat.month).all()

    # Format for response
    monthly_progress = []
    cumulative_count = 0
    for stat in monthly_stats:
        cumulative_count = stat.species_count
        monthly_progress.append(MonthlyProgress(
            month=f"{year}-{stat.month:02d}",
            species_count=cumulative_count,
            new_species=stat.new_species_count or 0
        ))

    return MonthlyProgressResponse(
        user_id=user_id,
        user_name=user.name,
        monthly_progress=monthly_progress
    )
