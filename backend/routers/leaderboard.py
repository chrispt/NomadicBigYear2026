"""
Leaderboard endpoints
"""
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text

from database import get_db
from schemas import (
    LeaderboardResponse, LeaderboardEntry, MonthlyProgressResponse, MonthlyProgress,
    PublicUserSpeciesResponse, PublicSpeciesEntry
)
from models import MonthlyStat, User

# SQL condition to filter out uncountable species (domestics, hybrids, spuhs, slashes)
COUNTABLE_SPECIES_FILTER = """
    common_name NOT LIKE '%%(Domestic%%'
    AND common_name NOT LIKE '%%hybrid%%'
    AND common_name NOT LIKE '%% x %%'
    AND common_name NOT LIKE '%%/%%'
    AND common_name NOT LIKE '%%sp.%%'
"""

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

@router.get("/{user_id}/species", response_model=PublicUserSpeciesResponse)
async def get_user_species(
    user_id: int,
    year: int = Query(2026, description="Year to filter by"),
    sort: str = Query("name", description="Sort by: name or date"),
    db: Session = Depends(get_db)
):
    """
    Get public species list for a user.
    - public: Returns full species list with dates and locations
    - counts_only: Returns species list with dates but NO locations
    - private: Returns 404 (user not visible on leaderboard)

    Excludes uncountable species (domestics, hybrids, spuhs, slashes).
    """
    # Get user and check privacy
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if user.privacy_level == 'private':
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Get countable species count
    count_query = text(f"""
        SELECT COUNT(DISTINCT scientific_name)
        FROM observations
        WHERE user_id = :user_id
        AND EXTRACT(YEAR FROM observation_date) = :year
        AND {COUNTABLE_SPECIES_FILTER}
    """)
    species_count = db.execute(count_query, {"user_id": user_id, "year": year}).scalar() or 0

    # Get unique species with first observation
    order_clause = "common_name ASC" if sort == "name" else "first_obs DESC"

    species_query = text(f"""
        SELECT
            common_name,
            scientific_name,
            MIN(observation_date) as first_obs,
            (SELECT state_province FROM observations o2
             WHERE o2.user_id = :user_id
             AND o2.scientific_name = o.scientific_name
             AND o2.observation_date = MIN(o.observation_date)
             LIMIT 1) as state_province
        FROM observations o
        WHERE user_id = :user_id
        AND EXTRACT(YEAR FROM observation_date) = :year
        AND {COUNTABLE_SPECIES_FILTER}
        GROUP BY scientific_name, common_name
        ORDER BY {order_clause}
    """)

    result = db.execute(species_query, {"user_id": user_id, "year": year})
    rows = result.fetchall()

    # For counts_only users, hide location data
    hide_location = user.privacy_level == 'counts_only'

    species_list = [
        PublicSpeciesEntry(
            common_name=row.common_name,
            scientific_name=row.scientific_name,
            first_observation_date=row.first_obs,
            state_province=None if hide_location else row.state_province
        )
        for row in rows
    ]

    # Add message for counts_only users
    message = "Location data hidden per user privacy settings." if hide_location else None

    return PublicUserSpeciesResponse(
        user_id=user.id,
        user_name=user.name,
        privacy_level=user.privacy_level,
        species_count=species_count,
        species=species_list,
        message=message
    )
