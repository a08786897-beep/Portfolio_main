# Anshul Arora Portfolio

A responsive, single-page portfolio backed by an Express API and MongoDB. The static frontend is served by the same Node.js application as the public API.

## Requirements

- Node.js 18 or newer and npm
- MongoDB locally or a MongoDB Atlas database

## Configure and run

1. If `Backend\.env` does not exist, copy `Backend\.env.example` to `Backend\.env`. Otherwise, keep the existing file and update `MONGO_URI` in place if needed. Keep `.env` private and untracked.
2. In PowerShell, install dependencies, optionally seed starter portfolio content, and start the API:

   ```powershell
   Set-Location Backend
   npm install
   npm run seed
   npm start
   ```

3. Open `http://localhost:5000`. The health endpoint is `http://localhost:5000/api/health`.

The seed command only fills empty collections, apart from clearing known broken legacy portfolio links. Review its example project, profile, skills, education, and services before using it as production content. It does not create experience or certification records. Portfolio sections with no records show an empty state instead of fabricated entries. Add portfolio records directly to MongoDB; public API write access is limited to contact and feedback submissions.

For disposable local development only, `ALLOW_IN_MEMORY_DATABASE=true` permits temporary in-memory data when MongoDB is unavailable. Data is lost when the process exits; do not enable this in production.

To serve the frontend separately with VS Code Live Server, add its exact origin to `CORS_ORIGINS` in `Backend\.env`. The default origins are for local development.

## Tests and checks

From `Backend`:

```powershell
npm test
npm run check
```

The API tests use isolated model stubs and do not write to the configured MongoDB database.

## Public API

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Report server and database availability |
| GET | `/api/portfolio` | Read profile, skills, education, experience, services, and certifications |
| GET | `/api/projects` | Read project records |
| POST | `/api/submissions/contact` | Validate and save a contact message |
| POST | `/api/submissions/feedback` | Validate and save visitor feedback |

Submission endpoints are rate-limited and validate input on the server. They save messages to MongoDB; no email-delivery service is configured.

## Portfolio content

The public API reads the existing MongoDB collections. `npm run seed` can add starter data to empty profile, project, skill, education, and service collections. Experience and certifications are optional collections; project and profile links should use valid HTTP(S) URLs. The resume is offered only when the profile has a valid same-origin path or HTTP(S) URL. Add a verified LinkedIn URL to the profile's `socialLinks` to show that link.

If the frontend and API are deployed on different origins, define `window.PORTFOLIO_API_BASE_URL` before loading `js/api.js` and allow the frontend's exact origin in `CORS_ORIGINS`.
