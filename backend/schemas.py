"""
Pydantic schemas for request/response validation
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import date, datetime

# Authentication schemas
class MagicLinkRequest(BaseModel):
    email: EmailStr

class MagicLinkResponse(BaseModel):
    message: str
    expires_in: int

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    pass

class UserUpdate(BaseModel):
    name: Optional[str] = None
    privacy_level: Optional[str] = Field(None, pattern="^(public|counts_only|private)$")

class UserResponse(UserBase):
    id: int
    privacy_level: str
    created_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserStats(BaseModel):
    species_count: int
    total_observations: int
    states_visited: int
    last_upload: Optional[datetime]

class UserProfileResponse(UserResponse):
    stats: UserStats

# Observation schemas
class ObservationResponse(BaseModel):
    id: int
    common_name: str
    scientific_name: str
    count: str
    state_province: Optional[str]
    county: Optional[str]
    location: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    observation_date: date
    observation_time: Optional[str]

    class Config:
        from_attributes = True

class ObservationListResponse(BaseModel):
    observations: List[ObservationResponse]
    total: int

# CSV Upload schemas
class CSVUploadStats(BaseModel):
    total_rows: int
    imported: int
    duplicates: int
    species_count: int
    date_range: dict

class CSVUploadResponse(BaseModel):
    message: str
    stats: CSVUploadStats

# Leaderboard schemas
class LeaderboardEntry(BaseModel):
    rank: int
    user_id: int
    name: str
    species_count: int
    last_observation_date: Optional[date]
    privacy_level: str

class LeaderboardResponse(BaseModel):
    year: int
    participants: int
    leaderboard: List[LeaderboardEntry]

# Monthly progress schemas
class MonthlyProgress(BaseModel):
    month: str
    species_count: int
    new_species: int

class MonthlyProgressResponse(BaseModel):
    user_id: int
    user_name: str
    monthly_progress: List[MonthlyProgress]

# Geographic stats schemas
class StateStats(BaseModel):
    state: str
    species_count: int
    counties: List[str]

class GeographicStatsResponse(BaseModel):
    states_visited: List[StateStats]

# Species comparison schemas
class UserSummary(BaseModel):
    id: int
    name: str
    species_count: int

class SpeciesInfo(BaseModel):
    common_name: str
    scientific_name: str

class ComparisonStats(BaseModel):
    only_user1: int
    only_user2: int
    shared: int

class SpeciesComparisonResponse(BaseModel):
    user1: UserSummary
    user2: UserSummary
    comparison: ComparisonStats
    species_only_user2: List[SpeciesInfo]

# Public user species list schemas
class PublicSpeciesEntry(BaseModel):
    common_name: str
    scientific_name: str
    first_observation_date: date
    state_province: Optional[str]

class PublicUserSpeciesResponse(BaseModel):
    user_id: int
    user_name: str
    privacy_level: str
    species_count: int
    species: Optional[List[PublicSpeciesEntry]] = None
    message: Optional[str] = None

# Activity feed schemas
class ActivityItem(BaseModel):
    type: str
    user_name: str
    timestamp: datetime
    species_added: Optional[int] = None
    notable_species: Optional[List[str]] = None
    message: Optional[str] = None

class ActivityFeedResponse(BaseModel):
    recent_activity: List[ActivityItem]

# Feature request schemas
class FeatureRequestRequest(BaseModel):
    suggestion: str = Field(..., min_length=10, max_length=2000)
    email: Optional[EmailStr] = None

class FeatureRequestResponse(BaseModel):
    message: str
