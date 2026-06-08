from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
import shutil
import os
import time
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

from app.database import get_shard1_db, get_shard2_db
from app.models import User, RoleEnum, PerformanceReview, TrainingRecord, Goal, EmployeeCompetency, GoalStatusEnum, Department
from app.schemas import UserResponse, UserCreate, UserUpdate
from app.auth import get_current_user, get_current_manager, get_current_manager, get_password_hash

router = APIRouter(prefix="/api/users", tags=["Users"])

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user: UserCreate, db: Session = Depends(get_shard1_db), current_user: User = Depends(get_current_manager)):
    """Create new user (manager only)"""
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = User(
        name=user.name,
        email=user.email,
        password_hash=get_password_hash(user.password),
        role=user.role,
        department=user.department  # Inherit tenant from the creating manager
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.get("/", response_model=List[UserResponse])
def list_users(search: str = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_shard1_db), current_user: User = Depends(get_current_user)):
    """List all users with pagination and search"""
    query = db.query(User).filter(User.is_active == True)
    if search:
        query = query.filter(
            User.name.ilike(f"%{search}%") |
            User.email.ilike(f"%{search}%") |
            User.department.ilike(f"%{search}%")
        )
    return query.offset(skip).limit(limit).all()

@router.get("/unassigned", response_model=List[UserResponse])
def get_unassigned_employees(db: Session = Depends(get_shard1_db), current_user: User = Depends(get_current_manager)):
    """Get all employees without a department"""
    users = db.query(User).filter(
        User.role == RoleEnum.EMPLOYEE,
        User.is_active == True,
        (User.department == None) | (User.department == "")
    ).all()
    return users

@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_shard1_db), current_user: User = Depends(get_current_user)):
    """Get user by ID"""
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.patch("/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user_update: UserUpdate, db: Session = Depends(get_shard1_db), current_user: User = Depends(get_current_user)):
    """Update user (admin or self)"""
    # Check authorization
    if current_user.id != user_id and current_user.role != RoleEnum.MANAGER:
        raise HTTPException(status_code=403, detail="Not authorized to update this user")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update fields if provided
    for field, value in user_update.model_dump(exclude_unset=True).items():
        # Only admin/manager can update roles
        if field == "role" and current_user.role != RoleEnum.MANAGER:
            continue
        setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    return user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_shard1_db), current_user: User = Depends(get_current_user)):
    """Soft delete user"""
    if current_user.role != RoleEnum.MANAGER:
        raise HTTPException(status_code=403, detail="Not authorized")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_active = False
    db.commit()
    return None

@router.get("/department/{department}", response_model=List[UserResponse])
def get_users_by_department(department: str, db: Session = Depends(get_shard1_db), current_user: User = Depends(get_current_user)):
    """Get all users in a department"""
    users = db.query(User).filter(User.department == department, User.is_active == True).all()
    return users

@router.get("/role/{role}", response_model=List[UserResponse])
def get_users_by_role(role: RoleEnum, db: Session = Depends(get_shard1_db), current_user: User = Depends(get_current_user)):
    """Get all users with a specific role"""
    users = db.query(User).filter(User.role == role, User.is_active == True).all()
    return users

@router.post("/{user_id}/upload-profile-pic", response_model=UserResponse)
def upload_profile_pic(user_id: int, file: UploadFile = File(...), db: Session = Depends(get_shard1_db), current_user: User = Depends(get_current_user)):
    """Upload a profile picture for the user"""
    # Check authorization
    if current_user.id != user_id and current_user.role != RoleEnum.MANAGER:
        raise HTTPException(status_code=403, detail="Not authorized to upload for this user")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    import base64
    import mimetypes
    
    # Read the file content
    content = file.file.read()
    
    # Convert to Base64 data URI
    content_type = file.content_type or mimetypes.guess_type(file.filename)[0] or "image/jpeg"
    base64_encoded = base64.b64encode(content).decode("utf-8")
    data_uri = f"data:{content_type};base64,{base64_encoded}"
    
    # Update DB directly with Base64 string so it persists forever
    user.profile_pic_url = data_uri
    db.commit()
    db.refresh(user)
    
    return user

class DepartmentCreate(BaseModel):
    name: str

@router.get("/departments/list")
def get_departments(db: Session = Depends(get_shard1_db), current_user: User = Depends(get_current_user)):
    """Get a list of all unique departments in the system"""
    # Migrate any existing departments from Users table
    existing_user_deps = db.query(User.department).filter(User.department != None, User.department != "").distinct().all()
    for d in existing_user_deps:
        dept_name = d[0].strip()
        if not db.query(Department).filter(Department.name == dept_name).first():
            db.add(Department(name=dept_name))
    db.commit()

    deps = db.query(Department).all()
    if not deps:
        db.add(Department(name="Team General"))
        db.commit()
        deps = db.query(Department).all()

    return sorted([d.name for d in deps])

@router.post("/departments")
def create_department(dept: DepartmentCreate, db: Session = Depends(get_shard1_db), current_user: User = Depends(get_current_manager)):
    name = dept.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Name cannot be empty")
    
    existing = db.query(Department).filter(Department.name == name).first()
    if existing:
        return {"message": "Department already exists"}
        
    new_dept = Department(name=name)
    db.add(new_dept)
    db.commit()
    return {"message": "Department created successfully"}

@router.get("/{user_id}/details")
def get_user_details(user_id: int, db: Session = Depends(get_shard1_db)):
    """Get detailed stats and competencies for a user modal"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    reviews = db.query(PerformanceReview).filter(PerformanceReview.employee_id == user_id).all()
    avg_rating = round(sum(r.rating for r in reviews) / len(reviews), 1) if reviews else None
    
    training = db.query(TrainingRecord).filter(TrainingRecord.employee_id == user_id).all()
    training_hours = sum(t.duration_hours for t in training if t.duration_hours)
    
    active_goals = db.query(Goal).filter(
        Goal.employee_id == user_id, 
        Goal.status.in_([GoalStatusEnum.DRAFT, GoalStatusEnum.SUBMITTED, GoalStatusEnum.APPROVED])
    ).count()
    
    competencies = db.query(EmployeeCompetency).filter(EmployeeCompetency.employee_id == user_id).all()
    skills = [{"name": c.competency.name, "level": c.skill_level} for c in competencies if c.competency]
    
    return {
        "avg_rating": avg_rating,
        "reviews_count": len(reviews),
        "training_hours": int(training_hours) if training_hours == int(training_hours) else round(training_hours, 1),
        "active_goals": active_goals,
        "skills": skills
    }
