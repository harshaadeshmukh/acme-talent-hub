"""
Seed script — populates the database with realistic test data.
Run from the backend/ directory:
    python seed.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, engine, Base, engines, get_shard_db
from app.models.models import (
    User, RoleEnum, PerformanceReview, Competency,
    EmployeeCompetency, SkillLevelEnum,
    StatusEnum, TrainingRecord, generate_emp_id,
    Goal, GoalStatusEnum, Company
)
from app.auth import get_password_hash
from datetime import datetime, timedelta

# Ensure tables exist with new schema
Base.metadata.create_all(bind=engine)
for shard_id, shard_engine in engines.items():
    Base.metadata.create_all(bind=shard_engine)

db = SessionLocal()

print("🌱 Seeding database...")

# ── 1. Create Default Tenant ──────────────────────────────────────────────────
acme_company = db.query(Company).filter(Company.name == "Acme Corp").first()
if not acme_company:
    acme_company = Company(name="Acme Corp", shard_id="shard_2")
    db.add(acme_company)
    db.commit()
    db.refresh(acme_company)
    print(f"  ✅ Created default company: Acme Corp (ID: {acme_company.id})")
else:
    print(f"  ⏭  Skipped (exists): Acme Corp")

# Get shard db session for Acme Corp
shard_db = next(get_shard_db(acme_company.shard_id))

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
    existing = shard_db.query(Competency).filter(Competency.name == name).first()
    if not existing:
        c = Competency(name=name, tenant_id=acme_company.id)
        shard_db.add(c)
        shard_db.flush()
        comp_map[name] = c
        print(f"  ✅ Created competency: {name} in {acme_company.shard_id}")
    else:
        comp_map[name] = existing
shard_db.commit()

shard_db.close()
db.close()
print("\n🎉 Seeding complete! Competencies have been populated in your PostgreSQL database.")
