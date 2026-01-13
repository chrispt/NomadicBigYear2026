"""
Feature request and feedback endpoints
"""
from fastapi import APIRouter, HTTPException, status

from schemas import FeatureRequestRequest, FeatureRequestResponse
from auth import send_feature_request_email

router = APIRouter(prefix="/feedback", tags=["feedback"])


@router.post("/feature-request", response_model=FeatureRequestResponse)
async def submit_feature_request(request: FeatureRequestRequest):
    """
    Submit a feature request.
    Sends email to site owner. No login required.
    """
    email_sent = send_feature_request_email(
        suggestion=request.suggestion,
        user_email=request.email
    )

    if not email_sent:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send feature request. Please try again later."
        )

    return FeatureRequestResponse(
        message="Thank you! Your feature request has been submitted."
    )
