# 3. Issue Diagnosis, Research, Resolution, and Sharing

## Issue 1: Azure 503 Application Error
- **Environment**: Azure App Service (Backend)  
- **Description**: After deployment, the endpoint `/health` returned `503 Service Unavailable` instead of `200 OK`.  
- **Expected vs. Actual**: Expected health check success, but Azure displayed an “Application Error” page.  
- **Steps to Reproduce**: Deploy backend to Azure App Service → Open `https://slotly01.azurewebsites.net/health` → 503 error.  
- **Diagnosis**: Application was listening on a hardcoded port `3000` instead of Azure’s injected `process.env.PORT`.  
- **Research**: Reviewed Azure App Service Node.js docs, StackOverflow threads on Node.js deployment, and OpenAI ChatGPT troubleshooting suggestions.  
- **Resolution**: Modified code from `app.listen(3000)` to:  
  ```js
  app.listen(process.env.PORT || 3000, () => {
    console.log(`Server running`);
  });
  ```  
- **Outcome Verification**: Redeployed backend. Visiting `/health` returned `200 OK` and the message `"Slotly running"`.

---

## Issue 2: Login Fails with Correct Credentials
- **Environment**: Local backend and frontend, later tested on Azure.  
- **Description**: User login was rejected even when providing the correct email and password.  
- **Expected vs. Actual**: Expected to log in successfully and receive JWT. Actual result: `401 Unauthorized`.  
- **Steps to Reproduce**:  
  1. Signup with email/password.  
  2. Attempt login with same credentials.  
  3. Response: Invalid email or password.  
- **Diagnosis**: Passwords were stored as plain text during signup but login attempted `bcrypt.compare`, leading to mismatch.  
- **Research**: Checked bcrypt official documentation, GitHub issues, and blog posts on secure authentication.  
- **Resolution**: Updated signup route to hash passwords before saving:  
  ```js
  const hashed = await bcrypt.hash(password, 10);
  ```  
  Used `bcrypt.compare` for login.  
- **Outcome Verification**: Retested signup + login. Login returned `200 OK` with JWT token in response body.

---

## Issue 3: CORS Blocked by Browser
- **Environment**: Frontend deployed on Azure Static Web Apps, backend running on Azure App Service.  
- **Description**: Browser blocked API requests with error: `CORS policy: No 'Access-Control-Allow-Origin' header`.  
- **Expected vs. Actual**: Expected API responses, but instead browser blocked calls.  
- **Steps to Reproduce**: Open frontend deployed URL → Login or fetch tasks → Observe network error in browser console.  
- **Diagnosis**: Missing frontend domain in backend CORS configuration.  
- **Research**: Reviewed MDN CORS documentation, Express.js CORS middleware GitHub page.  
- **Resolution**: Updated backend code:  
  ```js
  app.use(cors({
    origin: ["https://slotly01fe.z9.web.core.windows.net", "http://localhost:5173"],
    credentials: true
  }));
  ```  
- **Outcome Verification**: After redeploying backend, browser requests from both localhost and deployed frontend succeeded.

---

## Issue 4: JSON Parse Error
- **Environment**: Local development (frontend + backend).  
- **Description**: Console showed `Unexpected token <` and API responses failed.  
- **Expected vs. Actual**: Expected valid JSON responses from backend, but HTML error pages were returned.  
- **Steps to Reproduce**: Run frontend locally with wrong `VITE_API_BASE_URL` → Observe failed login/signup requests.  
- **Diagnosis**: Frontend was pointing to frontend domain instead of backend API, causing HTML to be returned instead of JSON.  
- **Research**: Checked Vite docs, searched error on StackOverflow.  
- **Resolution**: Corrected `.env` in frontend:  
  ```env
  VITE_API_BASE_URL=http://localhost:3000
  ```  
- **Outcome Verification**: Restarted frontend, API requests returned valid JSON as expected.
