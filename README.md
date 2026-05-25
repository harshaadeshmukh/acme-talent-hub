# ACME Talent Hub 🏢

A comprehensive, centralized platform for performance management, employee development, and talent intelligence. 

## 🎯 The Problem We Solve
Organizations often struggle to track employee performance and growth over time due to fragmented tools. We built ACME Talent Hub to answer critical organizational questions:
- What are the performance ratings and review history for each employee?
- Which employees have critical skill gaps in key competencies?
- Who are the high-potential employees ready for promotion?
- What training and development activities have been completed by each employee?
- Which employees are at risk of attrition based on performance trends?
- How does employee performance correlate with team and project outcomes?
- What is the distribution of skills across the organization?

---

## 🏗️ Architecture Overview

The application follows a modern decoupled architecture:
- **Frontend Client:** A Single Page Application (SPA) built with React and Vite.
- **Backend API:** A RESTful API built with Python and FastAPI.
- **Database:** A relational PostgreSQL database.
- **Real-time Engine:** WebSockets facilitate live UI updates across clients whenever the database changes.

---

## 📂 Project Structure

### 💻 Frontend Structure (`/frontend`)
The frontend is designed with modularity and reusability in mind.
- **`src/components/`**: Reusable UI components (e.g., Modals, ProtectedRoutes).
- **`src/context/`**: React Context providers for global state management (e.g., `AuthContext` for JWT tokens and user sessions).
- **`src/pages/`**: Top-level route components (`DashboardPage`, `LoginPage`, `LandingPage`).
- **`src/pages/sections/`**: Modular dashboard panels (e.g., `ManagerReviewsSection`, `TalentIntelligenceSection`) loaded dynamically based on user role.
- **`src/services/`**: Abstraction layer for API calls (e.g., `authService`).

**Tech Stack:** React 18, Vite, Material UI (MUI), React Router DOM.

### ⚙️ Backend Structure (`/backend`)
The backend is a high-performance ASGI web server.
- **`app/main.py`**: The application entry point, configuring CORS, WebSockets, and including routers.
- **`app/database.py`**: SQLAlchemy engine configuration and DB session management.
- **`app/models/`**: SQLAlchemy ORM models defining the database schema.
- **`app/schemas/`**: Pydantic models for data validation, serialization, and API request/response typing.
- **`app/routes/`**: API endpoints separated by domain (e.g., `auth`, `users`, `reviews`).
- **`app/websocket.py`**: WebSocket connection manager for live broadcasting.

**Tech Stack:** FastAPI, Uvicorn, SQLAlchemy, Pydantic, Passlib (Bcrypt), PyJWT.

---

## 🗄️ Database Connection & Structure
The platform uses **PostgreSQL** as its primary data store. 
- **ORM (Object-Relational Mapping):** We use SQLAlchemy to interact with the database using Python objects rather than raw SQL strings. This prevents SQL injection and makes the codebase maintainable.
- **Connection Pooling:** SQLAlchemy manages a pool of connections to the database, ensuring efficient resource usage under high load.
- **Relationships:** The schema heavily utilizes Foreign Keys to map relationships (e.g., One-to-Many from `User` to `PerformanceReview`).

---

## 🚀 Deployment Strategy: Why these tools?

### 1. Vercel (Frontend Hosting)
**Why Vercel?** Vercel is highly optimized for React and Vite applications. It provides a global Edge Network (CDN), meaning the frontend assets are cached in servers all over the world. When a user visits the site, it loads instantly from the server closest to their physical location. It also offers seamless CI/CD (Continuous Integration/Continuous Deployment) directly from GitHub.

### 2. Render (Backend & Database Hosting)
**Why Render?** Render is an excellent Platform-as-a-Service (PaaS) for hosting Dockerized applications, Python servers, and managed PostgreSQL databases. We use Render because it allows us to deploy our FastAPI backend and our PostgreSQL database in the same network environment, reducing latency. 

### 3. Cron-job.org (Keep-Alive Service)
**Why Cron-job?** We are utilizing Render's "Free Tier" for hosting our backend web service. Render puts free web services to "sleep" after 15 minutes of inactivity to save server resources. When a service goes to sleep, the next user to visit the site will experience a 30-50 second delay (a "cold start") while the server spins back up. 
To prevent this terrible user experience, we use `cron-job.org` to send an automated HTTP request to our API every 10 minutes. This tricks the Render server into thinking there is constant traffic, keeping the server awake 24/7 so the app is always blazing fast.
