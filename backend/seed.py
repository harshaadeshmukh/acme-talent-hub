"""
Seed script — populates the database with realistic test data.
Run from the backend/ directory:
    python seed.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocalShard1, SessionLocalShard2, engine1, engine2, Base1, Base2
from app.models.models import (
    User, RoleEnum, PerformanceReview, Competency,
    EmployeeCompetency, SkillLevelEnum,
    StatusEnum, TrainingRecord, generate_emp_id,
    Goal, GoalStatusEnum, Department, TeamAchievement, ChatMessage, WorkTimelineEvent
)
from app.auth import get_password_hash
from datetime import datetime, timedelta

# Ensure tables exist with new schema
Base1.metadata.drop_all(bind=engine1)
Base2.metadata.drop_all(bind=engine2)
Base1.metadata.create_all(bind=engine1)
Base2.metadata.create_all(bind=engine2)
Base2.metadata.create_all(bind=engine2)

db1 = SessionLocalShard1()
db2 = SessionLocalShard2()

print("🌱 Seeding database...")




# ── 3. Competencies ───────────────────────────────────────────────────────────
competency_names = [
    ("Python",          "Backend development with Python"),
    ("React.js",        "Frontend development with React"),
    ("PostgreSQL",      "Database design and management"),
    ("Leadership",      "Team leadership and management"),
]
comp_map = {}
for name, desc in competency_names:
    existing = db1.query(Competency).filter(Competency.name == name).first()
    if not existing:
        c = Competency(name=name)
        db1.add(c)
        db1.flush()
        comp_map[name] = c
        print(f"  ✅ Created competency: {name}")
    else:
        comp_map[name] = existing
db1.commit()



db1.close()
db2.close()
print("\n🎉 Seeding complete! Database has been populated across Shard 1 and Shard 2.")
