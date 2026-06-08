from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any
from pydantic import BaseModel

from app.models import User, Competency, EmployeeCompetency, RoleEnum, SkillLevelEnum
from app.schemas import TeamSkillGap, GoalMatchResponse
from app.auth import get_tenant_db, get_current_manager

router = APIRouter()

LEVEL_VALUES = {
    SkillLevelEnum.BEGINNER: 1,
    SkillLevelEnum.INTERMEDIATE: 2,
    SkillLevelEnum.ADVANCED: 3,
    SkillLevelEnum.EXPERT: 4,
    SkillLevelEnum.MASTER: 5
}

class GoalMatchRequest(BaseModel):
    description: str



@router.get("/team-matrix")
def get_team_matrix(db: Session = Depends(get_tenant_db), current_manager: User = Depends(get_current_manager)):
    """Get aggregated skill matrix for all team members (manager's department)"""
    dept = current_manager.department
    
    # Get all employees in department
    if current_manager.role == RoleEnum.MANAGER and dept:
        employees = db.query(User).filter(User.department == dept, User.is_active == True, User.role == RoleEnum.EMPLOYEE).all()
    else:
        # Admin or general manager without dept
        employees = db.query(User).filter(User.is_active == True, User.role == RoleEnum.EMPLOYEE).all()
        
    emp_ids = [e.id for e in employees]
    
    # Get all their competencies
    comps = db.query(EmployeeCompetency).filter(EmployeeCompetency.employee_id.in_(emp_ids)).all()
    
    # Get all unique competencies used by the team
    comp_ids = set(c.competency_id for c in comps)
    all_competencies = db.query(Competency).filter(Competency.id.in_(comp_ids)).all()
    comp_dict = {c.id: c.name for c in all_competencies}
    
    # Build matrix
    matrix = []
    
    for emp in employees:
        emp_skills = {}
        for c in comps:
            if c.employee_id == emp.id:
                emp_skills[c.competency_id] = {
                    "level": c.skill_level,
                    "val": LEVEL_VALUES.get(c.skill_level, 1)
                }
                
        matrix.append({
            "employee_id": emp.id,
            "employee_name": emp.name,
            "avatar_url": emp.profile_pic_url,
            "role": emp.job_title or "Employee",
            "skills": emp_skills
        })
        
    # Calculate column summaries
    summaries = {}
    for comp_id, name in comp_dict.items():
        vals = [m["skills"][comp_id]["val"] for m in matrix if comp_id in m["skills"]]
        summaries[comp_id] = {
            "name": name,
            "count": len(vals),
            "avg": sum(vals) / len(vals) if vals else 0,
            "experts": sum(1 for v in vals if v >= 4), # Expert or Master
            "beginners": sum(1 for v in vals if v == 1)
        }
        
    return {
        "competencies": [{"id": k, "name": v} for k, v in comp_dict.items()],
        "matrix": matrix,
        "summaries": summaries
    }

@router.post("/goal-match", response_model=List[GoalMatchResponse])
def get_goal_match(request: GoalMatchRequest, db: Session = Depends(get_tenant_db), current_manager: User = Depends(get_current_manager)):
    """Recommend employees for a goal based on their skills"""
    description = request.description.lower()
    
    # Get all competencies
    all_comps = db.query(Competency).all()
    
    # Find keywords in description
    matched_comps = []
    for comp in all_comps:
        if comp.name.lower() in description:
            matched_comps.append(comp)
            
    if not matched_comps:
        # Fallback if no exact match - just return top performers or empty
        return []
        
    matched_comp_ids = [c.id for c in matched_comps]
    
    # Get team members
    dept = current_manager.department
    if current_manager.role == RoleEnum.MANAGER and dept:
        employees = db.query(User).filter(User.department == dept, User.is_active == True, User.role == RoleEnum.EMPLOYEE).all()
    else:
        employees = db.query(User).filter(User.is_active == True, User.role == RoleEnum.EMPLOYEE).all()
        
    emp_ids = [e.id for e in employees]
    
    # Find employees with these competencies
    emp_comps = db.query(EmployeeCompetency).filter(
        EmployeeCompetency.employee_id.in_(emp_ids),
        EmployeeCompetency.competency_id.in_(matched_comp_ids)
    ).all()
    
    # Calculate scores
    scores = {}
    for ec in emp_comps:
        emp_id = ec.employee_id
        if emp_id not in scores:
            scores[emp_id] = {
                "score": 0,
                "skills": []
            }
        
        val = LEVEL_VALUES.get(ec.skill_level, 1)
        scores[emp_id]["score"] += val
        scores[emp_id]["skills"].append(ec.competency.name)
        
    # Format response
    results = []
    for emp in employees:
        if emp.id in scores:
            results.append({
                "employee_id": emp.id,
                "employee_name": emp.name,
                "match_score": scores[emp.id]["score"],
                "matching_skills": scores[emp.id]["skills"],
                "avatar_url": emp.profile_pic_url,
                "role": emp.job_title or "Employee"
            })
            
    # Sort by score descending
    results.sort(key=lambda x: x["match_score"], reverse=True)
    
    # Return top 5
    return results[:5]
