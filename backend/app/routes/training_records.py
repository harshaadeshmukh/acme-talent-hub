from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_shard1_db, get_shard2_db
from app.models import User, TrainingRecord, RoleEnum
from app.schemas import TrainingRecordResponse, TrainingRecordCreate, TrainingRecordUpdate
from app.database import get_shard1_db, get_shard2_db, get_current_user, get_current_manager

router = APIRouter(prefix="/api/training-records", tags=["Training Records"])

@router.post("/", response_model=TrainingRecordResponse, status_code=status.HTTP_201_CREATED)
def create_training_record(record: TrainingRecordCreate, db: Session = Depends(get_tenant_db), current_user: User = Depends(get_current_user)):
    """Create training record"""
    # Check authorization
    if current_user.id != record.employee_id and current_user.role != RoleEnum.MANAGER:
        raise HTTPException(status_code=403, detail="You can only create records for yourself ")
    
    # Verify employee exists
    employee = db.query(User).filter(User.id == record.employee_id, User.is_active == True).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    new_record = TrainingRecord(
        employee_id=record.employee_id,
        training_name=record.training_name,
        provider=record.provider,
        completion_date=record.completion_date,
        certificate_url=record.certificate_url,
        duration_hours=record.duration_hours
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    return new_record

@router.get("/", response_model=List[TrainingRecordResponse])
def list_training_records(skip: int = 0, limit: int = 100, db: Session = Depends(get_tenant_db), current_user: User = Depends(get_current_user)):
    """List all training records"""
    records = db.query(TrainingRecord).offset(skip).limit(limit).all()
    return records

@router.get("/employee/{employee_id}", response_model=List[TrainingRecordResponse])
def get_employee_training_records(employee_id: int, db: Session = Depends(get_tenant_db), current_user: User = Depends(get_current_user)):
    """Get all training records for an employee"""
    employee = db.query(User).filter(User.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    records = db.query(TrainingRecord).filter(TrainingRecord.employee_id == employee_id).all()
    return records

@router.get("/{record_id}", response_model=TrainingRecordResponse)
def get_training_record(record_id: int, db: Session = Depends(get_tenant_db), current_user: User = Depends(get_current_user)):
    """Get training record by ID"""
    record = db.query(TrainingRecord).filter(TrainingRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Training record not found")
    return record

@router.put("/{record_id}", response_model=TrainingRecordResponse)
def update_training_record(record_id: int, record_update: TrainingRecordUpdate, db: Session = Depends(get_tenant_db), current_user: User = Depends(get_current_user)):
    """Update training record"""
    record = db.query(TrainingRecord).filter(TrainingRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Training record not found")
    
    # Check authorization
    if current_user.id != record.employee_id and current_user.role != RoleEnum.MANAGER:
        raise HTTPException(status_code=403, detail="You can only update your own records")
    
    if record_update.training_name is not None:
        record.training_name = record_update.training_name
    if record_update.provider is not None:
        record.provider = record_update.provider
    if record_update.duration_hours is not None:
        record.duration_hours = record_update.duration_hours
    if record_update.completion_date is not None:
        record.completion_date = record_update.completion_date
    if record_update.certificate_url is not None:
        record.certificate_url = record_update.certificate_url
    
    db.commit()
    db.refresh(record)
    return record

@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_training_record(record_id: int, db: Session = Depends(get_tenant_db), current_user: User = Depends(get_current_user)):
    """Delete training record"""
    record = db.query(TrainingRecord).filter(TrainingRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Training record not found")
    
    # Check authorization
    if current_user.id != record.employee_id and current_user.role != RoleEnum.MANAGER:
        raise HTTPException(status_code=403, detail="You can only delete your own records")
    
    db.delete(record)
    db.commit()
    return None

@router.get("/employee/{employee_id}/completed", response_model=List[TrainingRecordResponse], tags=["Training Records"])
def get_completed_trainings(employee_id: int, db: Session = Depends(get_tenant_db), current_user: User = Depends(get_current_user)):
    """Get completed trainings for an employee"""
    from datetime import datetime
    
    employee = db.query(User).filter(User.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    records = db.query(TrainingRecord).filter(
        TrainingRecord.employee_id == employee_id,
        TrainingRecord.completion_date is not None
    ).all()
    return records

@router.get("/employee/{employee_id}/stats", tags=["Training Records"])
def get_training_stats(employee_id: int, db: Session = Depends(get_tenant_db), current_user: User = Depends(get_current_user)):
    """Get training statistics for an employee"""
    from sqlalchemy import func
    
    employee = db.query(User).filter(User.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    total_trainings = db.query(TrainingRecord).filter(
        TrainingRecord.employee_id == employee_id
    ).count()
    
    completed_trainings = db.query(TrainingRecord).filter(
        TrainingRecord.employee_id == employee_id,
        TrainingRecord.completion_date is not None
    ).count()
    
    total_hours = db.query(func.sum(TrainingRecord.duration_hours)).filter(
        TrainingRecord.employee_id == employee_id,
        TrainingRecord.completion_date is not None
    ).scalar() or 0.0
    
    return {
        "employee_id": employee_id,
        "total_trainings": total_trainings,
        "completed_trainings": completed_trainings,
        "total_hours": float(total_hours)
    }
