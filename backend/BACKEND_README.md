# ACME Talent Hub - Backend API

A high-performance, scalable backend API designed for the ACME Talent Hub. Built with **FastAPI**, it provides centralized employee performance tracking, talent intelligence, and career development management.

## 🚀 Key Features

- **FastAPI Framework**: High-performance, asynchronous endpoints with auto-generated Swagger UI.
- **Service-Based Database Sharding**: Data is intelligently partitioned across two databases to ensure analytical queries don't slow down core identity operations.
- **Real-Time WebSockets**: Instant dashboard updates and live department chat functionality.
- **Role-Based Access Control (RBAC)**: Strict separation between `MANAGER` and `EMPLOYEE` privileges.
- **Talent Intelligence**: Endpoints dedicated to identifying skill gaps, top performers, and at-risk employees.
- **Robust Security**: JWT Authentication, bcrypt password hashing, and secure OTP fallbacks.

---

## 🏗️ System Architecture & Sharding

### ❓ Why Did We Build with 2 Databases?

Originally, the system was designed around a single massive database. However, as ACME Talent Hub evolved into a heavy analytics and tracking platform, we implemented **Service-Based Sharding** across two distinct PostgreSQL databases. 

Here is why:
1. **Preventing Login Bottlenecks**: Heavy analytical queries (like calculating company-wide performance distributions or scanning chat history) require massive compute power. If all data lived in one database, a manager loading the Talent Intelligence dashboard could severely slow down an employee simply trying to log in.
2. **Independent Scaling**: Because the databases are split by "Domain", Shard 2 (which handles high-volume transactions like Chat and Goals) can automatically scale its compute power independently of Shard 1.
3. **Fault Tolerance**: If the analytics/chat database goes down, employees can still log in and view their core profiles because the Identity database remains unaffected.

### 🔄 Cross-Database Workflow (How it works in practice)

Because Shard 1 and Shard 2 are physically separate, we cannot use traditional SQL `JOIN` statements to link a User to their Goals. Instead, the FastAPI backend acts as an intelligent data-stitcher:

```text
Step 1: The frontend requests the Dashboard Stats.
Step 2: The Backend queries Shard 2 to calculate the average performance ratings for all employees.
Step 3: The Backend extracts the `employee_id` list of top performers from Shard 2.
Step 4: The Backend queries Shard 1 using those specific IDs to fetch the Names and Avatars of the employees.
Step 5: The Backend instantly merges the data in-memory using Python dictionaries, and returns a unified JSON response to the frontend.
```

### 🗄️ Shard 1 (Core Identity)
Powered by the `DATABASE_URL` environment variable.
Handles the core truth of **WHO** works here and **WHAT** the organization structure looks like.

| Data Domain | Purpose |
|-------------|---------|
| **Users & Auth** | Handles secure login, passwords, roles, and profiles. |
| **Competencies** | The catalog of company skills (Python, Leadership, etc.). |
| **Employee Skills** | Tracks which user has which skill and at what level. |

### 🗄️ Shard 2 (Application Features)
Powered by the `SHARD_2_DB_URL` environment variable.
Handles the **WORK** and **HISTORY**. This is the high-volume transactional database.

| Data Domain | Purpose |
|-------------|---------|
| **Goals** | Employee objectives and progress tracking. |
| **Reviews** | Performance review ratings and feedback. |
| **Learning & Training** | Training records and course recommendations. |
| **Timeline** | Historical career events and milestones. |
| **Chat & Achievements** | Departmental chat messages and team accomplishments. |

---

## ⚙️ Environment Variables

To run the backend, you must configure the following in your `.env` or Render environment:

```env
# Required Database Connections
DATABASE_URL="postgresql://user:pass@host1/neondb"     # Shard 1 (Identity)
SHARD_2_DB_URL="postgresql://user:pass@host2/neondb"   # Shard 2 (Features)

# Security
SECRET_KEY="your-secure-jwt-secret"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES="1440"

# Optional Services (Has local/console fallbacks if not provided)
REDIS_HOST="localhost"
SMTP_HOST="localhost"
RESEND_API_KEY=""
```

---

## 🔒 Role-Based Access Control (RBAC)

The system strictly enforces two operational roles.

### 👑 Manager
- Manage users and update organizational roles.
- Create, update, and delete company competencies.
- Create performance reviews and assign goals to employees.
- Access the `talent_intelligence` and `dashboard` analytics for team overviews.

### 👔 Employee
- View own profile and performance reviews.
- Update progress on assigned goals.
- Log personal training records and timeline events.
- Access the `employee_dashboard` for a personalized view of their career.

---

## 📡 API Modules & Routers

The application is highly modular. Each domain has its own dedicated router inside `app/routes/`:

- **`/api/users`**: User CRUD, profile management, and OTP auth flows.
- **`/api/competencies`**: Skill catalog and employee-specific skill level tracking.
- **`/api/goals`**: Goal creation, assignment, and status updates.
- **`/api/reviews`**: Performance reviews and historical ratings.
- **`/api/learning` & `/api/training-records`**: Course recommendations and employee training logs.
- **`/api/timeline`**: Career milestones and event tracking.
- **`/api/achievements`**: Team and individual accomplishments.
- **`/api/chat`**: WebSocket-powered departmental chat rooms.
- **`/api/dashboard`**: High-level analytical stats for managers.
- **`/api/employee-dashboard`**: Personalized metrics and upcoming goals for employees.
- **`/api/talent-intelligence`**: Advanced analytics (identifying top performers, skill gaps, at-risk staff).

---

## 🛠️ Local Development Setup

1. **Create Virtual Environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # Or `venv\Scripts\activate` on Windows
   ```

2. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Environment:**
   Create a `.env` file matching the variables listed above. Ensure both `DATABASE_URL` and `SHARD_2_DB_URL` are provided.

4. **Run the Server:**
   ```bash
   uvicorn app.main:app --reload
   ```

5. **View Documentation:**
   Open your browser to `http://localhost:8000/docs` to interact with the auto-generated Swagger UI.
