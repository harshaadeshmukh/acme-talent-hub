from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.models import Goal, GoalStatusEnum, User
from app.schemas import GoalCreate, GoalFeedback, GoalResponse
from app.auth import get_tenant_db, get_current_user, get_current_manager

router = APIRouter(prefix="/api/goals", tags=["Goals"])

@router.post("/", response_model=GoalResponse, status_code=201)
def create_goal(goal: GoalCreate, db: Session = Depends(get_tenant_db),
                current_user: User = Depends(get_current_user)):
    new_goal = Goal(employee_id=current_user.id, tenant_id=current_user.tenant_id, **goal.model_dump())
    db.add(new_goal)
    db.commit()
    db.refresh(new_goal)
    return new_goal

@router.get("/pending", response_model=List[GoalResponse])
def get_pending_goals(db: Session = Depends(get_tenant_db),
                      current_user: User = Depends(get_current_manager)):
    return db.query(Goal).filter(Goal.status == GoalStatusEnum.SUBMITTED).all()

@router.get("/", response_model=List[GoalResponse])
def list_goals(status: Optional[str] = None, db: Session = Depends(get_tenant_db),
               current_user: User = Depends(get_current_user)):
    query = db.query(Goal)
    if status:
        query = query.filter(Goal.status == status)
    return query.all()

@router.get("/employee/{employee_id}", response_model=List[GoalResponse])
def get_employee_goals(employee_id: int, db: Session = Depends(get_tenant_db),
                       current_user: User = Depends(get_current_user)):
    return db.query(Goal).filter(Goal.employee_id == employee_id).all()

@router.patch("/{goal_id}/submit", response_model=GoalResponse)
def submit_goal(goal_id: int, db: Session = Depends(get_tenant_db),
                current_user: User = Depends(get_current_user)):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.employee_id == current_user.id).first()
    if not goal: raise HTTPException(status_code=404, detail="Goal not found")
    goal.status = GoalStatusEnum.SUBMITTED
    db.commit()
    db.refresh(goal)
    return goal

@router.patch("/{goal_id}/approve", response_model=GoalResponse)
def approve_goal(goal_id: int, payload: GoalFeedback, db: Session = Depends(get_tenant_db),
                 current_user: User = Depends(get_current_manager)):
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal: raise HTTPException(status_code=404, detail="Goal not found")
    goal.status = GoalStatusEnum.APPROVED
    goal.manager_feedback = payload.manager_feedback
    db.commit()
    db.refresh(goal)
    return goal

@router.patch("/{goal_id}/reject", response_model=GoalResponse)
def reject_goal(goal_id: int, payload: GoalFeedback, db: Session = Depends(get_tenant_db),
                current_user: User = Depends(get_current_manager)):
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal: raise HTTPException(status_code=404, detail="Goal not found")
    if not payload.manager_feedback:
        raise HTTPException(status_code=400, detail="Feedback is required when rejecting a goal")
    goal.status = GoalStatusEnum.REJECTED
    goal.manager_feedback = payload.manager_feedback
    db.commit()
    db.refresh(goal)
    return goal
