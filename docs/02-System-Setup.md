# 2. System Setup Instructions

## Prerequisites
Before starting, make sure you have the following installed:  
- **Operating System**: Windows, macOS, or Linux  
- **Node.js**: v20.x LTS (check with `node -v`)  
- **npm**: bundled with Node.js (check with `npm -v`)  
- **PostgreSQL**: v14+ (check with `psql --version`)  
- **Git**: to clone/download repository  
- **Azure CLI**: if deploying to Azure  

You will also need:  
- A `.env` file for both backend and frontend (contains environment variables).  
- A PostgreSQL user with `CREATEDB` privileges.  

---

## Backend Setup

### 1. Install dependencies
```bash
cd slotly-backend
npm install
```

### 2. Configure Environment Variables
Create a file named `.env` inside `slotly-backend/`:  
```
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_DATABASE=slotlydb
PGSSLMODE=disable
JWT_SECRET=slotly-secret
```

> ⚠️ Replace `your_password` with your actual PostgreSQL password.  
> ⚠️ `JWT_SECRET` should be a long random string in production.  

### 3. Run Backend
```bash
npm run dev
```
Validation:  
- Visit [http://localhost:3000/health](http://localhost:3000/health)  
- Expected response: `200 OK` + `"Slotly running"`  

---

## Frontend Setup

### 1. Install dependencies
```bash
cd slotly-frontend
npm install
```

### 2. Configure Environment Variables
Create a `.env` file inside `slotly-frontend/`:  
```
VITE_API_BASE_URL=http://localhost:3000
```

> ⚠️ In production, change this to your deployed backend URL (e.g. `https://slotly01.azurewebsites.net`).  

### 3. Run Frontend
```bash
npm run dev
```
Validation:  
- Visit [http://localhost:5173](http://localhost:5173)  
- You should see the Slotly homepage load.  

---

## Database Setup

### 1. Create Database
Login to PostgreSQL (e.g. using `psql`):  
```sql
CREATE DATABASE slotlydb;
```

### 2. Create Tables
Run schema creation SQL (either via migration script or manually). Example:

```sql
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50),
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(200) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tasks table
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  title VARCHAR(255),
  status VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Schedule table
CREATE TABLE schedule (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  title VARCHAR(255),
  start_time TIMESTAMP,
  end_time TIMESTAMP
);

-- Requests table
CREATE TABLE requests (
  id SERIAL PRIMARY KEY,
  from_user INT REFERENCES users(id),
  to_user INT REFERENCES users(id),
  status VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Validation:  
- Run `\dt` in `psql` → tables (`users`, `tasks`, `schedule`, `requests`) should exist.  

---

## Deployment

### Backend (Azure App Service)
1. Push code to GitHub (slotly-backend repo).  
2. In Azure Portal → Create **App Service** → Node.js 20 LTS.  
3. Set startup command:  
   ```
   node server.js
   ```  
4. Configure **Application Settings**: add env vars (`DB_*`, `JWT_SECRET`, etc.).  
5. Configure **Health Check** path → `/health`.  
6. Deploy using GitHub Actions or Azure CLI.  

Validation:  
- Visit `https://slotly01.azurewebsites.net/health` → should return `200 OK`.  

### Frontend (Azure Static Web Apps)
1. Push code to GitHub (slotly-frontend repo).  
2. In Azure Portal → Create **Static Web App**.  
3. Build command:  
   ```
   npm run build
   ```  
4. Output folder:  
   ```
   dist
   ```  
5. Configure environment variable:  
   ```
   VITE_API_BASE_URL=https://slotly01.azurewebsites.net
   ```  
6. Deploy automatically via GitHub Actions.  

Validation:  
- Visit your Static Web App domain → Slotly homepage should load.  
- Check network requests → API calls point to backend domain.  

---

## Validation Checklist

- [ ] Backend `/health` returns 200  
- [ ] Frontend homepage loads successfully  
- [ ] Signup/Login works (tested via Postman & UI)  
- [ ] Checklist tasks persist  
- [ ] Calendar events save & reload correctly  
- [ ] Share link works in both Public and Private mode  
