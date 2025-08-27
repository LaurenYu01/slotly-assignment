# Slotly API Documentation

This document provides a summary of the main API endpoints used in the Slotly project, including their request methods, expected input, authentication requirements, and example responses.

---

## Base URL

```
http://localhost:5000/api
```

---

## 1. User Signup

**Endpoint:** `POST /signup`  
**Description:** Register a new user account.

### Request Headers
```
Content-Type: application/json
```

### Request Body
```json
{
  "username": "test9999",
  "email": "test9999@example.com",
  "password": "123456"
}
```

### Response Example
```json
{
  "message": "User created",
  "user": {
    "id": 46,
    "username": "test9999",
    "email": "test9999@example.com"
  }
}
```

---

## 2. User Login

**Endpoint:** `POST /login`  
**Description:** Authenticate a user and receive a JWT token.

### Request Headers
```
Content-Type: application/json
```

### Request Body
```json
{
  "email": "jolene@example.com",
  "password": "123456"
}
```

### Response Example
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJqb2xlbmVAZXhhbXBsZS5jb20iLCJpYXQiOjE3NTM5NzU4NTIsImV4cCI6MTc1NDU4MDY1Mn0.cEqZFKKRi1oNh7UOMEP5CbUuo_4bnS44I83jpaq2Czg",
  "username": "jolene"
}
```

---

## 3. Save Checklist Tasks

**Endpoint:** `POST /tasks`  
**Description:** Save user task checklist items.  
**Authentication:** Required 

### Request Headers
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJqb2xlbmVAZXhhbXBsZS5jb20iLCJpYXQiOjE3NTM5NzU4NTIsImV4cCI6MTc1NDU4MDY1Mn0.cEqZFKKRi1oNh7UOMEP5CbUuo_4bnS44I83jpaq2Czg
```

### Request Body Example
```json
[
  {
    "title": "Finish report",
    "status": "done"
  },
  {
    "title": "Stretch",
    "status": "skipped"
  }
]
```

### Response Example
```json
{
  "message": "Checklist saved"
}
```

---

## 4. Get All Checklist Tasks

**Endpoint:** `GET /tasks`  
**Description:** Retrieve the list of saved checklist tasks.  
**Authentication:** Required

### Request Headers
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJqb2xlbmVAZXhhbXBsZS5jb20iLCJpYXQiOjE3NTM5NzU4NTIsImV4cCI6MTc1NDU4MDY1Mn0.cEqZFKKRi1oNh7UOMEP5CbUuo_4bnS44I83jpaq2Czg
```

### Response Example
```json
[
  {
    "id": null,
    "title": "Finish report",
    "status": "done"
  },
  {
    "id": null,
    "title": "Stretch",
    "status": "skipped"
  }
]
```

---

## 5. Get Task Statistics

**Endpoint:** `GET /tasks/stats`  
**Description:** Retrieve aggregated task statistics for the current user.  
**Authentication:** Required

### Request Headers
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJqb2xlbmVAZXhhbXBsZS5jb20iLCJpYXQiOjE3NTM5NzU4NTIsImV4cCI6MTc1NDU4MDY1Mn0.cEqZFKKRi1oNh7UOMEP5CbUuo_4bnS44I83jpaq2Czg
```

### Response Example
```json
[
  {
    "date": "2025-07-31",
    "done": "1",
    "skipped": "1",
    "postponed": "1"
  }
]
```
