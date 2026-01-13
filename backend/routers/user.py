"""
User profile and observation endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, text

from database import get_db
from models import User, Observation, GeographicStat
from schemas import (
    UserProfileResponse,
    UserUpdate,
    UserStats,
    ObservationListResponse,
    ObservationResponse,
    GeographicStatsResponse,
    StateStats
)
from auth import get_current_user

router = APIRouter(prefix="/user", tags=["user"])

@router.get("/me", response_model=UserProfileResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's profile with statistics"""
    # Get stats from species_summary view
    stats_query = text("""
        SELECT species_count, last_upload_date
        FROM species_summary
        WHERE user_id = :user_id
    """)
    result = db.execute(stats_query, {"user_id": current_user.id}).first()

    # Count total observations
    total_obs = db.query(func.count(Observation.id)).filter(
        Observation.user_id == current_user.id,
        func.extract('year', Observation.observation_date) == 2026
    ).scalar()

    # Count states visited
    states_visited = db.query(func.count(func.distinct(GeographicStat.state_province))).filter(
        GeographicStat.user_id == current_user.id
    ).scalar()

    stats = UserStats(
        species_count=result.species_count if result else 0,
        total_observations=total_obs or 0,
        states_visited=states_visited or 0,
        last_upload=result.last_upload_date if result else None
    )

    return UserProfileResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        privacy_level=current_user.privacy_level,
        created_at=current_user.created_at,
        last_login=current_user.last_login,
        stats=stats
    )

@router.patch("/me", response_model=UserProfileResponse)
async def update_current_user_profile(
    update_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user's profile (name, privacy settings)"""
    if update_data.name is not None:
        current_user.name = update_data.name

    if update_data.privacy_level is not None:
        if update_data.privacy_level not in ['public', 'counts_only', 'private']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid privacy level"
            )
        current_user.privacy_level = update_data.privacy_level

    db.commit()
    db.refresh(current_user)

    # Refresh materialized view to update leaderboard with new name/privacy
    # CONCURRENTLY allows reads during refresh (requires unique index)
    try:
        db.execute(text("REFRESH MATERIALIZED VIEW CONCURRENTLY species_summary;"))
        db.commit()
    except Exception as e:
        print(f"Error refreshing species_summary: {e}")

    # Get updated stats
    stats_query = text("""
        SELECT species_count, last_upload_date
        FROM species_summary
        WHERE user_id = :user_id
    """)
    result = db.execute(stats_query, {"user_id": current_user.id}).first()

    total_obs = db.query(func.count(Observation.id)).filter(
        Observation.user_id == current_user.id,
        func.extract('year', Observation.observation_date) == 2026
    ).scalar()

    states_visited = db.query(func.count(func.distinct(GeographicStat.state_province))).filter(
        GeographicStat.user_id == current_user.id
    ).scalar()

    stats = UserStats(
        species_count=result.species_count if result else 0,
        total_observations=total_obs or 0,
        states_visited=states_visited or 0,
        last_upload=result.last_upload_date if result else None
    )

    return UserProfileResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        privacy_level=current_user.privacy_level,
        created_at=current_user.created_at,
        last_login=current_user.last_login,
        stats=stats
    )

@router.get("/me/observations", response_model=ObservationListResponse)
async def get_current_user_observations(
    year: int = Query(2026, description="Year to filter by"),
    state: str = Query(None, description="Optional state filter"),
    limit: int = Query(100, description="Number of results", le=1000),
    offset: int = Query(0, description="Pagination offset", ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's bird observation list"""
    query = db.query(Observation).filter(
        Observation.user_id == current_user.id,
        func.extract('year', Observation.observation_date) == year
    )

    if state:
        query = query.filter(Observation.state_province == state)

    # Get total count
    total = query.count()

    # Get paginated results
    observations = query.order_by(Observation.observation_date.desc()).limit(limit).offset(offset).all()

    obs_list = []
    for obs in observations:
        obs_list.append(ObservationResponse(
            id=obs.id,
            common_name=obs.common_name,
            scientific_name=obs.scientific_name,
            count=obs.count or '',
            state_province=obs.state_province,
            county=obs.county,
            location=obs.location,
            latitude=obs.latitude,
            longitude=obs.longitude,
            observation_date=obs.observation_date,
            observation_time=str(obs.observation_time) if obs.observation_time else None
        ))

    return ObservationListResponse(
        observations=obs_list,
        total=total
    )

@router.get("/me/geographic-stats", response_model=GeographicStatsResponse)
async def get_current_user_geographic_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get states/counties visited by current user"""
    # Group by state and collect counties
    geo_stats = db.query(GeographicStat).filter(
        GeographicStat.user_id == current_user.id
    ).order_by(GeographicStat.state_province).all()

    # Group by state
    states_dict = {}
    for stat in geo_stats:
        state = stat.state_province
        if state not in states_dict:
            states_dict[state] = {
                "species_count": 0,
                "counties": []
            }

        states_dict[state]["species_count"] += stat.species_count
        if stat.county:
            states_dict[state]["counties"].append(stat.county)

    # Format response
    states_visited = []
    for state, data in states_dict.items():
        states_visited.append(StateStats(
            state=state,
            species_count=data["species_count"],
            counties=list(set(data["counties"]))  # Deduplicate counties
        ))

    return GeographicStatsResponse(states_visited=states_visited)
