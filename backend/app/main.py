from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
# from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
from datetime import timedelta
from sqlalchemy.orm import Session

from app.database import Base, engine, get_db, settings
from app.models import User, RoleEnum
from app.schemas import UserRegister, UserLogin, Token, UserResponse, OTPVerifyRequest, ForgotPasswordRequest, ResetPasswordRequest
from app.auth import get_password_hash, verify_password, create_access_token, get_current_user
from app.utils.email import send_otp_email
import random
import json
import redis
import time
import asyncio
from datetime import datetime, timedelta

# Redis client setup
class DummyRedis:
    def __init__(self):
        self.data = {}
    def setex(self, key, time, value):
        self.data[key] = value
    def get(self, key):
        return self.data.get(key)
    def delete(self, key):
        if key in self.data:
            del self.data[key]

try:
    redis_url = f"rediss://:{settings.redis_password}@{settings.redis_host}:{settings.redis_port}"
    redis_client = redis.Redis.from_url(redis_url, decode_responses=True)
    redis_client.ping()
except Exception as e:
    print(f"WARNING: Redis not available ({e}), falling back to in-memory storage.")
    redis_client = DummyRedis()

# Create tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="ACME Employee Platform API",
    description="Centralized employee performance and career development management system",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def api_logging_middleware(request: Request, call_next):
    if request.url.path in ["/ws", "/dashboard", "/health", "/favicon.ico"] or request.url.path.startswith("/static"):
        return await call_next(request)
        
    start_time = time.time()
    
    try:
        response = await call_next(request)
        status_code = response.status_code
    except Exception as e:
        status_code = 500
        raise e
    finally:
        process_time = int((time.time() - start_time) * 1000)
        
        role = "emp"
        if "manager" in request.url.path or "/departments" in request.url.path or "competencies" in request.url.path or "roles" in request.url.path or "team" in request.url.path or "talent" in request.url.path:
            role = "mgr"
            
        log_entry = {
            "type": "api_log",
            "method": request.method,
            "url": request.url.path,
            "status": status_code,
            "ms": process_time,
            "headers": dict(request.headers),
            "role_hint": role
        }
        
        asyncio.create_task(manager.broadcast(json.dumps(log_entry)))
        
    return response

# Mount static files
os.makedirs("static/uploads", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

from app.websocket import manager
from fastapi import WebSocket, WebSocketDisconnect

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Health check
@app.get("/", tags=["Health"])
def read_root():
    return {
        "message": "ACME Employee Platform API",
        "status": "running",
        "version": "1.0.0"
    }

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy"}


@app.get("/dashboard", tags=["Health"], include_in_schema=False)
def api_dashboard():
    """ACME API Debug Dashboard"""
    dashboard_path = os.path.join(os.path.dirname(__file__), "..", "acme_dashboard.html")
    return FileResponse(os.path.abspath(dashboard_path), media_type="text/html")


# ─── Authentication Routes ───
@app.post("/auth/register", response_model=UserResponse, tags=["Auth"])
def register(user: UserRegister, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    password_hash = get_password_hash(user.password)
    
    new_user = User(
        name=user.name,
        email=user.email,
        password_hash=password_hash,
        department=user.department,
        role=user.role,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

@app.post("/auth/verify-otp", tags=["Auth"])
def verify_otp(payload: OTPVerifyRequest, db: Session = Depends(get_db)):
    """Verify OTP and activate user account"""
    redis_key = f"otp:{payload.email}"
    redis_data_str = redis_client.get(redis_key)
    
    if not redis_data_str:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP"
        )
        
    redis_data = json.loads(redis_data_str)
    
    if redis_data["otp_code"] != payload.otp_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP"
        )
        
    user = db.query(User).filter(User.email == payload.email).first()
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already registered and active"
        )
        
    # Mark OTP as verified and actually CREATE the user now
    new_user = User(
        name=redis_data["name"],
        email=redis_data["email"],
        password_hash=redis_data["password_hash"],
        department=redis_data["department"],
        role=RoleEnum.EMPLOYEE,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    
    # Cleanup Redis key
    redis_client.delete(redis_key)
    
    return {"message": "Account successfully activated"}

@app.post("/auth/login", response_model=Token, tags=["Auth"])
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Login user and return JWT token"""
    print(f"DEBUG: Login attempt for email: {form_data.username}")
    user = db.query(User).filter(User.email == form_data.username).first()
    
    if not user:
        print(f"DEBUG: Login failed - User not found in DB")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    password_match = verify_password(form_data.password, user.password_hash)
    print(f"DEBUG: Password verification result: {password_match}")
    
    if not password_match:
        print(f"DEBUG: Login failed - Password mismatch")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        print(f"DEBUG: Login failed - Account inactive")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    # Convert sub to string to ensure consistent JWT handling
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role},
        expires_delta=access_token_expires
    )
    print(f"DEBUG: Login successful for {user.email}. Token generated.")
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "role": user.role
    }

@app.post("/auth/forgot-password", tags=["Auth"])
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Send OTP for password reset"""
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        return {"message": "If this email is registered, an OTP has been sent."}
    
    otp_code = str(random.randint(100000, 999999))
    redis_key = f"reset_otp:{payload.email}"
    redis_client.setex(redis_key, 900, otp_code)
    
    send_otp_email(payload.email, otp_code)
    return {"message": "OTP sent to your email"}

@app.post("/auth/reset-password", tags=["Auth"])
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset password using OTP"""
    redis_key = f"reset_otp:{payload.email}"
    stored_otp = redis_client.get(redis_key)
    
    if not stored_otp or stored_otp != payload.otp_code:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.password_hash = get_password_hash(payload.new_password)
    db.commit()
    
    redis_client.delete(redis_key)
    return {"message": "Password successfully reset"}

@app.get("/auth/me", response_model=UserResponse, tags=["Auth"])
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current authenticated user"""
    return current_user

# ─── User Routes ───
@app.get("/api/users", response_model=list[UserResponse], tags=["Users"])
def list_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """List all users (accessible to all authenticated users)"""
    users = db.query(User).filter(User.is_active == True).all()
    return users

@app.get("/api/users/{user_id}", response_model=UserResponse, tags=["Users"])
def get_user(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get user by ID"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# Import and include route modules
from app.routes import users, reviews, competencies, training_records, dashboard, goals, employee_dashboard, achievements, learning, talent_intelligence, chat, timeline

app.include_router(users.router)
app.include_router(reviews.router)
app.include_router(competencies.router)
app.include_router(training_records.router)
app.include_router(dashboard.router)
app.include_router(goals.router)
app.include_router(employee_dashboard.router)
app.include_router(achievements.router)
app.include_router(learning.router, prefix="/api/learning", tags=["Learning & Growth"])
app.include_router(talent_intelligence.router, prefix="/api/talent-intelligence", tags=["Talent Intelligence"])
app.include_router(chat.router)
app.include_router(timeline.router)
