from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import User, DevelopmentPlan, RoleEnum
from app.schemas import DevelopmentPlanResponse, DevelopmentPlanCreate, DevelopmentPlanUpdate
from app.auth import get_current_user, get_current_manager

router = APIRouter(prefix="/api/development-plans", tags=["Development Plans"])

@router.post("/", response_model=DevelopmentPlanResponse, status_code=status.HTTP_201_CREATED)
def create_development_plan(plan: DevelopmentPlanCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Create development plan"""
    # Check authorization
    if current_user.id != plan.employee_id and current_user.role != RoleEnum.MANAGER:
        raise HTTPException(status_code=403, detail="You can only create plans for yourself ")
    
    # Verify employee exists
    employee = db.query(User).filter(User.id == plan.employee_id, User.is_active == True).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    new_plan = DevelopmentPlan(
        employee_id=plan.employee_id,
        goal=plan.goal,
        description=plan.description,
        status=plan.status,
        target_date=plan.target_date,
        progress_percentage=plan.progress_percentage
    )
    db.add(new_plan)
    db.commit()
    db.refresh(new_plan)
    return new_plan

@router.get("/", response_model=List[DevelopmentPlanResponse])
def list_development_plans(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """List all development plans"""
    plans = db.query(DevelopmentPlan).offset(skip).limit(limit).all()
    return plans

@router.get("/employee/{employee_id}", response_model=List[DevelopmentPlanResponse])
def get_employee_plans(employee_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get all development plans for an employee"""
    employee = db.query(User).filter(User.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    plans = db.query(DevelopmentPlan).filter(DevelopmentPlan.employee_id == employee_id).all()
    return plans

@router.get("/{plan_id}", response_model=DevelopmentPlanResponse)
def get_development_plan(plan_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get development plan by ID"""
    plan = db.query(DevelopmentPlan).filter(DevelopmentPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Development plan not found")
    return plan

@router.put("/{plan_id}", response_model=DevelopmentPlanResponse)
def update_development_plan(plan_id: int, plan_update: DevelopmentPlanUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Update development plan"""
    plan = db.query(DevelopmentPlan).filter(DevelopmentPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Development plan not found")
    
    # Check authorization
    if current_user.id != plan.employee_id and current_user.role != RoleEnum.MANAGER:
        raise HTTPException(status_code=403, detail="You can only update your own plans")
    
    if plan_update.goal is not None:
        plan.goal = plan_update.goal
    if plan_update.description is not None:
        plan.description = plan_update.description
    if plan_update.status is not None:
        plan.status = plan_update.status
    if plan_update.target_date is not None:
        plan.target_date = plan_update.target_date
    if plan_update.progress_percentage is not None:
        plan.progress_percentage = plan_update.progress_percentage
    
    db.commit()
    db.refresh(plan)
    return plan

@router.delete("/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_development_plan(plan_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Delete development plan"""
    plan = db.query(DevelopmentPlan).filter(DevelopmentPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Development plan not found")
    
    # Check authorization
    if current_user.id != plan.employee_id and current_user.role != RoleEnum.MANAGER:
        raise HTTPException(status_code=403, detail="You can only delete your own plans")
    
    db.delete(plan)
    db.commit()
    return None

@router.get("/employee/{employee_id}/completed", response_model=List[DevelopmentPlanResponse], tags=["Development Plans"])
def get_completed_plans(employee_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get completed development plans for an employee"""
    from app.models import StatusEnum
    
    employee = db.query(User).filter(User.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    plans = db.query(DevelopmentPlan).filter(
        DevelopmentPlan.employee_id == employee_id,
        DevelopmentPlan.status == StatusEnum.COMPLETED
    ).all()
    return plans
