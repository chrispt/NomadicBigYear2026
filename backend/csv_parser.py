"""
eBird CSV parsing and import logic
"""
from datetime import datetime
from typing import Dict
import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from sqlalchemy import text
from models import Observation

def parse_time(time_str: str):
    """Parse eBird time format '02:33 PM' to Python time object"""
    if not time_str or pd.isna(time_str):
        return None
    try:
        return datetime.strptime(str(time_str), '%I:%M %p').time()
    except:
        return None

def parse_ebird_csv(file_path: str, user_id: int, db_session: Session, target_year: int = 2026) -> Dict:
    """
    Parse eBird CSV and import observations to database.

    Args:
        file_path: Path to CSV file
        user_id: User ID who uploaded the file
        db_session: Database session
        target_year: Year to filter observations (default: 2026)

    Returns:
        Dictionary with import statistics
    """
    stats = {
        "total_rows": 0,
        "imported": 0,
        "duplicates": 0,
        "errors": 0,
        "species_count": 0,
        "date_range": {"earliest": None, "latest": None}
    }

    # Read CSV with pandas
    try:
        df = pd.read_csv(file_path, encoding='utf-8')
    except Exception as e:
        raise ValueError(f"Failed to read CSV file: {e}")

    # Validate required columns
    required_columns = [
        "Submission ID", "Common Name", "Scientific Name",
        "Date", "State/Province"
    ]
    missing = set(required_columns) - set(df.columns)
    if missing:
        raise ValueError(f"Missing required columns: {', '.join(missing)}")

    stats["total_rows"] = len(df)

    # Parse date column
    try:
        df['Date'] = pd.to_datetime(df['Date'])
    except Exception as e:
        raise ValueError(f"Failed to parse dates: {e}")

    # Filter to target year observations only
    df_filtered = df[df['Date'].dt.year == target_year].copy()

    if len(df_filtered) == 0:
        return stats  # No observations for target year

    # Track unique species
    species_set = set()

    for idx, row in df_filtered.iterrows():
        try:
            # Parse observation data
            obs = Observation(
                user_id=user_id,
                submission_id=str(row['Submission ID']).strip(),
                common_name=str(row['Common Name']).strip(),
                scientific_name=str(row['Scientific Name']).strip(),
                taxonomic_order=int(row['Taxonomic Order']) if pd.notna(row.get('Taxonomic Order')) else None,
                count=str(row.get('Count', '')) if pd.notna(row.get('Count')) else None,
                state_province=str(row.get('State/Province', '')).strip() if pd.notna(row.get('State/Province')) else None,
                county=str(row.get('County', '')).strip() if pd.notna(row.get('County')) else None,
                location_id=str(row.get('Location ID', '')).strip() if pd.notna(row.get('Location ID')) else None,
                location=str(row.get('Location', '')).strip() if pd.notna(row.get('Location')) else None,
                latitude=float(row['Latitude']) if pd.notna(row.get('Latitude')) else None,
                longitude=float(row['Longitude']) if pd.notna(row.get('Longitude')) else None,
                observation_date=row['Date'].date(),
                observation_time=parse_time(row.get('Time')),
                protocol=str(row.get('Protocol', '')).strip() if pd.notna(row.get('Protocol')) else None,
                duration_min=int(row['Duration (Min)']) if pd.notna(row.get('Duration (Min)')) else None,
                all_obs_reported=bool(row.get('All Obs Reported', False)) if pd.notna(row.get('All Obs Reported')) else False,
                distance_traveled_km=float(row['Distance Traveled (km)']) if pd.notna(row.get('Distance Traveled (km)')) else None,
                area_covered_ha=float(row['Area Covered (ha)']) if pd.notna(row.get('Area Covered (ha)')) else None,
                num_observers=int(row['Number of Observers']) if pd.notna(row.get('Number of Observers')) else None,
                breeding_code=str(row.get('Breeding Code', '')).strip() if pd.notna(row.get('Breeding Code')) else None,
                observation_details=str(row.get('Observation Details', '')).strip() if pd.notna(row.get('Observation Details')) else None,
                checklist_comments=str(row.get('Checklist Comments', '')).strip() if pd.notna(row.get('Checklist Comments')) else None,
                ml_catalog_numbers=str(row.get('ML Catalog Numbers', '')).strip() if pd.notna(row.get('ML Catalog Numbers')) else None
            )

            # Insert (skip if duplicate due to UNIQUE constraint)
            db_session.add(obs)
            db_session.commit()

            stats["imported"] += 1
            species_set.add(row['Scientific Name'])

            # Track date range
            if not stats["date_range"]["earliest"] or row['Date'] < stats["date_range"]["earliest"]:
                stats["date_range"]["earliest"] = row['Date'].strftime('%Y-%m-%d')
            if not stats["date_range"]["latest"] or row['Date'] > stats["date_range"]["latest"]:
                stats["date_range"]["latest"] = row['Date'].strftime('%Y-%m-%d')

        except IntegrityError:
            # Duplicate observation (UNIQUE constraint violation)
            db_session.rollback()
            stats["duplicates"] += 1
        except Exception as e:
            db_session.rollback()
            stats["errors"] += 1
            print(f"Error parsing row {idx}: {e}")

    stats["species_count"] = len(species_set)

    # Refresh materialized views and recalculate stats
    try:
        db_session.execute(text("SELECT refresh_species_summary();"))
        db_session.execute(text(f"SELECT calculate_monthly_stats({user_id}, {target_year});"))
        db_session.execute(text(f"SELECT calculate_geographic_stats({user_id});"))
        db_session.commit()
    except Exception as e:
        print(f"Error refreshing views: {e}")

    return stats
