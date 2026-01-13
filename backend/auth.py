"""
Authentication utilities for magic link login and JWT tokens
"""
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from secrets import token_urlsafe
import os
import resend

from database import get_db
from models import User

# Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30
MAGIC_LINK_EXPIRE_MINUTES = 15

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
RESEND_API_KEY = os.getenv("RESEND_API_KEY")
FROM_EMAIL = os.getenv("FROM_EMAIL", "onboarding@resend.dev")

security = HTTPBearer()

def generate_magic_link_token() -> str:
    """Generate a secure random token for magic links"""
    return token_urlsafe(32)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> dict:
    """Verify and decode JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current user from JWT token"""
    token = credentials.credentials
    payload = verify_token(token)
    user_id: int = payload.get("user_id")

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    return user

def send_magic_link_email(email: str, token: str):
    """Send magic link email via Resend"""
    magic_link = f"{FRONTEND_URL}/auth/verify?token={token}"

    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Welcome to Nomadic Big Year 2026!</h2>
            <p>Click the link below to log in to your account:</p>
            <p>
                <a href="{magic_link}"
                   style="background-color: #4CAF50; color: white; padding: 14px 20px;
                          text-decoration: none; border-radius: 4px; display: inline-block;">
                    Log In to Nomadic Big Year
                </a>
            </p>
            <p style="color: #666; font-size: 14px;">
                This link will expire in {MAGIC_LINK_EXPIRE_MINUTES} minutes.
            </p>
            <p style="color: #666; font-size: 14px;">
                If you didn't request this login link, you can safely ignore this email.
            </p>
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">
                Nomadic Big Year 2026 - Full-time RV Community Birding Competition
            </p>
        </body>
    </html>
    """

    if RESEND_API_KEY:
        try:
            resend.api_key = RESEND_API_KEY
            response = resend.Emails.send({
                "from": FROM_EMAIL,
                "to": [email],
                "subject": "Login to Nomadic Big Year 2026",
                "html": html_content
            })
            print(f"Email sent successfully: {response}")
            return True
        except Exception as e:
            print(f"Error sending email: {e}")
            return False
    else:
        # Development mode: print link to console
        print(f"\n=== MAGIC LINK (DEV MODE) ===")
        print(f"Email: {email}")
        print(f"Link: {magic_link}")
        print(f"Token: {token}")
        print(f"=============================\n")
        return True

def send_feature_request_email(suggestion: str, user_email: Optional[str] = None):
    """Send feature request email to site owner via Resend"""
    owner_email = "chrispohladthomas@gmail.com"

    reply_to_section = ""
    if user_email:
        reply_to_section = f"<p><strong>Reply to:</strong> {user_email}</p>"

    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>New Feature Request</h2>
            {reply_to_section}
            <h3>Suggestion:</h3>
            <p style="background: #f5f5f5; padding: 15px; border-radius: 4px;">
                {suggestion}
            </p>
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">
                Submitted via Nomadic Big Year 2026 Leaderboard
            </p>
        </body>
    </html>
    """

    if RESEND_API_KEY:
        try:
            resend.api_key = RESEND_API_KEY
            email_params = {
                "from": FROM_EMAIL,
                "to": [owner_email],
                "subject": "Nomadic Big Year 2026 Leaderboard Feature Request",
                "html": html_content
            }
            if user_email:
                email_params["reply_to"] = user_email

            response = resend.Emails.send(email_params)
            print(f"Feature request email sent: {response}")
            return True
        except Exception as e:
            print(f"Error sending feature request email: {e}")
            return False
    else:
        # Development mode
        print(f"\n=== FEATURE REQUEST (DEV MODE) ===")
        print(f"To: {owner_email}")
        print(f"Reply-to: {user_email or 'N/A'}")
        print(f"Suggestion: {suggestion}")
        print(f"==================================\n")
        return True


def create_magic_link(email: str, db: Session) -> tuple[User, str]:
    """
    Create or get user and generate magic link token
    Returns (user, token)
    """
    # Get or create user
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Extract name from email (before @)
        default_name = email.split('@')[0].title()
        user = User(email=email, name=default_name)
        db.add(user)
        db.commit()
        db.refresh(user)

    # Generate and store magic link token
    token = generate_magic_link_token()
    user.magic_link_token = token
    user.magic_link_expires = datetime.utcnow() + timedelta(minutes=MAGIC_LINK_EXPIRE_MINUTES)
    db.commit()

    return user, token

def verify_magic_link(token: str, db: Session) -> Optional[User]:
    """Verify magic link token and return user if valid"""
    user = db.query(User).filter(User.magic_link_token == token).first()

    if not user:
        return None

    # Check if token has expired
    if user.magic_link_expires < datetime.utcnow():
        return None

    # Clear token (one-time use)
    user.magic_link_token = None
    user.magic_link_expires = None
    user.last_login = datetime.utcnow()
    db.commit()

    return user
