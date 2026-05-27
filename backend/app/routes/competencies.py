from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import User, Competency, EmployeeCompetency, RoleEnum
from app.schemas import CompetencyResponse, CompetencyCreate, EmployeeCompetencyResponse, EmployeeCompetencyCreate, EmployeeCompetencyBase
from app.auth import get_current_user, get_current_manager

router = APIRouter(prefix="/api/competencies", tags=["Competencies"])

# ─── Competency Management ───
@router.post("/", response_model=CompetencyResponse, status_code=status.HTTP_201_CREATED)
def create_competency(competency: CompetencyCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Create new competency (any user can create)"""
    existing = db.query(Competency).filter(Competency.name == competency.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Competency already exists")
    
    new_competency = Competency(name=competency.name)
    db.add(new_competency)
    db.commit()
    db.refresh(new_competency)
    return new_competency

@router.get("/", response_model=List[CompetencyResponse])
def list_competencies(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """List all competencies"""
    competencies = db.query(Competency).all()
    return competencies

@router.get("/{competency_id}", response_model=CompetencyResponse)
def get_competency(competency_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get competency by ID"""
    competency = db.query(Competency).filter(Competency.id == competency_id).first()
    if not competency:
        raise HTTPException(status_code=404, detail="Competency not found")
    return competency

# ─── Employee Competency Management ───
@router.post("/employee/{employee_id}", response_model=EmployeeCompetencyResponse, status_code=status.HTTP_201_CREATED)
def add_employee_competency(employee_id: int, competency_data: EmployeeCompetencyBase, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Add competency to employee"""
    # Check authorization
    if current_user.id != employee_id and current_user.role != RoleEnum.MANAGER:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Verify employee exists
    employee = db.query(User).filter(User.id == employee_id, User.is_active == True).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Verify competency exists
    competency = db.query(Competency).filter(Competency.id == competency_data.competency_id).first()
    if not competency:
        raise HTTPException(status_code=404, detail="Competency not found")
    
    # Check if already exists
    existing = db.query(EmployeeCompetency).filter(
        EmployeeCompetency.employee_id == employee_id,
        EmployeeCompetency.competency_id == competency_data.competency_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Employee already has this competency")
    
    new_ec = EmployeeCompetency(
        employee_id=employee_id,
        competency_id=competency_data.competency_id,
        skill_level=competency_data.skill_level,
        years_of_experience=competency_data.years_of_experience
    )
    db.add(new_ec)
    db.commit()
    db.refresh(new_ec)
    return new_ec

@router.get("/employee/{employee_id}", response_model=List[EmployeeCompetencyResponse])
def get_employee_competencies(employee_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get all competencies for an employee"""
    employee = db.query(User).filter(User.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    competencies = db.query(EmployeeCompetency).filter(EmployeeCompetency.employee_id == employee_id).all()
    return competencies

@router.put("/employee/{employee_id}/{competency_id}", response_model=EmployeeCompetencyResponse)
def update_employee_competency(employee_id: int, competency_id: int, update_data: EmployeeCompetencyBase, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Update employee's competency"""
    # Check authorization
    if current_user.id != employee_id and current_user.role != RoleEnum.MANAGER:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    ec = db.query(EmployeeCompetency).filter(
        EmployeeCompetency.employee_id == employee_id,
        EmployeeCompetency.competency_id == competency_id
    ).first()
    if not ec:
        raise HTTPException(status_code=404, detail="Employee competency not found")
    
    ec.skill_level = update_data.skill_level
    ec.years_of_experience = update_data.years_of_experience
    
    db.commit()
    db.refresh(ec)
    return ec

@router.delete("/employee/{employee_id}/{competency_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee_competency(employee_id: int, competency_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Remove competency from employee"""
    # Check authorization
    if current_user.id != employee_id and current_user.role != RoleEnum.MANAGER:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    ec = db.query(EmployeeCompetency).filter(
        EmployeeCompetency.employee_id == employee_id,
        EmployeeCompetency.competency_id == competency_id
    ).first()
    if not ec:
        raise HTTPException(status_code=404, detail="Employee competency not found")
    
    db.delete(ec)
    db.commit()
    return None

@router.get("/competency/{competency_id}/employees", tags=["Competencies"])
def get_employees_with_competency(competency_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get all employees with a specific competency"""
    competency = db.query(Competency).filter(Competency.id == competency_id).first()
    if not competency:
        raise HTTPException(status_code=404, detail="Competency not found")
    
    employee_competencies = db.query(EmployeeCompetency).filter(
        EmployeeCompetency.competency_id == competency_id
    ).all()
    
    return {
        "competency": competency.name,
        "employee_count": len(employee_competencies),
        "employees": employee_competencies
    }
