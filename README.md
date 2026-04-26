# 🔐 Auth API (Node.js + Express + JWT)

A secure authentication API built with **Node.js**, **Express**, **MongoDB**, and **JWT (JSON Web Tokens)**.  
It supports user registration, login, protected routes, and token refresh functionality.

---

## 🚀 Features

- User Signup (Register)
- User Login (Authentication)
- JWT-based Authorization
- Protected Route (`/profile`)
- Refresh Token System (HTTP-only cookies)
- Password Hashing (SHA-256)
- Middleware-based Route Protection
- Logout from current device
- Logout from all devices
- Session tracking with IP & User-Agent
- Refresh Token Rotation
- Session Revocation Support

---

## 📁 Project Structure
AUTH/
│
├── src/
│ ├── config/
│ │ └── database.js
│ │
│ ├── controller/
│ │ └── auth.controller.js
│ │
│ ├── middleware/
│ │ └── auth.middleware.js
│ │
│ ├── module/
│ │ ├── user.module.js
│ │ └── session.module.js
│ │
│ ├── routes/
│ │ └── auth.routes.js
│ │
│ └── app.js
│
├── server.js
├── .env
├── package.json

---

## ⚙️ Installation

```bash
git clone (https://github.com/krishankantmishra/auth)
cd AUTH
npm install

## 🔑 Environment Variables

Create a .env file in the root directory:

PORT=3000
JWT_SECRET=your_secret_key
MONGO_URI=your_mongodb_connection_string

## ▶️ Run the Server 

npm run dev

Server will run at:

http://localhost:3000

## 📡 API Endpoints

🔹 Auth Routes (/api/auth)

1️⃣ Signup

🔹 POST /api/auth/signup

Request Body:

{
  "username": "john",
  "email": "john@example.com",
  "password": "123456"
}
2️⃣ Login

POST /api/auth/login

Request Body:

{
  "email": "john@example.com",
  "password": "123456"
}

Response:

Returns accessToken
Sets refreshToken in HTTP-only cookie

3️⃣ Get Profile (Protected Route)

GET /api/auth/profile

Headers:

Authorization: Bearer <accessToken>

4️⃣ Refresh Token

GET /api/auth/refresh-token

Uses cookie (refreshToken)

Returns new accessToken

5️⃣ Logout (Current Device)

POST /api/auth/logout

Revokes current session

Clears refresh token cookie

6️⃣ Logout All Devices

POST /api/auth/logout-all

Headers:

Authorization: Bearer <accessToken>

Revokes all active sessions

Clears refresh token cookie

🔐 Authentication Flow

User logs in → receives:
Access Token (15 min expiry)
Refresh Token (7 days, stored in cookie)

A session is created in MongoDB storing:

User ID
Hashed refresh token
IP address
User-Agent
Revoked status

Access protected routes using:

Authorization: Bearer <accessToken>

Middleware verifies:

JWT validity
Session exists in DB
Session is not revoked

When access token expires:
Call /api/auth/refresh-token
Get a new access token

🛡️ Security Notes

Refresh token stored in HTTP-only cookies
Access tokens expire in 15 minutes
Refresh tokens expire in 7 days
Passwords hashed using SHA-256
Refresh Token Rotation
Session Revocation Support
Device-based session tracking

🧑‍💻 Tech Stack

Node.js
Express.js
MongoDB
JSON Web Token (JWT)

📌 Author

Krishan Kant Mishra
