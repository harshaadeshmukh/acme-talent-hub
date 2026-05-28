"""
Seed script — populates the database with realistic test data.
Run from the backend/ directory:
    python seed.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, engine, Base
from app.models.models import (
    User, RoleEnum, PerformanceReview, Competency,
    EmployeeCompetency, SkillLevelEnum,
    StatusEnum, TrainingRecord, generate_emp_id,
    Goal, GoalStatusEnum
)
from app.auth import get_password_hash
from datetime import datetime, timedelta

# Ensure tables exist with new schema
Base.metadata.create_all(bind=engine)

db = SessionLocal()

print("🌱 Seeding database...")

# ── 1. Create extra employees ─────────────────────────────────────────────────
employees_data = [
    {"name": "Priya Sharma",    "email": "priya.sharma@acmeinc.com",   "role": RoleEnum.MANAGER,  "dept": "Engineering"},
    {"name": "Ravi Kulkarni",   "email": "ravi.kulkarni@acmeinc.com",  "role": RoleEnum.EMPLOYEE, "dept": "Engineering"},
    {"name": "Ananya Patel",    "email": "ananya.patel@acmeinc.com",   "role": RoleEnum.EMPLOYEE, "dept": "Design"},
    {"name": "Vikram Nair",     "email": "vikram.nair@acmeinc.com",    "role": RoleEnum.EMPLOYEE, "dept": "Marketing"},
    {"name": "Sonal Mehta",     "email": "sonal.mehta@acmeinc.com",    "role": RoleEnum.MANAGER,  "dept": "HR"},
    {"name": "Deepak Joshi",    "email": "deepak.joshi@acmeinc.com",   "role": RoleEnum.EMPLOYEE, "dept": "Finance"},
    {"name": "Kavya Reddy",     "email": "kavya.reddy@acmeinc.com",    "role": RoleEnum.EMPLOYEE, "dept": "Engineering"},
]

created_users = {}
for emp in employees_data:
    existing = db.query(User).filter(User.email == emp["email"]).first()
    if not existing:
        u = User(
            id=generate_emp_id(),
            name=emp["name"],
            email=emp["email"],
            password_hash=get_password_hash("Password@123"),
            role=emp["role"],
            department=emp["dept"],
            is_active=True
        )
        db.add(u)
        db.flush()
        created_users[emp["email"]] = u
        print(f"  ✅ Created user: {emp['name']} (ID: {u.id})")
    else:
        created_users[emp["email"]] = existing
        print(f"  ⏭  Skipped (exists): {emp['name']}")

db.commit()

# Reload existing registered user
harshad = db.query(User).filter(User.email == "harrygamers804@gmail.com").first()
if harshad:
    harshad.department = "Engineering"
    db.commit()
    print(f"  📝 Updated Harshad's department to Engineering")

all_users = db.query(User).filter(User.is_active == True).all()
engineers = [u for u in all_users if u.department == "Engineering"]
managers  = [u for u in all_users if u.role == RoleEnum.MANAGER]

# ── 2. Competencies ───────────────────────────────────────────────────────────
competency_names = [
    ("Python",          "Backend development with Python"),
    ("React.js",        "Frontend development with React"),
    ("PostgreSQL",      "Database design and management"),
    ("Leadership",      "Team leadership and management"),
    ("Communication",   "Effective verbal and written communication"),
    ("System Design",   "Designing scalable distributed systems"),
    ("DevOps",          "CI/CD pipelines, Docker, Kubernetes"),
    ("Machine Learning","ML model development and deployment"),
]
comp_map = {}
for name, desc in competency_names:
    existing = db.query(Competency).filter(Competency.name == name).first()
    if not existing:
        c = Competency(name=name, description=desc)
        db.add(c)
        db.flush()
        comp_map[name] = c
        print(f"  ✅ Created competency: {name}")
    else:
        comp_map[name] = existing
db.commit()

# ── 3. Employee Competencies ──────────────────────────────────────────────────
assignments = [
    ("harrygamers804@gmail.com",    "Python",         SkillLevelEnum.ADVANCED,     3.5),
    ("harrygamers804@gmail.com",    "React.js",       SkillLevelEnum.INTERMEDIATE,  2.0),
    ("ravi.kulkarni@acmeinc.com",   "Python",         SkillLevelEnum.EXPERT,        5.0),
    ("ravi.kulkarni@acmeinc.com",   "DevOps",         SkillLevelEnum.INTERMEDIATE,  2.5),
    ("ananya.patel@acmeinc.com",    "React.js",       SkillLevelEnum.EXPERT,        4.0),
    ("ananya.patel@acmeinc.com",    "Communication",  SkillLevelEnum.ADVANCED,      3.0),
    ("vikram.nair@acmeinc.com",     "Communication",  SkillLevelEnum.EXPERT,        6.0),
    ("kavya.reddy@acmeinc.com",     "Machine Learning", SkillLevelEnum.ADVANCED,    2.0),
    ("kavya.reddy@acmeinc.com",     "Python",         SkillLevelEnum.EXPERT,        4.0),
    ("priya.sharma@acmeinc.com",    "Leadership",     SkillLevelEnum.EXPERT,        7.0),
    ("priya.sharma@acmeinc.com",    "System Design",  SkillLevelEnum.ADVANCED,      5.0),
]
for email, skill, level, years in assignments:
    user = db.query(User).filter(User.email == email).first()
    comp = comp_map.get(skill)
    if user and comp:
        existing = db.query(EmployeeCompetency).filter_by(employee_id=user.id, competency_id=comp.id).first()
        if not existing:
            db.add(EmployeeCompetency(
                employee_id=user.id, competency_id=comp.id,
                skill_level=level, years_of_experience=years
            ))
db.commit()
print("  ✅ Assigned employee competencies")

# ── 4. Performance Reviews ────────────────────────────────────────────────────
manager = managers[0] if managers else all_users[0]
review_data = [
    ("harrygamers804@gmail.com",  4.5, "Excellent problem-solving skills. Delivered ahead of schedule.", "Q1 2025"),
    ("ravi.kulkarni@acmeinc.com", 4.8, "Outstanding contributor. Mentors junior devs effectively.",      "Q1 2025"),
    ("ananya.patel@acmeinc.com",  4.2, "Creative designs with strong attention to user experience.",      "Q1 2025"),
    ("vikram.nair@acmeinc.com",   3.8, "Good campaign results. Could improve data-driven decisions.",     "Q1 2025"),
    ("kavya.reddy@acmeinc.com",   4.6, "Strong ML model quality. Great initiative in research.",          "Q1 2025"),
    ("deepak.joshi@acmeinc.com",  3.5, "Meets expectations. Needs to improve reporting accuracy.",        "Q1 2025"),
    ("harrygamers804@gmail.com",  4.0, "Consistent performance. Good team player.",                       "Q4 2024"),
    ("ravi.kulkarni@acmeinc.com", 4.5, "Led the backend migration successfully.",                         "Q4 2024"),
]
for email, rating, feedback, period in review_data:
    emp = db.query(User).filter(User.email == email).first()
    if emp:
        existing = db.query(PerformanceReview).filter_by(
            employee_id=emp.id, review_period=period
        ).first()
        if not existing:
            db.add(PerformanceReview(
                employee_id=emp.id, reviewer_id=manager.id,
                rating=rating, feedback=feedback, review_period=period
            ))
db.commit()
print("  ✅ Created performance reviews")

# ── 5. Development Plans ──────────────────────────────────────────────────────
plans_data = [
    ("harrygamers804@gmail.com", "Learn System Design",     "Complete system design course and apply patterns", GoalStatusEnum.APPROVED, 45),
    ("harrygamers804@gmail.com", "AWS Certification",       "Achieve AWS Solutions Architect certification",    GoalStatusEnum.SUBMITTED,     10),
    ("ravi.kulkarni@acmeinc.com","Kubernetes Mastery",      "Master K8s deployment and scaling",               GoalStatusEnum.APPROVED, 70),
    ("ananya.patel@acmeinc.com", "Figma Advanced",          "Complete advanced Figma prototyping course",       GoalStatusEnum.APPROVED,  100),
    ("kavya.reddy@acmeinc.com",  "Publish ML Research",     "Publish paper on recommendation systems",          GoalStatusEnum.APPROVED, 60),
    ("vikram.nair@acmeinc.com",  "Google Analytics Cert",   "Obtain GA4 certification",                        GoalStatusEnum.APPROVED,  100),
    ("deepak.joshi@acmeinc.com", "CFA Level 1",             "Pass CFA Level 1 examination",                    GoalStatusEnum.SUBMITTED,      5),
]
for email, title, desc, status, progress in plans_data:
    user = db.query(User).filter(User.email == email).first()
    if user:
        existing = db.query(Goal).filter_by(employee_id=user.id, title=title).first()
        if not existing:
            db.add(Goal(
                employee_id=user.id, title=title, description=desc,
                status=status, progress_percentage=progress,
                target_date=datetime.utcnow() + timedelta(days=90)
            ))
db.commit()
print("  ✅ Created development plans")

# ── 6. Training Records ───────────────────────────────────────────────────────
training_data = [
    ("harrygamers804@gmail.com", "FastAPI Complete Course",     "Udemy",     24.0, "2024-12-01"),
    ("harrygamers804@gmail.com", "Docker & Kubernetes Basics",  "Coursera",  18.0, "2025-01-15"),
    ("ravi.kulkarni@acmeinc.com","Advanced Python Programming", "Pluralsight",30.0,"2024-11-20"),
    ("ananya.patel@acmeinc.com", "UI/UX Design Fundamentals",  "Google",    40.0, "2024-10-10"),
    ("kavya.reddy@acmeinc.com",  "Deep Learning Specialization","Coursera",  60.0, "2025-02-28"),
    ("vikram.nair@acmeinc.com",  "Digital Marketing Masterclass","HubSpot",  20.0, "2025-01-05"),
]
for email, tname, provider, hours, date_str in training_data:
    user = db.query(User).filter(User.email == email).first()
    if user:
        existing = db.query(TrainingRecord).filter_by(employee_id=user.id, training_name=tname).first()
        if not existing:
            db.add(TrainingRecord(
                employee_id=user.id, training_name=tname, provider=provider,
                duration_hours=hours,
                completion_date=datetime.strptime(date_str, "%Y-%m-%d")
            ))
db.commit()
print("  ✅ Created training records")

db.close()
print("\n🎉 Seeding complete! All test data is now in your PostgreSQL database.")
print("\n📋 Test accounts created (password for all: Password@123):")
print("   priya.sharma@acmeinc.com   → Manager")
print("   sonal.mehta@acmeinc.com    → Manager")
print("   ravi.kulkarni@acmeinc.com  → Employee")
print("   ananya.patel@acmeinc.com   → Employee")
print("   kavya.reddy@acmeinc.com    → Employee")
print("   vikram.nair@acmeinc.com    → Employee")
print("   deepak.joshi@acmeinc.com   → Employee")
