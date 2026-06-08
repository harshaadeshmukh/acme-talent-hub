from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.auth import get_current_user
from app.database import get_shard1_db, get_shard2_db
from app.models.models import User, TrainingRecord, Goal, VerificationStatusEnum, RoleEnum, GoalStatusEnum
from app.schemas.schemas import (
    TrainingRecordCreate, TrainingRecordResponse, CertificateVerifyRequest,
    GoalCreate, GoalResponse, GoalProgressUpdate, GoalFeedback
)

router = APIRouter()

# ───────────────────────────────────────────────────────────────────────────
# CERTIFICATES (TrainingRecords)
# ───────────────────────────────────────────────────────────────────────────

@router.get("/certificates", response_model=List[TrainingRecordResponse])
def get_certificates(db: Session = Depends(get_shard2_db), current_user: User = Depends(get_current_user)):
    if current_user.role == RoleEnum.MANAGER:
        # Get team's certificates
        users = db.query(User).filter(User.department == current_user.department).all()
        user_ids = [u.id for u in users]
        return db.query(TrainingRecord).filter(TrainingRecord.employee_id.in_(user_ids)).order_by(TrainingRecord.created_at.desc()).all()
    else:
        return db.query(TrainingRecord).filter(TrainingRecord.employee_id == current_user.id).order_by(TrainingRecord.created_at.desc()).all()

@router.post("/certificates", response_model=TrainingRecordResponse)
def create_certificate(cert: TrainingRecordCreate, db: Session = Depends(get_shard2_db), current_user: User = Depends(get_current_user)):
    db_cert = TrainingRecord(**cert.dict(), employee_id=current_user.id)
    db.add(db_cert)
    db.commit()
    db.refresh(db_cert)
    return db_cert

@router.put("/certificates/{cert_id}/verify", response_model=TrainingRecordResponse)
def verify_certificate(cert_id: int, verify_data: CertificateVerifyRequest, db: Session = Depends(get_shard2_db), current_user: User = Depends(get_current_user)):
    if current_user.role != RoleEnum.MANAGER:
        raise HTTPException(status_code=403, detail="Only managers can verify certificates")
        
    db_cert = db.query(TrainingRecord).filter(TrainingRecord.id == cert_id).first()
    if not db_cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
        
    db_cert.verification_status = verify_data.verification_status
    db_cert.rejection_reason = verify_data.rejection_reason
    db_cert.verified_by_id = current_user.id
    db.commit()
    db.refresh(db_cert)
    return db_cert

@router.put("/certificates/{cert_id}", response_model=TrainingRecordResponse)
def update_certificate(cert_id: int, cert_data: TrainingRecordCreate, db: Session = Depends(get_shard2_db), current_user: User = Depends(get_current_user)):
    db_cert = db.query(TrainingRecord).filter(TrainingRecord.id == cert_id).first()
    if not db_cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
        
    if db_cert.employee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    db_cert.training_name = cert_data.training_name
    db_cert.provider = cert_data.provider
    db_cert.category = cert_data.category
    db_cert.duration_hours = cert_data.duration_hours
    db_cert.completion_date = cert_data.completion_date
    db_cert.certificate_url = cert_data.certificate_url
    
    # Reset verification status if edited
    db_cert.verification_status = VerificationStatusEnum.PENDING
    db_cert.rejection_reason = None
    
    db.commit()
    db.refresh(db_cert)
    return db_cert

@router.delete("/certificates/{cert_id}")
def delete_certificate(cert_id: int, db: Session = Depends(get_shard2_db), current_user: User = Depends(get_current_user)):
    db_cert = db.query(TrainingRecord).filter(TrainingRecord.id == cert_id).first()
    if not db_cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
        
    if db_cert.employee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    db.delete(db_cert)
    db.commit()
    return {"detail": "Deleted successfully"}

# ───────────────────────────────────────────────────────────────────────────
# GOALS
# ───────────────────────────────────────────────────────────────────────────

@router.get("/goals", response_model=List[GoalResponse])
def get_goals(db: Session = Depends(get_shard2_db), current_user: User = Depends(get_current_user)):
    if current_user.role == RoleEnum.MANAGER:
        users = db.query(User).filter(User.department == current_user.department).all()
        user_ids = [u.id for u in users]
        return db.query(Goal).filter(Goal.employee_id.in_(user_ids)).order_by(Goal.created_at.desc()).all()
    else:
        return db.query(Goal).filter(Goal.employee_id == current_user.id).order_by(Goal.created_at.desc()).all()

@router.post("/goals", response_model=GoalResponse)
def create_goal(goal: GoalCreate, db: Session = Depends(get_shard2_db), current_user: User = Depends(get_current_user)):
    db_goal = Goal(**goal.dict(), employee_id=current_user.id)
    db.add(db_goal)
    db.commit()
    db.refresh(db_goal)
    return db_goal

@router.put("/goals/{goal_id}", response_model=GoalResponse)
def update_goal(goal_id: int, goal_data: GoalCreate, db: Session = Depends(get_shard2_db), current_user: User = Depends(get_current_user)):
    db_goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not db_goal:
        raise HTTPException(status_code=404, detail="Goal not found")
        
    if db_goal.employee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    db_goal.title = goal_data.title
    db_goal.description = goal_data.description
    db_goal.category = goal_data.category
    db_goal.quarter = goal_data.quarter
    if goal_data.progress_percentage is not None:
        db_goal.progress_percentage = goal_data.progress_percentage
        if db_goal.progress_percentage == 100 and db_goal.status != GoalStatusEnum.APPROVED:
            db_goal.status = GoalStatusEnum.SUBMITTED
        elif db_goal.progress_percentage < 100:
            db_goal.status = GoalStatusEnum.DRAFT
            db_goal.is_endorsed = False
    
    db.commit()
    db.refresh(db_goal)
    return db_goal

@router.put("/goals/{goal_id}/progress", response_model=GoalResponse)
def update_goal_progress(goal_id: int, progress: GoalProgressUpdate, db: Session = Depends(get_shard2_db), current_user: User = Depends(get_current_user)):
    db_goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not db_goal:
        raise HTTPException(status_code=404, detail="Goal not found")
        
    if db_goal.employee_id != current_user.id and current_user.role != RoleEnum.MANAGER:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    db_goal.progress_percentage = progress.progress_percentage
    if db_goal.progress_percentage == 100 and db_goal.status != GoalStatusEnum.APPROVED:
        db_goal.status = GoalStatusEnum.SUBMITTED
    elif db_goal.progress_percentage < 100:
        db_goal.is_endorsed = False
        db_goal.status = GoalStatusEnum.DRAFT
    else:
        valid_statuses = [e.value for e in GoalStatusEnum]
        if progress.status in valid_statuses:
            db_goal.status = progress.status

    db.commit()
    db.refresh(db_goal)
    return db_goal

@router.put("/goals/{goal_id}/feedback", response_model=GoalResponse)
def add_goal_feedback(goal_id: int, feedback: GoalFeedback, db: Session = Depends(get_shard2_db), current_user: User = Depends(get_current_user)):
    if current_user.role != RoleEnum.MANAGER:
        raise HTTPException(status_code=403, detail="Only managers can add feedback")
        
    db_goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not db_goal:
        raise HTTPException(status_code=404, detail="Goal not found")
        
    if feedback.manager_feedback is not None:
        db_goal.manager_feedback = feedback.manager_feedback
        
    if feedback.is_endorsed is not None:
        if feedback.is_endorsed and db_goal.progress_percentage < 100:
            db_goal.is_endorsed = False
        else:
            db_goal.is_endorsed = feedback.is_endorsed
            
    # Always enforce status based on progress and endorsement
    if db_goal.progress_percentage < 100:
        db_goal.status = GoalStatusEnum.DRAFT
        db_goal.is_endorsed = False
    elif db_goal.is_endorsed:
        db_goal.status = GoalStatusEnum.APPROVED
    else:
        db_goal.status = GoalStatusEnum.SUBMITTED
        
    db.commit()
    db.refresh(db_goal)
    return db_goal
