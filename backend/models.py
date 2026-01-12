"""
SQLAlchemy ORM Models
"""
from sqlalchemy import Column, Integer, String, Float, Date, Time, DateTime, Boolean, Text, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    privacy_level = Column(String(20), default='public')
    last_login = Column(DateTime(timezone=True))
    magic_link_token = Column(String(255), index=True)
    magic_link_expires = Column(DateTime(timezone=True))

    # Relationships
    observations = relationship("Observation", back_populates="user", cascade="all, delete-orphan")
    monthly_stats = relationship("MonthlyStat", back_populates="user", cascade="all, delete-orphan")
    geographic_stats = relationship("GeographicStat", back_populates="user", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("privacy_level IN ('public', 'counts_only', 'private')", name='check_privacy_level'),
    )


class Observation(Base):
    __tablename__ = "observations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    submission_id = Column(String(50), nullable=False, index=True)
    common_name = Column(String(255), nullable=False)
    scientific_name = Column(String(255), nullable=False, index=True)
    taxonomic_order = Column(Integer)
    count = Column(String(20))
    state_province = Column(String(10), index=True)
    county = Column(String(100))
    location_id = Column(String(50))
    location = Column(Text)
    latitude = Column(Float)
    longitude = Column(Float)
    observation_date = Column(Date, nullable=False, index=True)
    observation_time = Column(Time)
    protocol = Column(String(100))
    duration_min = Column(Integer)
    all_obs_reported = Column(Boolean)
    distance_traveled_km = Column(Float)
    area_covered_ha = Column(Float)
    num_observers = Column(Integer)
    breeding_code = Column(String(50))
    observation_details = Column(Text)
    checklist_comments = Column(Text)
    ml_catalog_numbers = Column(Text)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="observations")

    __table_args__ = (
        # Unique constraint to prevent duplicate observations
        CheckConstraint('1=1', name='unique_observation'),
    )


class MonthlyStat(Base):
    __tablename__ = "monthly_stats"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    year = Column(Integer, nullable=False)
    month = Column(Integer, nullable=False)
    species_count = Column(Integer, nullable=False)
    new_species_count = Column(Integer)
    total_observations = Column(Integer)
    calculated_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="monthly_stats")

    __table_args__ = (
        # Unique constraint for user + year + month
        CheckConstraint('1=1', name='unique_monthly_stat'),
    )


class GeographicStat(Base):
    __tablename__ = "geographic_stats"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    state_province = Column(String(10), nullable=False, index=True)
    county = Column(String(100))
    species_count = Column(Integer, nullable=False)
    first_observation = Column(Date)
    last_observation = Column(Date)

    # Relationships
    user = relationship("User", back_populates="geographic_stats")

    __table_args__ = (
        # Unique constraint for user + state + county
        CheckConstraint('1=1', name='unique_geographic_stat'),
    )
