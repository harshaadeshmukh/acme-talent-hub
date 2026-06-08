import os
import re

path = 'app/routes/dashboard.py'
with open(path, 'r') as f:
    code = f.read()

# get_high_performers
code = re.sub(
r'@router\.get\(\"/high-performers\", response_model=List\[HighPerformer\]\)\ndef get_high_performers\(db1: Session = Depends\(get_shard1_db\), db2: Session = Depends\(get_shard2_db\), current_user: User = Depends\(get_current_user\)\):\n.*?return \[\n.*?for emp in high_performers\n    \]',
r'''@router.get("/high-performers", response_model=List[HighPerformer])
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
    ]''', code, flags=re.DOTALL)

# get_at_risk_employees
code = re.sub(
r'@router\.get\(\"/at-risk-employees\", response_model=List\[dict\]\)\ndef get_at_risk_employees\(db1: Session = Depends\(get_shard1_db\), db2: Session = Depends\(get_shard2_db\), current_user: User = Depends\(get_current_manager\)\):\n.*?return result',
r'''@router.get("/at-risk-employees", response_model=List[dict])
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
    ]''', code, flags=re.DOTALL)

# get_promotion_ready_employees
code = re.sub(
r'@router\.get\(\"/promotion-ready-employees\", response_model=List\[dict\]\)\ndef get_promotion_ready_employees\(db1: Session = Depends\(get_shard1_db\), db2: Session = Depends\(get_shard2_db\), current_user: User = Depends\(get_current_manager\)\):\n.*?for emp in promotion_ready\n    \]',
r'''@router.get("/promotion-ready-employees", response_model=List[dict])
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
    ]''', code, flags=re.DOTALL)

# get_department_performance
code = re.sub(
r'@router\.get\(\"/department-performance\"\)\ndef get_department_performance\(db1: Session = Depends\(get_shard1_db\), db2: Session = Depends\(get_shard2_db\), current_user: User = Depends\(get_current_user\)\):\n.*?return sorted\(dept_performance, key=lambda x: x\[\'average_rating\'\], reverse=True\)',
r'''@router.get("/department-performance")
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
    
    return sorted(dept_performance, key=lambda x: x['average_rating'], reverse=True)''', code, flags=re.DOTALL)


# get_skill_gaps uses EmployeeCompetency which is in DB1, Competency which is in DB1.
code = code.replace('db2.query(Competency)', 'db1.query(Competency)')
code = code.replace('db2.query(EmployeeCompetency)', 'db1.query(EmployeeCompetency)')
code = code.replace('db.query(Competency)', 'db1.query(Competency)')
code = code.replace('db.query(EmployeeCompetency)', 'db1.query(EmployeeCompetency)')

# get_training_completion_rate uses db2
code = code.replace('db1.query(TrainingRecord)', 'db2.query(TrainingRecord)')
code = code.replace('db.query(TrainingRecord)', 'db2.query(TrainingRecord)')

# get_performance_distribution uses db2
code = code.replace('db1.query(PerformanceReview)', 'db2.query(PerformanceReview)')
code = code.replace('db.query(PerformanceReview)', 'db2.query(PerformanceReview)')

with open(path, 'w') as f:
    f.write(code)

print('Queries rewritten in dashboard')
