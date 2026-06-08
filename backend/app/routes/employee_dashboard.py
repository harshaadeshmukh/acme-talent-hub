from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Goal, PerformanceReview, TrainingRecord, GoalStatusEnum, TeamAchievement
from app.auth import get_tenant_db, get_current_user

router = APIRouter(prefix="/api/employee-dashboard", tags=["Employee Dashboard"])

@router.get("/stats")
def get_employee_stats(db: Session = Depends(get_tenant_db), current_user: User = Depends(get_current_user)):
    """Get stats for the employee dashboard"""
    # Active goals: Goals that are approved
    active_goals = db.query(Goal).filter(
        Goal.employee_id == current_user.id,
        Goal.status == GoalStatusEnum.APPROVED
    ).count()

    # Reviews: Total reviews for this employee
    pending_reviews = db.query(PerformanceReview).filter(
        PerformanceReview.employee_id == current_user.id
    ).count()

    # Achievements: Team achievements for the employee's department
    achievements = 0
    if current_user.department:
        achievements = db.query(TeamAchievement).filter(
            TeamAchievement.team_name == current_user.department
        ).count()
    
    # Team Size: count of active employees in the same department
    team_size = 0
    if current_user.department:
        team_size = db.query(User).filter(
            User.department == current_user.department,
            User.is_active == True
        ).count()

    return {
        "team_size": team_size,
        "active_goals": active_goals,
        "pending_reviews": pending_reviews,
        "achievements": achievements
    }
