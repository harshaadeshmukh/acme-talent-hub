# ACME Employee Platform - Backend API

A modern, scalable backend API for centralized employee performance and career development management.

## Features

- **JWT Authentication** - Secure role-based access control (Admin, Manager, Employee)
- **Employee Management** - CRUD operations with department tracking
- **Performance Reviews** - Track ratings, feedback, and performance history
- **Development Plans** - Goals tracking with progress monitoring
- **Competency Management** - Skill tracking and employee skill levels
- **Training Records** - Track trainings and certifications
- **Dashboard Analytics** - Employee statistics, high performers, skill gaps, promotion readiness
- **RESTful API** - Clean, documented endpoints with Swagger UI
- **Multi-Tenancy** - Each company (tenant) is isolated with their own `tenant_id`
- **Database Sharding** - Data is split across multiple Neon PostgreSQL databases for scale

---

## 🗄️ Database Sharding Architecture

### Why Did We Do This?

Imagine a single database as a single cash register in a supermarket. If only 10 customers come in, one register is fine. But what if **10,000 companies** all sign up for ACME Talent Hub, each with hundreds of employees?

One database would:
- **Slow down** under millions of rows
- Become a **single point of failure** (if it crashes, everyone is down)
- Hit **storage limits**

**Database Sharding** solves this by splitting data across multiple databases (called "shards"). Each company is assigned to one shard. Think of it as opening **multiple cash registers** — each serves a different set of customers, so no single one gets overwhelmed.

---

### Overview Diagram

```
                        ACME Talent Hub - Request Flow
                        ================================

  Browser / Frontend (Vercel)
           │
           │  HTTP Request (e.g. "show my goals")
           ▼
  ┌─────────────────────────────────────────────────────┐
  │              FastAPI Backend (Render)                │
  │                                                     │
  │  1. Decode JWT token → get user_id                  │
  │  2. Look up user in Global DB → get tenant_id       │
  │  3. Look up Company → get shard_id ("shard_1" or   │
  │     "shard_2")                                      │
  │  4. Route query to the correct shard database       │
  └──────────────┬──────────────────────────────────────┘
                 │
       ┌─────────┴──────────┐
       │                    │
       ▼                    ▼
┌─────────────┐      ┌─────────────┐
│  ACME-DB    │      │  ACME-DB-2  │
│  (Shard 1)  │      │  (Shard 2)  │
│             │      │             │
│ • companies │      │ • goals     │
│ • users     │      │ • reviews   │
│ • depts     │      │ • training  │
│             │      │ • chat      │
│ ← Global DB │      │ • skills    │
│   for Auth  │      │             │
│             │      │ ← Acme Corp │
│ Future:     │      │   data lives│
│ Company B   │      │   here      │
│ data here   │      │             │
└─────────────┘      └─────────────┘
```

---

### What Data Lives Where?

#### 🗄️ ACME-DB (Shard 1 — also called the Global DB)

This is the **"front door"** database. Before the system knows which company you belong to, it needs a place to check who you are.

| Table | What's Stored | Why Here? |
|-------|--------------|-----------|
| `companies` | List of all tenants (Acme Corp, etc.) + their `shard_id` | Every request reads this to find the correct shard |
| `users` | All user accounts (email, password hash, role) | Login must work before we know which shard to use |
| `departments` | Department names per tenant | Needed during user lookups and routing |

#### 🗄️ ACME-DB-2 (Shard 2 — Acme Corp's dedicated shard)

This is the **"work"** database. Once we know you belong to Acme Corp (shard_2), ALL your actual data is fetched from here.

| Table | What's Stored | Why Here? |
|-------|--------------|-----------|
| `competencies` | Python, React.js, Leadership, DevOps, etc. | Tenant-specific skill catalog |
| `goals` | Every employee goal (draft, submitted, approved) | Isolated per tenant |
| `performance_reviews` | Ratings and feedback | Private per company |
| `training_records` | Certificates and training logs | Per employee, per tenant |
| `team_achievements` | Team milestones | Per tenant |
| `chat_messages` | Department chat history | Per tenant |
| `employee_competencies` | Which employee has which skill at what level | Per tenant |
| `work_timeline_events` | Career history per employee | Per tenant |

---

### How the Routing Works (Step by Step)

```
Step 1:  User sends API request with JWT token
         e.g. GET /api/goals

Step 2:  FastAPI calls get_tenant_db() dependency
         ↓ decodes JWT → gets user_id

Step 3:  Looks up user in ACME-DB (Global)
         → finds tenant_id = 1

Step 4:  Looks up Company where id = 1
         → finds shard_id = "shard_2"

Step 5:  Connects to ACME-DB-2 (Shard 2)
         → runs: SELECT * FROM goals WHERE employee_id = <user_id>
         → returns Acme Corp's goals ✅
```

---

### Adding a New Company in the Future

When Company B signs up:
1. Create a `Company` row in Global DB with `shard_id = "shard_1"`
2. All of Company B's data (goals, reviews, chat, etc.) automatically routes to **ACME-DB (Shard 1)**
3. Acme Corp's data stays safe in Shard 2 — **complete data isolation**

```
companies table (in ACME-DB):
┌────┬─────────────┬──────────┐
│ id │ name        │ shard_id │
├────┼─────────────┼──────────┤
│ 1  │ Acme Corp   │ shard_2  │  → data goes to ACME-DB-2
│ 2  │ Company B   │ shard_1  │  → data goes to ACME-DB
└────┴─────────────┴──────────┘
```

---

### Environment Variables for Sharding

Update your `.env` file with both database URLs:

```env
# Global DB (also acts as Shard 1)
DATABASE_URL="postgresql://user:pass@host1/neondb"
SHARD_1_DB_URL="postgresql://user:pass@host1/neondb"

# Shard 2 — for Acme Corp
SHARD_2_DB_URL="postgresql://user:pass@host2/neondb"
```

To add more shards in the future, add `SHARD_3_DB_URL`, `SHARD_4_DB_URL`, etc. and update the `engines` registry in `database.py`.

---


## Tech Stack

- **Framework:** FastAPI 0.104+
- **Database:** PostgreSQL
- **ORM:** SQLAlchemy 2.0
- **Authentication:** JWT (python-jose)
- **Password Hashing:** bcrypt + passlib
- **API Documentation:** Swagger UI (automatic)

## Prerequisites

- Python 3.8+
- PostgreSQL 12+ (or Supabase Postgres)
- pip (Python package manager)

## Quick Start

### 1. Setup Environment

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure Database

Create a PostgreSQL database:
```sql
CREATE DATABASE employee_platform;
```

Update `.env` file with your database URL:
```
DATABASE_URL=postgresql://username:password@localhost:5432/employee_platform
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ENV=development
```

### 3. Run the Application

```bash
uvicorn app.main:app --reload
```

The API will be available at: `http://localhost:8000`
- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`

## API Documentation

### Authentication Endpoints

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get JWT token
- `GET /auth/me` - Get current user info

### User Management

- `GET /api/users` - List all users
- `GET /api/users/{user_id}` - Get user details
- `POST /api/users` - Create new user (admin only)
- `PUT /api/users/{user_id}` - Update user
- `DELETE /api/users/{user_id}` - Deactivate user (admin only)

### Performance Reviews

- `GET /api/reviews` - List all reviews
- `POST /api/reviews` - Create review (manager/admin only)
- `GET /api/reviews/{review_id}` - Get review details
- `GET /api/reviews/employee/{employee_id}` - Get employee reviews
- `PUT /api/reviews/{review_id}` - Update review
- `DELETE /api/reviews/{review_id}` - Delete review
- `GET /api/reviews/employee/{employee_id}/average` - Get average rating

### Competencies

- `GET /api/competencies` - List all competencies
- `POST /api/competencies` - Create competency (admin only)
- `POST /api/competencies/employee/{employee_id}` - Add skill to employee
- `GET /api/competencies/employee/{employee_id}` - Get employee skills
- `PUT /api/competencies/employee/{employee_id}/{competency_id}` - Update skill level
- `DELETE /api/competencies/employee/{employee_id}/{competency_id}` - Remove skill

### Development Plans

- `GET /api/development-plans` - List all plans
- `POST /api/development-plans` - Create development plan
- `GET /api/development-plans/employee/{employee_id}` - Get employee plans
- `PUT /api/development-plans/{plan_id}` - Update plan
- `DELETE /api/development-plans/{plan_id}` - Delete plan
- `GET /api/development-plans/employee/{employee_id}/completed` - Get completed plans

### Training Records

- `GET /api/training-records` - List all training records
- `POST /api/training-records` - Create training record
- `GET /api/training-records/employee/{employee_id}` - Get employee trainings
- `PUT /api/training-records/{record_id}` - Update training record
- `DELETE /api/training-records/{record_id}` - Delete training record
- `GET /api/training-records/employee/{employee_id}/stats` - Get training statistics

### Dashboard & Analytics

- `GET /api/dashboard/stats` - Employee statistics
- `GET /api/dashboard/high-performers` - High-performing employees (rating >= 4.0)
- `GET /api/dashboard/at-risk-employees` - At-risk employees (rating < 2.0)
- `GET /api/dashboard/skill-gaps` - Identify skill gaps
- `GET /api/dashboard/performance-distribution` - Rating distribution
- `GET /api/dashboard/promotion-ready-employees` - Employees ready for promotion
- `GET /api/dashboard/training-completion-rate` - Organization training completion
- `GET /api/dashboard/department-performance` - Performance by department

## Database Schema

### Users Table
- id (PK)
- name
- email (unique)
- password_hash
- role (admin, manager, employee)
- department
- is_active
- created_at, updated_at

### Performance Reviews
- id (PK)
- employee_id (FK)
- reviewer_id (FK)
- rating (1-5)
- feedback
- review_period
- review_date
- created_at, updated_at

### Competencies
- id (PK)
- name (unique)
- description
- created_at

### Employee Competencies
- id (PK)
- employee_id (FK)
- competency_id (FK)
- skill_level (beginner, intermediate, advanced, expert)
- years_of_experience
- created_at, updated_at

### Development Plans
- id (PK)
- employee_id (FK)
- goal
- description
- status (pending, in_progress, completed, on_hold)
- target_date
- progress_percentage (0-100)
- created_at, updated_at

### Training Records
- id (PK)
- employee_id (FK)
- training_name
- provider
- completion_date
- certificate_url
- duration_hours
- created_at

## Role-Based Access Control

### Admin
- Manage all users
- Create/update/delete competencies
- Create performance reviews for any employee
- View all analytics

### Manager
- View team performance
- Create performance reviews
- Manage team development plans
- View analytics

### Employee
- View own profile
- View own reviews
- Create and manage own development plans
- View own trainings

## Testing

Run tests with pytest:
```bash
pytest app/
```

## Deployment

### Local PostgreSQL Alternative
For development without local PostgreSQL, use Supabase:
1. Create Supabase project
2. Get connection string
3. Update `.env` with Supabase connection URL

### Production Deployment Options
- **AWS EC2** - Deploy with gunicorn + nginx
- **AWS Lambda** - Deploy with serverless framework
- **Railway** - Simple one-click deployment
- **Render** - Easy FastAPI deployment
- **Fly.io** - Container deployment

## Project Structure

```
backend/
├── app/
│   ├── main.py           # FastAPI application entry point
│   ├── database.py       # SQLAlchemy setup and configuration
│   ├── models/           # SQLAlchemy ORM models
│   ├── schemas/          # Pydantic schemas for validation
│   ├── routes/           # API endpoint routes
│   │   ├── users.py
│   │   ├── reviews.py
│   │   ├── competencies.py
│   │   ├── development_plans.py
│   │   ├── training_records.py
│   │   └── dashboard.py
│   ├── auth/             # JWT authentication utilities
│   └── utils/            # Helper utilities
├── requirements.txt      # Python dependencies
├── .env                  # Environment variables
└── README.md            # This file
```

## Code Quality

- Type hints throughout
- Pydantic validation
- Comprehensive error handling
- CORS enabled for frontend integration
- RESTful API design
- Clean separation of concerns

## Future Enhancements

- Database migrations with Alembic
- Unit and integration tests
- Rate limiting
- Audit logging
- Email notifications
- Advanced filtering and search
- Bulk operations
- Reporting exports (CSV, PDF)
- Real-time notifications with WebSockets

## Contributing

1. Follow PEP 8 style guide
2. Add type hints to all functions
3. Write docstrings for endpoints
4. Test all changes locally

## License

ACME Inc. - Confidential

## Support

For issues or questions, contact the development team.
