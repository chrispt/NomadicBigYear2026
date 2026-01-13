"""
CSV upload endpoints
"""
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.orm import Session
import os
import tempfile

from database import get_db
from models import User
from schemas import CSVUploadResponse, CSVUploadStats
from auth import get_current_user
from csv_parser import parse_ebird_csv

router = APIRouter(prefix="/upload", tags=["upload"])

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

@router.post("/csv", response_model=CSVUploadResponse)
async def upload_csv(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload eBird CSV file.
    Parses observations and imports to database.
    Only 2026 observations are imported.
    """
    # Validate file type
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be a CSV file"
        )

    # Read file content
    contents = await file.read()

    # Check file size
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum of {MAX_FILE_SIZE / 1024 / 1024}MB"
        )

    # Save to temporary file
    with tempfile.NamedTemporaryFile(mode='wb', delete=False, suffix='.csv') as temp_file:
        temp_file.write(contents)
        temp_file_path = temp_file.name

    try:
        # Parse CSV and import observations
        stats = parse_ebird_csv(temp_file_path, current_user.id, db, target_year=2026)

        return CSVUploadResponse(
            message="CSV processed successfully",
            stats=CSVUploadStats(**stats)
        )

    except ValueError as e:
        # ValueError is user-facing (missing columns, parse errors)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        # Log full error server-side, return generic message to client
        print(f"CSV processing error for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error processing CSV file. Please ensure the file is a valid eBird export."
        )
    finally:
        # Clean up temporary file
        if os.path.exists(temp_file_path):
            os.unlink(temp_file_path)
