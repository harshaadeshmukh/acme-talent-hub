from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List

from app.database import get_shard1_db, get_shard2_db
from app.models import User, PerformanceReview, TrainingRecord, EmployeeCompetency, RoleEnum
from app.schemas import EmployeeStats, HighPerformer, SkillGap
from app.database import get_shard1_db, get_shard2_db, get_current_user, get_current_manager

router = APIRouter(prefix="/api/manager-dashboard", tags=["Manager Dashboard"])

@router.get("/stats", response_model=EmployeeStats)
def get_employee_stats(db1: Session = Depends(get_shard1_db), db2: Session = Depends(get_shard2_db), current_user: User = Depends(get_current_user)):
    """Get overall employee statistics"""
    total_employees = db1.query(User).filter(User.role == RoleEnum.EMPLOYEE, User.is_active == True).count()
    active_employees = db1.query(User).filter(User.role == RoleEnum.EMPLOYEE, User.is_active == True).count()
    
    # Calculate averages from DB2
    employee_ratings = db2.query(
        PerformanceReview.employee_id,
        func.avg(PerformanceReview.rating).label('avg_rating')
    ).group_by(PerformanceReview.employee_id).all()
    
    high_performer_ids = [emp[0] for emp in employee_ratings if emp[1] >= 4.0]
    at_risk_ids = [emp[0] for emp in employee_ratings if emp[1] < 2.0]
    
    high_performers = db1.query(User).filter(
        User.id.in_(high_performer_ids) if high_performer_ids else False,
        User.is_active == True
    ).count() if high_performer_ids else 0
    
    at_risk_employees = db1.query(User).filter(
        User.id.in_(at_risk_ids) if at_risk_ids else False,
        User.is_active == True
    ).count() if at_risk_ids else 0
    
    return {
        "total_employees": total_employees,
        "active_employees": active_employees,
        "high_performers": high_performers,
        "at_risk_employees": at_risk_employees
    }

@router.get("/high-performers", response_model=List[HighPerformer])
def get_high_performers(db1: Session = Depends(get_shard1_db), db2: Session = Depends(get_shard2_db), current_user: User = Depends(get_current_user)):
    """Get high-performing employees (average rating >= 4.0)"""
    employee_ratings = db2.query(
        PerformanceReview.employee_id,
        func.avg(PerformanceReview.rating).label('avg_rating')
    ).group_by(PerformanceReview.employee_id).having(func.avg(PerformanceReview.rating) >= 4.0).all()
    
    high_performer_map = {emp[0]: emp[1] for emp in employee_ratings}
    
    if not high_performer_map:
        return []
        
    high_performers = db1.query(
        User.id, User.name, User.email, User.department, User.profile_pic_url
    ).filter(
        User.id.in_(list(high_performer_map.keys())),
        User.is_active == True,
        User.role == RoleEnum.EMPLOYEE
    ).all()
    
    return [
        HighPerformer(
            id=emp.id,
            name=emp.name,
            email=emp.email,
            average_rating=float(high_performer_map[emp.id]),
            department=emp.department,
            avatar_url=emp.profile_pic_url
        )
        for emp in high_performers
    ]

@router.get("/at-risk-employees", response_model=List[dict])
def get_at_risk_employees(db1: Session = Depends(get_shard1_db), db2: Session = Depends(get_shard2_db), current_user: User = Depends(get_current_manager)):
    """Get at-risk employees (average rating < 3.0)"""
    employee_ratings = db2.query(
        PerformanceReview.employee_id,
        func.avg(PerformanceReview.rating).label('avg_rating')
    ).group_by(PerformanceReview.employee_id).having(func.avg(PerformanceReview.rating) < 3.0).all()
    
    at_risk_map = {emp[0]: emp[1] for emp in employee_ratings}
    
    if not at_risk_map:
        return []
        
    at_risk_employees = db1.query(
        User.id, User.name, User.email, User.department, User.profile_pic_url
    ).filter(
        User.id.in_(list(at_risk_map.keys())),
        User.is_active == True,
        User.role == RoleEnum.EMPLOYEE
    ).all()
    
    return [
        {
            "id": emp.id,
            "name": emp.name,
            "email": emp.email,
            "department": emp.department,
            "average_rating": float(at_risk_map[emp.id]),
            "reason": "Low performance rating",
            "avatar_url": emp.profile_pic_url
        }
        for emp in at_risk_employees
    ]

@router.get("/skill-gaps", response_model=List[dict])
def get_skill_gaps(db1: Session = Depends(get_shard1_db), db2: Session = Depends(get_shard2_db), current_user: User = Depends(get_current_user)):
    """Identify critical skill gaps across organization"""
    from app.models import Competency
    
    # Get all competencies
    competencies = db1.query(Competency).all()
    total_employees = db.query(User).filter(User.role == RoleEnum.EMPLOYEE, User.is_active == True).count()
    
    skill_gaps = []
    for competency in competencies:
        employees_with_skill = db1.query(EmployeeCompetency).filter(
            EmployeeCompetency.competency_id == competency.id
        ).count()
        
        missing_count = total_employees - employees_with_skill
        
        if missing_count > 0:
            skill_gaps.append({
                "competency_id": competency.id,
                "competency_name": competency.name,
                "employees_with_skill": employees_with_skill,
                "employees_missing_skill": missing_count,
                "gap_percentage": round((missing_count / total_employees) * 100, 2)
            })
    
    # Sort by gap percentage descending
    skill_gaps.sort(key=lambda x: x['gap_percentage'], reverse=True)
    return skill_gaps

@router.get("/performance-distribution")
def get_performance_distribution(db1: Session = Depends(get_shard1_db), db2: Session = Depends(get_shard2_db), current_user: User = Depends(get_current_user)):
    """Get distribution of performance ratings"""
    ratings_dist = {
        "5_stars": 0,
        "4_stars": 0,
        "3_stars": 0,
        "2_stars": 0,
        "1_stars": 0
    }
    
    reviews = db2.query(PerformanceReview).all()
    
    for review in reviews:
        if review.rating >= 4.5:
            ratings_dist["5_stars"] += 1
        elif review.rating >= 3.5:
            ratings_dist["4_stars"] += 1
        elif review.rating >= 2.5:
            ratings_dist["3_stars"] += 1
        elif review.rating >= 1.5:
            ratings_dist["2_stars"] += 1
        else:
            ratings_dist["1_stars"] += 1
    
    return {
        "total_reviews": len(reviews),
        "distribution": ratings_dist
    }

@router.get("/promotion-ready-employees", response_model=List[dict])
def get_promotion_ready_employees(db1: Session = Depends(get_shard1_db), db2: Session = Depends(get_shard2_db), current_user: User = Depends(get_current_manager)):
    """Get employees ready for promotion (avg rating >= 4.5)"""
    employee_ratings = db2.query(
        PerformanceReview.employee_id,
        func.avg(PerformanceReview.rating).label('avg_rating')
    ).group_by(PerformanceReview.employee_id).having(func.avg(PerformanceReview.rating) >= 4.5).all()
    
    promo_ready_map = {emp[0]: emp[1] for emp in employee_ratings}
    
    if not promo_ready_map:
        return []
        
    promotion_ready = db1.query(
        User.id, User.name, User.email, User.department, User.role
    ).filter(
        User.id.in_(list(promo_ready_map.keys())),
        User.is_active == True,
        User.role == RoleEnum.EMPLOYEE
    ).all()
    
    return [
        {
            "id": emp.id,
            "name": emp.name,
            "email": emp.email,
            "department": emp.department,
            "current_role": emp.role,
            "average_rating": float(promo_ready_map[emp.id]),
            "promotion_score": float(promo_ready_map[emp.id])
        }
        for emp in promotion_ready
    ]

@router.get("/training-completion-rate")
def get_training_completion_rate(db1: Session = Depends(get_shard1_db), db2: Session = Depends(get_shard2_db), current_user: User = Depends(get_current_user)):
    """Get organization-wide training completion rate"""
    total_trainings = db2.query(TrainingRecord).count()
    completed_trainings = db2.query(TrainingRecord).filter(
        TrainingRecord.completion_date is not None
    ).count()
    
    completion_rate = (completed_trainings / total_trainings * 100) if total_trainings > 0 else 0.0
    
    return {
        "total_trainings_assigned": total_trainings,
        "completed_trainings": completed_trainings,
        "completion_rate_percentage": round(completion_rate, 2)
    }

@router.get("/department-performance")
def get_department_performance(db1: Session = Depends(get_shard1_db), db2: Session = Depends(get_shard2_db), current_user: User = Depends(get_current_user)):
    """Get average performance by department"""
    departments = db1.query(User.department).filter(
        User.is_active == True,
        User.role == RoleEnum.EMPLOYEE,
        User.department != None
    ).distinct().all()
    
    dept_performance = []
    for dept in departments:
        dept_name = dept[0]
        emp_ids = [emp[0] for emp in db1.query(User.id).filter(User.department == dept_name, User.is_active == True, User.role == RoleEnum.EMPLOYEE).all()]
        
        if emp_ids:
            avg_rating = db2.query(func.avg(PerformanceReview.rating)).filter(PerformanceReview.employee_id.in_(emp_ids)).scalar()
        else:
            avg_rating = None
            
        if avg_rating:
            dept_performance.append({
                "department": dept_name,
                "average_rating": float(avg_rating),
                "employee_count": len(emp_ids)
            })
    
    return sorted(dept_performance, key=lambda x: x['average_rating'], reverse=True)
