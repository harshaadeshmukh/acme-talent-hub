from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
import random
from app.database import Base


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

class Company(Base):
    __tablename__ = "companies"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Department(Base):
    __tablename__ = "departments"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    name = Column(String, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, default=generate_emp_id)
    tenant_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
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
    reviews_given = relationship("PerformanceReview", foreign_keys="PerformanceReview.reviewer_id", back_populates="reviewer")
    reviews_received = relationship("PerformanceReview", foreign_keys="PerformanceReview.employee_id", back_populates="employee")
    competencies = relationship("EmployeeCompetency", back_populates="employee", cascade="all, delete-orphan")
    training_records = relationship("TrainingRecord", foreign_keys="TrainingRecord.employee_id", back_populates="employee", cascade="all, delete-orphan")
    goals = relationship("Goal", back_populates="employee", cascade="all, delete-orphan")
    timeline_events = relationship("WorkTimelineEvent", back_populates="employee", cascade="all, delete-orphan", order_by="desc(WorkTimelineEvent.start_date)")


class WorkTimelineEvent(Base):
    __tablename__ = "work_timeline_events"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    employee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    company = Column(String, nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=True)  # Null means present
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    employee = relationship("User", back_populates="timeline_events")


class PerformanceReview(Base):
    __tablename__ = "performance_reviews"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    employee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rating = Column(Float, nullable=False)  # 1-5
    feedback = Column(Text, nullable=True)
    review_period = Column(String, nullable=True)  # e.g., "Q1 2024"
    review_date = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    employee = relationship("User", foreign_keys=[employee_id], back_populates="reviews_received")
    reviewer = relationship("User", foreign_keys=[reviewer_id], back_populates="reviews_given")


class Competency(Base):
    __tablename__ = "competencies"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    name = Column(String, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    employees = relationship("EmployeeCompetency", back_populates="competency", cascade="all, delete-orphan")


class EmployeeCompetency(Base):
    __tablename__ = "employee_competencies"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    employee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    competency_id = Column(Integer, ForeignKey("competencies.id"), nullable=False)
    skill_level = Column(Enum(SkillLevelEnum), default=SkillLevelEnum.BEGINNER)
    years_of_experience = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    employee = relationship("User", back_populates="competencies")
    competency = relationship("Competency", back_populates="employees")




class TrainingRecord(Base):
    __tablename__ = "training_records"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    employee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    training_name = Column(String, nullable=False)
    provider = Column(String, nullable=True)
    completion_date = Column(DateTime, nullable=True)
    certificate_url = Column(String, nullable=True)
    duration_hours = Column(Float, nullable=True)
    
    # New fields for Learning & Growth
    category = Column(Enum(CertificateCategoryEnum), default=CertificateCategoryEnum.TECHNICAL)
    verification_status = Column(Enum(VerificationStatusEnum), default=VerificationStatusEnum.PENDING)
    verified_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    rejection_reason = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    employee = relationship("User", foreign_keys=[employee_id], back_populates="training_records")
    verified_by = relationship("User", foreign_keys=[verified_by_id])

    @property
    def employee_name(self):
        return self.employee.name if self.employee else None


class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    employee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
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
    employee = relationship("User", back_populates="goals")

    @property
    def employee_name(self):
        return self.employee.name if self.employee else None

class TeamAchievement(Base):
    __tablename__ = "team_achievements"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    team_name = Column(String, nullable=False, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    type = Column(Enum(AchievementTypeEnum), default=AchievementTypeEnum.PRODUCT_LAUNCH)
    date_awarded = Column(DateTime, default=datetime.utcnow)



class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    department_name = Column(String, index=True, nullable=False)
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Relationships
    sender = relationship("User", foreign_keys=[sender_id])
