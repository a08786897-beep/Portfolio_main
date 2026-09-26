# Anshul Arora Portfolio

This repository keeps the original single-page portfolio design in `index.html` and `styles.css`. Its JavaScript now loads portfolio content and sends forms to the Express API. `Backend/` contains the Node.js, Express, and MongoDB application; `admin.html` is the authenticated content-management interface.

## Requirements

- Node.js 18 or newer and npm
- MongoDB (local MongoDB or a MongoDB Atlas database)

## Configure

1. If `Backend/.env` does not exist, create it from the example:

   ```powershell
   Copy-Item Backend\.env.example Backend\.env
   ```

   A local `Backend/.env` already exists in this workspace. Keep it untracked, review its values locally, and update it without copying over it.
2. Set `MONGO_URI` to your MongoDB connection string; set `JWT_SECRET` to a random secret of at least 32 characters; set `ADMIN_EMAIL` and a unique `ADMIN_PASSWORD` of at least 12 characters. Keep credentials only in `Backend/.env`.
3. Set `CORS_ORIGINS` to the exact origins used to serve the frontend. The defaults allow the Express origin on port 5000 and VS Code Live Server on port 5502.
4. Use a MongoDB database user with access limited to this portfolio database. Never commit `.env` or paste its values into source control.

The existing local `.env` contains credentials for other services as well as database settings. Rotate those credentials with their respective providers, remove values that are not needed, and keep the replacement values private. The repository ignores `Backend/.env`.

## Install and start

From the repository root, run these commands in a PowerShell terminal:

```powershell
Set-Location Backend
npm install
npm run seed
npm run create-admin
npm start
```

Run the automated API checks (they use isolated model stubs and do not access MongoDB):

```powershell
Set-Location Backend
npm test
```

The seed command adds the existing portfolio projects and skills as MongoDB records, plus starter profile, education, and service content. It only seeds an empty collection; it will not overwrite records you have already managed. Edit or remove any starter records from the admin dashboard.

Make sure your local MongoDB service is running before the seed and server commands, or use a MongoDB Atlas URI. `/api/health` returns HTTP 503 until a database connection is active.

Open the site at `http://localhost:5000` and the dashboard at `http://localhost:5000/admin.html`. Express serves the existing root-level frontend and API from one origin. Alternatively, start VS Code Live Server on port 5502; add its exact origin to `CORS_ORIGINS` if it differs from the defaults.

The administrator credentials are read from `Backend/.env`. `npm run create-admin` creates the account, or updates its password if the email already exists. There is no public registration endpoint. Passwords are hashed with bcrypt. Admin access tokens are stored only in the current browser tab's session storage; logging out revokes existing tokens by incrementing the account's token version.

For development auto-restart, use `npm run dev` instead of `npm start`.

## Frontend/API configuration

`js/api.js` is the one API configuration and fetch client. By default it uses the current origin's `/api` path. If the frontend is deployed separately, define `window.PORTFOLIO_API_BASE_URL` before loading `js/api.js` with the deployed API base URL (for example `https://api.example.com/api`) and allow the frontend origin in `CORS_ORIGINS`.

Public projects, skills, education, experience, services, and profile details are read from MongoDB. Contact and feedback submissions are validated by both browser and server, then saved in MongoDB. A failed API request is shown as an error; the interface does not report a successful submission unless the API confirms it.

## REST API

All responses use JSON except successful delete responses, which return `204 No Content`.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/health` | Public | Check that the server is connected and running |
| GET | `/api/portfolio` | Public | Read profile, skills, education, experience, and services |
| GET | `/api/projects` | Public | List portfolio projects |
| POST | `/api/submissions/contact` | Public, rate-limited | Save a contact message |
| POST | `/api/submissions/feedback` | Public, rate-limited | Save visitor feedback |
| POST | `/api/auth/login` | Public, rate-limited | Authenticate the admin |
| POST | `/api/auth/logout` | Admin bearer token | Revoke the current admin token version |
| GET | `/api/admin/messages` | Admin bearer token | List contact messages |
| PATCH / DELETE | `/api/admin/messages/:id` | Admin bearer token | Mark read or delete a message |
| GET / DELETE | `/api/admin/feedback` / `:id` | Admin bearer token | List or delete feedback |
| GET / PATCH | `/api/admin/profile` | Admin bearer token | Read or update profile content |
| GET / POST | `/api/admin/projects` | Admin bearer token | List or create projects |
| PUT / DELETE | `/api/admin/projects/:id` | Admin bearer token | Update or delete a project |
| GET / POST | `/api/admin/skills` | Admin bearer token | List or create skills |
| PUT / DELETE | `/api/admin/skills/:id` | Admin bearer token | Update or delete a skill |
| GET / POST | `/api/admin/experience` | Admin bearer token | List or create experience |
| PUT / DELETE | `/api/admin/experience/:id` | Admin bearer token | Update or delete experience |
| GET / POST | `/api/admin/education` | Admin bearer token | List or create education |
| PUT / DELETE | `/api/admin/education/:id` | Admin bearer token | Update or delete education |
| GET / POST | `/api/admin/services` | Admin bearer token | List or create services |
| PUT / DELETE | `/api/admin/services/:id` | Admin bearer token | Update or delete a service |

Admin requests use `Authorization: Bearer <token>`. The dashboard handles this automatically.

## Smoke-test the API

With the server running, check public data:

```powershell
Invoke-RestMethod http://localhost:5000/api/health
Invoke-RestMethod http://localhost:5000/api/projects
Invoke-RestMethod http://localhost:5000/api/portfolio
```

Submit a contact message:

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/submissions/contact `
  -ContentType 'application/json' `
  -Body '{"fullName":"Test Visitor","email":"visitor@example.com","phone":"","message":"This is a portfolio contact API test."}'
```

Submit feedback:

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/submissions/feedback `
  -ContentType 'application/json' `
  -Body '{"name":"Test Visitor","subject":"Portfolio test","message":"This is a portfolio feedback API test."}'
```

Log in and list admin messages (the token is held in the dashboard after login):

```powershell
$login = Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/auth/login `
  -ContentType 'application/json' `
  -Body ('{"email":"' + $env:PORTFOLIO_ADMIN_EMAIL + '","password":"' + $env:PORTFOLIO_ADMIN_PASSWORD + '"}')
$headers = @{ Authorization = "Bearer $($login.data.token)" }
Invoke-RestMethod -Headers $headers http://localhost:5000/api/admin/messages
```

Set `PORTFOLIO_ADMIN_EMAIL` and `PORTFOLIO_ADMIN_PASSWORD` in the PowerShell session before running that example; do not place credentials in source files or commit terminal transcripts. The dashboard is the recommended login path.
