# Slotly - Full Stack Scheduling & Task Management App

## Overview
Slotly is a full-stack web application for time management and booking.  
Frontend: React + Tailwind CSS  
Backend: Node.js + Express + PostgreSQL  
Authentication: JWT

---

## Features
- Dashboard: Weekly calendar with draggable time slots
- Checklist: Task tracking with real-time completion stats
- Share: Public/Private calendar sharing link
- Auth: Signup & login with password hashing

---

## Tech Stack
Frontend: React, Chart.js, FullCalendar  
Backend: Node.js, Express.js, JWT, bcrypt  
Database: PostgreSQL

---

## Installation & Run (Local)

### 1. Backend
~~~bash
cd backend
npm install
npm run dev
~~~

### 2. Frontend
~~~bash
cd frontend
npm install
npm start
~~~

---

## Database Setup
1. Create PostgreSQL database.
2. Run the SQL script to create tables:
   ~~~bash
   psql -d slotly -f db/schema.sql
   ~~~
3. (Optional) Seed with sample data:
   ~~~bash
   psql -d slotly -f db/seed.sql
   ~~~
4. Set environment variables (see `.env.example`):
   ~~~env
   DATABASE_URL=postgres://<username>:<password>@localhost:5432/slotly
   JWT_SECRET=<your_jwt_secret>
   ~~~

---

## API Endpoints

### Auth
POST /api/signup – Create user  
POST /api/login – Login and get JWT

### Tasks
GET /api/tasks – Get tasks (JWT required)  
POST /api/tasks – Add task (JWT required)  
PUT /api/tasks/:id – Update task (JWT required)  
DELETE /api/tasks/:id – Delete task (JWT required)

### Schedule
GET /api/schedule – Get schedule  
POST /api/schedule – Save schedule (JWT required)

---

