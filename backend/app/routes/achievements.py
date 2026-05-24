from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import TeamAchievement
from app.schemas.schemas import AchievementCreate, AchievementResponse
from app.auth import get_current_user, get_current_manager

router = APIRouter(prefix="/api/achievements", tags=["Achievements"])

@router.post("/", response_model=AchievementResponse, status_code=status.HTTP_201_CREATED)
def create_achievement(achievement: AchievementCreate, db: Session = Depends(get_db), current_user = Depends(get_current_manager)):
    """Create a new team achievement (manager only)"""
    new_achievement = TeamAchievement(
        team_name=achievement.team_name,
        title=achievement.title,
        description=achievement.description,
        type=achievement.type
    )
    db.add(new_achievement)
    db.commit()
    db.refresh(new_achievement)
    return new_achievement

@router.get("/{team_name}", response_model=List[AchievementResponse])
def get_team_achievements(team_name: str, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Get all achievements for a specific team"""
    achievements = db.query(TeamAchievement).filter(TeamAchievement.team_name == team_name).order_by(TeamAchievement.date_awarded.desc()).all()
    return achievements
