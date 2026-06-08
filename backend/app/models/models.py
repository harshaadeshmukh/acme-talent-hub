from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
import random
from app.database import Base1, Base2


class RoleEnum(str, enum.Enum):
    MANAGER = "manager"
    EMPLOYEE = "employee"


class SkillLevelEnum(str, enum.Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"
    MASTER = "master"


class StatusEnum(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ON_HOLD = "on_hold"

class AchievementTypeEnum(str, enum.Enum):
    PRODUCT_LAUNCH = "product_launch"
    REVENUE_GOAL = "revenue_goal"
    CLIENT_SUCCESS = "client_success"
    INNOVATION = "innovation"
    PROCESS_IMPROVEMENT = "process_improvement"

class GoalStatusEnum(str, enum.Enum):
    DRAFT     = "draft"
    SUBMITTED = "submitted"
    APPROVED  = "approved"
    REJECTED  = "rejected"

class CertificateCategoryEnum(str, enum.Enum):
    TECHNICAL = "technical"
    LEADERSHIP = "leadership"
    COMPLIANCE = "compliance"
    LANGUAGE = "language"
    OTHER = "other"

class VerificationStatusEnum(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class GoalCategoryEnum(str, enum.Enum):
    PERFORMANCE = "performance"
    SKILL = "skill"
    LEADERSHIP = "leadership"
    PROJECT = "project"


def generate_emp_id():
    """Generate a random 7-digit employee ID"""
    return random.randint(1000000, 9999999)


class Department(Base1):
    __tablename__ = "departments"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class User(Base1):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, default=generate_emp_id)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(Enum(RoleEnum), default=RoleEnum.EMPLOYEE)
    department = Column(String, nullable=True)
    job_title = Column(String, nullable=True)  # e.g. "Software Engineer", "Junior Developer"
    dob = Column(DateTime, nullable=True)
    address = Column(String, nullable=True)
    gender = Column(String, nullable=True)  # "Male", "Female", "Other"
    is_handicapped = Column(Boolean, default=False)
    profile_pic_url = Column(String, nullable=True)
    linkedin_url = Column(String, nullable=True)
    github_url = Column(String, nullable=True)
    portfolio_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    competencies = relationship("EmployeeCompetency", back_populates="employee", cascade="all, delete-orphan")


class WorkTimelineEvent(Base2):
    __tablename__ = "work_timeline_events"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, index=True, nullable=False)
    title = Column(String, nullable=False)
    company = Column(String, nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=True)  # Null means present
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships


class PerformanceReview(Base2):
    __tablename__ = "performance_reviews"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, index=True, nullable=False)
    reviewer_id = Column(Integer, index=True, nullable=False)
    rating = Column(Float, nullable=False)  # 1-5
    feedback = Column(Text, nullable=True)
    review_period = Column(String, nullable=True)  # e.g., "Q1 2024"
    review_date = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships


class Competency(Base1):
    __tablename__ = "competencies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    employees = relationship("EmployeeCompetency", back_populates="competency", cascade="all, delete-orphan")


class EmployeeCompetency(Base1):
    __tablename__ = "employee_competencies"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    competency_id = Column(Integer, ForeignKey("competencies.id"), nullable=False)
    skill_level = Column(Enum(SkillLevelEnum), default=SkillLevelEnum.BEGINNER)
    years_of_experience = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    competency = relationship("Competency", back_populates="employees")
    employee = relationship("User", back_populates="competencies")




class TrainingRecord(Base2):
    __tablename__ = "training_records"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, index=True, nullable=False)
    training_name = Column(String, nullable=False)
    provider = Column(String, nullable=True)
    completion_date = Column(DateTime, nullable=True)
    certificate_url = Column(String, nullable=True)
    duration_hours = Column(Float, nullable=True)
    
    # New fields for Learning & Growth
    category = Column(Enum(CertificateCategoryEnum), default=CertificateCategoryEnum.TECHNICAL)
    verification_status = Column(Enum(VerificationStatusEnum), default=VerificationStatusEnum.PENDING)
    verified_by_id = Column(Integer, index=True, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships


class Goal(Base2):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, index=True, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    target_date = Column(DateTime, nullable=True)
    status = Column(Enum(GoalStatusEnum), default=GoalStatusEnum.DRAFT)
    manager_feedback = Column(Text, nullable=True)
    
    # New fields for Learning & Growth
    progress_percentage = Column(Integer, default=0)
    category = Column(Enum(GoalCategoryEnum), default=GoalCategoryEnum.PERFORMANCE)
    is_endorsed = Column(Boolean, default=False)
    quarter = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships

class TeamAchievement(Base2):
    __tablename__ = "team_achievements"

    id = Column(Integer, primary_key=True, index=True)
    team_name = Column(String, nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    type = Column(Enum(AchievementTypeEnum), default=AchievementTypeEnum.PRODUCT_LAUNCH)
    date_awarded = Column(DateTime, default=datetime.utcnow)



class ChatMessage(Base2):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, index=True, nullable=False)
    department_name = Column(String, index=True, nullable=False)
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
