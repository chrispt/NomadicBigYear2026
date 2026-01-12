"""
Authentication endpoints for magic link login
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from schemas import (
    MagicLinkRequest,
    MagicLinkResponse,
    TokenResponse,
    UserResponse
)
from auth import (
    create_magic_link,
    verify_magic_link,
    send_magic_link_email,
    create_access_token,
    MAGIC_LINK_EXPIRE_MINUTES
)

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/request-magic-link", response_model=MagicLinkResponse)
async def request_magic_link(
    request: MagicLinkRequest,
    db: Session = Depends(get_db)
):
    """
    Request a magic link login email.
    Creates user if email doesn't exist.
    """
    user, token = create_magic_link(request.email, db)

    # Send email with magic link
    send_magic_link_email(request.email, token)

    return MagicLinkResponse(
        message="Magic link sent to email",
        expires_in=MAGIC_LINK_EXPIRE_MINUTES * 60
    )

@router.get("/verify", response_model=TokenResponse)
async def verify_magic_link_token(
    token: str,
    db: Session = Depends(get_db)
):
    """
    Verify magic link token and return JWT access token.
    Token is single-use and expires after verification.
    """
    user = verify_magic_link(token, db)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired magic link token"
        )

    # Create JWT access token
    access_token = create_access_token(data={"user_id": user.id, "email": user.email})

    return TokenResponse(
        access_token=access_token,
        user=UserResponse.from_orm(user)
    )

@router.post("/logout")
async def logout():
    """
    Logout endpoint (mainly for client-side JWT deletion).
    No server-side action needed for JWT invalidation.
    """
    return {"message": "Logged out successfully"}
