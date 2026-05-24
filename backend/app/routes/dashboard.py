from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List

from app.database import get_db
from app.models import User, PerformanceReview, DevelopmentPlan, TrainingRecord, EmployeeCompetency, RoleEnum
from app.schemas import EmployeeStats, HighPerformer, SkillGap
from app.auth import get_current_user, get_current_manager

router = APIRouter(prefix="/api/manager-dashboard", tags=["Manager Dashboard"])

@router.get("/stats", response_model=EmployeeStats)
def get_employee_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get overall employee statistics"""
    total_employees = db.query(User).filter(User.role == RoleEnum.EMPLOYEE, User.is_active == True).count()
    active_employees = db.query(User).filter(User.role == RoleEnum.EMPLOYEE, User.is_active == True).count()
    
    # High performers: average rating >= 4.0
    high_performers_subquery = db.query(User.id).join(
        PerformanceReview, User.id == PerformanceReview.employee_id
    ).group_by(User.id).having(func.avg(PerformanceReview.rating) >= 4.0)
    
    high_performers = db.query(User).filter(
        User.id.in_(high_performers_subquery),
        User.is_active == True
    ).count()
    
    # At-risk employees: average rating < 2.0
    at_risk_subquery = db.query(User.id).join(
        PerformanceReview, User.id == PerformanceReview.employee_id
    ).group_by(User.id).having(func.avg(PerformanceReview.rating) < 2.0)
    
    at_risk_employees = db.query(User).filter(
        User.id.in_(at_risk_subquery),
        User.is_active == True
    ).count()
    
    return {
        "total_employees": total_employees,
        "active_employees": active_employees,
        "high_performers": high_performers,
        "at_risk_employees": at_risk_employees
    }

@router.get("/high-performers", response_model=List[HighPerformer])
def get_high_performers(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get high-performing employees (average rating >= 4.0)"""
    high_performers = db.query(
        User.id,
        User.name,
        User.email,
        User.department,
        func.avg(PerformanceReview.rating).label('avg_rating'),
        User.profile_pic_url
    ).join(
        PerformanceReview, User.id == PerformanceReview.employee_id
    ).filter(
        User.is_active == True,
        User.role == RoleEnum.EMPLOYEE
    ).group_by(User.id, User.name, User.email, User.department, User.profile_pic_url).having(
        func.avg(PerformanceReview.rating) >= 4.0
    ).all()
    
    return [
        HighPerformer(
            id=emp[0],
            name=emp[1],
            email=emp[2],
            average_rating=float(emp[4]) if emp[4] else 0.0,
            department=emp[3],
            avatar_url=emp[5]
        )
        for emp in high_performers
    ]

@router.get("/at-risk-employees", response_model=List[dict])
def get_at_risk_employees(db: Session = Depends(get_db), current_user: User = Depends(get_current_manager)):
    """Get at-risk employees (average rating < 2.0 or no reviews in last 6 months)"""
    from datetime import datetime, timedelta
    
    # Employees with low ratings
    at_risk_low_rating = db.query(
        User.id,
        User.name,
        User.email,
        User.department,
        func.avg(PerformanceReview.rating).label('avg_rating'),
        User.profile_pic_url
    ).join(
        PerformanceReview, User.id == PerformanceReview.employee_id
    ).filter(
        User.is_active == True,
        User.role == RoleEnum.EMPLOYEE
    ).group_by(User.id, User.name, User.email, User.department, User.profile_pic_url).having(
        func.avg(PerformanceReview.rating) < 3.0
    ).all()
    
    result = [
        {
            "id": emp[0],
            "name": emp[1],
            "email": emp[2],
            "department": emp[3],
            "average_rating": float(emp[4]) if emp[4] else 0.0,
            "reason": "Low performance rating",
            "avatar_url": emp[5]
        }
        for emp in at_risk_low_rating
    ]
    
    return result

@router.get("/skill-gaps", response_model=List[dict])
def get_skill_gaps(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Identify critical skill gaps across organization"""
    from app.models import Competency
    
    # Get all competencies
    competencies = db.query(Competency).all()
    total_employees = db.query(User).filter(User.role == RoleEnum.EMPLOYEE, User.is_active == True).count()
    
    skill_gaps = []
    for competency in competencies:
        employees_with_skill = db.query(EmployeeCompetency).filter(
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
def get_performance_distribution(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get distribution of performance ratings"""
    ratings_dist = {
        "5_stars": 0,
        "4_stars": 0,
        "3_stars": 0,
        "2_stars": 0,
        "1_stars": 0
    }
    
    reviews = db.query(PerformanceReview).all()
    
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
def get_promotion_ready_employees(db: Session = Depends(get_db), current_user: User = Depends(get_current_manager)):
    """Get employees ready for promotion (avg rating >= 4.5 and completed development plans)"""
    promotion_ready = db.query(
        User.id,
        User.name,
        User.email,
        User.department,
        User.role,
        func.avg(PerformanceReview.rating).label('avg_rating'),
        func.count(DevelopmentPlan.id).label('completed_plans')
    ).join(
        PerformanceReview, User.id == PerformanceReview.employee_id, isouter=True
    ).join(
        DevelopmentPlan, and_(User.id == DevelopmentPlan.employee_id, DevelopmentPlan.status == 'completed'), isouter=True
    ).filter(
        User.is_active == True,
        User.role == RoleEnum.EMPLOYEE
    ).group_by(User.id, User.name, User.email, User.department, User.role).having(
        func.avg(PerformanceReview.rating) >= 4.5
    ).all()
    
    return [
        {
            "id": emp[0],
            "name": emp[1],
            "email": emp[2],
            "department": emp[3],
            "current_role": emp[4],
            "average_rating": float(emp[5]) if emp[5] else 0.0,
            "completed_development_plans": emp[6] if emp[6] else 0,
            "promotion_score": (float(emp[5]) if emp[5] else 0.0) * 0.7 + (emp[6] if emp[6] else 0) * 0.3
        }
        for emp in promotion_ready
    ]

@router.get("/training-completion-rate")
def get_training_completion_rate(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get organization-wide training completion rate"""
    total_trainings = db.query(TrainingRecord).count()
    completed_trainings = db.query(TrainingRecord).filter(
        TrainingRecord.completion_date is not None
    ).count()
    
    completion_rate = (completed_trainings / total_trainings * 100) if total_trainings > 0 else 0.0
    
    return {
        "total_trainings_assigned": total_trainings,
        "completed_trainings": completed_trainings,
        "completion_rate_percentage": round(completion_rate, 2)
    }

@router.get("/department-performance")
def get_department_performance(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get average performance by department"""
    departments = db.query(User.department).filter(
        User.is_active == True,
        User.role == RoleEnum.EMPLOYEE,
        User.department is not None
    ).distinct().all()
    
    dept_performance = []
    for dept in departments:
        dept_name = dept[0]
        avg_rating = db.query(func.avg(PerformanceReview.rating)).join(
            User, PerformanceReview.employee_id == User.id
        ).filter(
            User.department == dept_name,
            User.is_active == True
        ).scalar()
        
        employee_count = db.query(User).filter(
            User.department == dept_name,
            User.is_active == True,
            User.role == RoleEnum.EMPLOYEE
        ).count()
        
        if avg_rating:
            dept_performance.append({
                "department": dept_name,
                "average_rating": float(avg_rating),
                "employee_count": employee_count
            })
    
    return sorted(dept_performance, key=lambda x: x['average_rating'], reverse=True)
