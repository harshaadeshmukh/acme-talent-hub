from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum
from app.models import AchievementTypeEnum


class RoleEnum(str, Enum):
    MANAGER = "manager"
    EMPLOYEE = "employee"


class SkillLevelEnum(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"


class StatusEnum(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ON_HOLD = "on_hold"

class CertificateCategoryEnum(str, Enum):
    TECHNICAL = "technical"
    LEADERSHIP = "leadership"
    COMPLIANCE = "compliance"
    LANGUAGE = "language"
    OTHER = "other"

class VerificationStatusEnum(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class GoalCategoryEnum(str, Enum):
    PERFORMANCE = "performance"
    SKILL = "skill"
    LEADERSHIP = "leadership"
    PROJECT = "project"


# ── Auth Schemas ──────────────────────────────────────────────────────────────
class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    department: Optional[str] = None
    role: Optional[RoleEnum] = RoleEnum.EMPLOYEE

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    role: str

class OTPVerifyRequest(BaseModel):
    email: EmailStr
    otp_code: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp_code: str
    new_password: str


# ── User Schemas ──────────────────────────────────────────────────────────────
class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: RoleEnum = RoleEnum.EMPLOYEE
    department: Optional[str] = None
    job_title: Optional[str] = None
    dob: Optional[datetime] = None
    address: Optional[str] = None
    gender: Optional[str] = None
    is_handicapped: bool = False
    profile_pic_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None
    job_title: Optional[str] = None
    role: Optional[RoleEnum] = None
    dob: Optional[datetime] = None
    address: Optional[str] = None
    gender: Optional[str] = None
    is_handicapped: Optional[bool] = None
    profile_pic_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ── Performance Review Schemas ────────────────────────────────────────────────
class PerformanceReviewBase(BaseModel):
    rating: float = Field(ge=0, le=5)
    feedback: Optional[str] = None
    review_period: Optional[str] = None

class PerformanceReviewCreate(PerformanceReviewBase):
    employee_id: int
    reviewer_id: int

class PerformanceReviewUpdate(BaseModel):
    rating: Optional[float] = Field(None, ge=0, le=5)
    feedback: Optional[str] = None
    review_period: Optional[str] = None

class PerformanceReviewResponse(PerformanceReviewBase):
    id: int
    employee_id: int
    reviewer_id: int
    review_date: datetime
    created_at: datetime
    reviewer: Optional[UserResponse] = None

    class Config:
        from_attributes = True


# ── Competency Schemas ────────────────────────────────────────────────────────
class CompetencyBase(BaseModel):
    name: str
    description: Optional[str] = None

class CompetencyCreate(CompetencyBase):
    pass

class CompetencyResponse(CompetencyBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ── Employee Competency Schemas ───────────────────────────────────────────────
class EmployeeCompetencyBase(BaseModel):
    competency_id: int
    skill_level: SkillLevelEnum = SkillLevelEnum.BEGINNER
    years_of_experience: Optional[float] = None

class EmployeeCompetencyCreate(EmployeeCompetencyBase):
    employee_id: int

class EmployeeCompetencyResponse(EmployeeCompetencyBase):
    id: int
    employee_id: int
    created_at: datetime
    updated_at: datetime
    competency: Optional[CompetencyResponse] = None

    class Config:
        from_attributes = True


# ── Development Plan Schemas ──────────────────────────────────────────────────
class DevelopmentPlanBase(BaseModel):
    goal: str
    description: Optional[str] = None
    status: StatusEnum = StatusEnum.PENDING
    target_date: Optional[datetime] = None
    progress_percentage: int = Field(default=0, ge=0, le=100)

class DevelopmentPlanCreate(DevelopmentPlanBase):
    employee_id: int

class DevelopmentPlanUpdate(BaseModel):
    goal: Optional[str] = None
    description: Optional[str] = None
    status: Optional[StatusEnum] = None
    target_date: Optional[datetime] = None
    progress_percentage: Optional[int] = Field(None, ge=0, le=100)

class DevelopmentPlanResponse(DevelopmentPlanBase):
    id: int
    employee_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ── Training Record Schemas ───────────────────────────────────────────────────
# ── Training Record / Certificates Schemas ───────────────────────────────────────────────
class TrainingRecordBase(BaseModel):
    training_name: str
    provider: Optional[str] = None
    duration_hours: Optional[float] = None
    completion_date: Optional[datetime] = None
    certificate_url: Optional[str] = None
    category: CertificateCategoryEnum = CertificateCategoryEnum.TECHNICAL

class TrainingRecordCreate(TrainingRecordBase):
    pass

class TrainingRecordUpdate(BaseModel):
    training_name: Optional[str] = None
    provider: Optional[str] = None
    duration_hours: Optional[float] = None
    completion_date: Optional[datetime] = None
    certificate_url: Optional[str] = None
    category: Optional[CertificateCategoryEnum] = None

class CertificateVerifyRequest(BaseModel):
    verification_status: VerificationStatusEnum
    rejection_reason: Optional[str] = None

class TrainingRecordResponse(TrainingRecordBase):
    id: int
    employee_id: int
    employee_name: Optional[str] = None
    verification_status: VerificationStatusEnum
    verified_by_id: Optional[int] = None
    rejection_reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ── Dashboard Analytics Schemas ───────────────────────────────────────────────
class EmployeeStats(BaseModel):
    total_employees: int
    active_employees: int
    high_performers: int
    at_risk_employees: int

class HighPerformer(BaseModel):
    id: int
    name: str
    email: str
    average_rating: float
    department: Optional[str]
    job_title: Optional[str] = None
    avatar_url: Optional[str] = None

class SkillGap(BaseModel):
    competency_name: str
    missing_count: int
    employees_needing: List[str]


# ── Goal Schemas ──────────────────────────────────────────────────────────────
class GoalCreate(BaseModel):
    title: str
    description: Optional[str] = None
    target_date: Optional[datetime] = None
    category: GoalCategoryEnum = GoalCategoryEnum.PERFORMANCE
    quarter: Optional[str] = None
    progress_percentage: Optional[int] = 0

class GoalProgressUpdate(BaseModel):
    progress_percentage: int = Field(ge=0, le=100)
    status: str

class GoalFeedback(BaseModel):
    manager_feedback: Optional[str] = None
    is_endorsed: Optional[bool] = None

class AchievementCreate(BaseModel):
    team_name: str
    title: str
    description: Optional[str] = None
    type: AchievementTypeEnum

class AchievementResponse(BaseModel):
    id: int
    team_name: str
    title: str
    description: Optional[str]
    type: AchievementTypeEnum
    date_awarded: datetime

    class Config:
        from_attributes = True

class GoalResponse(BaseModel):
    id: int
    employee_id: int
    employee_name: Optional[str] = None
    title: str
    description: Optional[str]
    target_date: Optional[datetime]
    status: str
    manager_feedback: Optional[str]
    progress_percentage: int
    category: GoalCategoryEnum
    is_endorsed: bool
    quarter: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ── Work Timeline Schemas ─────────────────────────────────────────────────────
class TimelineEventBase(BaseModel):
    title: str
    company: str
    start_date: datetime
    end_date: Optional[datetime] = None
    description: Optional[str] = None

class TimelineEventCreate(TimelineEventBase):
    pass

class TimelineEventUpdate(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    description: Optional[str] = None

class TimelineEventResponse(TimelineEventBase):
    id: int
    employee_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# ── Talent Intelligence Schemas ───────────────────────────────────────────────

class RoleTargetCreate(BaseModel):
    role_name: str
    competency_id: int
    target_level: SkillLevelEnum

class RoleTargetResponse(BaseModel):
    id: int
    role_name: str
    competency_id: int
    target_level: SkillLevelEnum
    competency_name: Optional[str] = None

    class Config:
        from_attributes = True

class TeamSkillGap(BaseModel):
    employee_id: int
    employee_name: str
    competency_id: int
    competency_name: str
    current_level: SkillLevelEnum
    target_level: SkillLevelEnum
    gap_score: int

class GoalMatchResponse(BaseModel):
    employee_id: int
    employee_name: str
    match_score: int
    matching_skills: List[str]
    avatar_url: Optional[str] = None
    role: Optional[str] = None
