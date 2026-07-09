# Multi-Tenant Feature Flag Management System

## Problem Statement

This project is a small SaaS-like feature flag management system. A super admin creates organizations, organization admins manage feature flags for their own organization, and end users can check whether a feature is enabled for a given organization.

## Tech Stack

Backend:
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT authentication
- bcrypt password hashing
- dotenv
- cors
- express-validator

Frontend:
- React.js with Vite
- Axios
- React Router
- Plain CSS

## Architecture

The backend exposes a REST API on port `5000`. JWTs carry the authenticated user's role and organization scope. Protected routes use authentication and role middleware before calling route handlers.

There are three independent frontend apps:
- `super-admin-app` for creating and listing organizations.
- `admin-app` for organization admin signup, login, and feature flag management.
- `user-app` for public feature flag checks.

## Folder Structure

```text
feature-flag-system/
  backend/
  super-admin-app/
  admin-app/
  user-app/
  README.md
```

## Roles

Super Admin:
- Logs in with static credentials from backend `.env`.
- Creates organizations.
- Lists all organizations.

Organization Admin:
- Signs up using an existing organization slug.
- Logs in with email and password.
- Creates, edits, toggles, and deletes feature flags only for their organization.

End User:
- Does not need an account.
- Enters organization slug and feature key to check whether a feature is enabled.

## API Documentation

Health:
- `GET /api/health`

Super Admin:
- `POST /api/super-admin/login`
- Body: `{ "email": "superadmin@example.com", "password": "admin123" }`
- Response: `{ "token": "...", "user": { ... } }`

Organizations:
- `POST /api/organizations`
- Protected: `SUPER_ADMIN`
- Body: `{ "name": "Acme Corp", "slug": "acme" }`

- `GET /api/organizations`
- Protected: `SUPER_ADMIN`

Organization Admin:
- `POST /api/admin/signup`
- Body: `{ "name": "Admin", "email": "admin@acme.com", "password": "password123", "organizationSlug": "acme" }`

- `POST /api/admin/login`
- Body: `{ "email": "admin@acme.com", "password": "password123" }`
- Response: `{ "token": "...", "user": { ... } }`

Feature Flags:
- `GET /api/feature-flags`
- Protected: `ORG_ADMIN`

- `POST /api/feature-flags`
- Protected: `ORG_ADMIN`
- Body: `{ "featureKey": "dark_mode", "description": "Enable dark mode", "enabled": true }`

- `PUT /api/feature-flags/:id`
- Protected: `ORG_ADMIN`
- Body: `{ "featureKey": "dark_mode", "description": "Enable dark mode", "enabled": false }`

- `DELETE /api/feature-flags/:id`
- Protected: `ORG_ADMIN`

End User:
- `POST /api/check-feature`
- Body: `{ "organizationSlug": "acme", "featureKey": "dark_mode" }`
- Response:

```json
{
  "organization": "Acme Corp",
  "featureKey": "dark_mode",
  "enabled": true,
  "message": "Feature is enabled"
}
```

## Database Schema

Organization:
- `name`: required, unique string
- `slug`: required, unique lowercase string
- `createdAt`: timestamp

User:
- `name`: required string
- `email`: required unique lowercase string
- `passwordHash`: bcrypt hash
- `role`: `SUPER_ADMIN`, `ORG_ADMIN`, or `END_USER`
- `organizationId`: optional reference to Organization
- `createdAt`: timestamp

FeatureFlag:
- `organizationId`: required reference to Organization
- `featureKey`: required lowercase string
- `description`: optional string
- `enabled`: boolean
- `createdBy`: required reference to User
- `createdAt` and `updatedAt`: timestamps

`FeatureFlag` has a unique compound index on `organizationId + featureKey`, preventing duplicate feature keys inside the same organization.

## Setup Instructions

Install MongoDB locally or use a hosted MongoDB connection string.

Create `backend/.env` from the example:

```bash
cd feature-flag-system/backend
cp .env.example .env
```

Update `MONGO_URI` and `JWT_SECRET` in `.env`.

## Install Dependencies

```bash
cd feature-flag-system/backend
npm install

cd ../super-admin-app
npm install

cd ../admin-app
npm install

cd ../user-app
npm install
```

## Run Backend

```bash
cd feature-flag-system/backend
npm run dev
```

Backend runs at `http://localhost:5000`.

## Run Each Frontend

```bash
cd feature-flag-system/super-admin-app
npm run dev
```

Super Admin app runs at `http://localhost:5173`.

```bash
cd feature-flag-system/admin-app
npm run dev
```

Organization Admin app runs at `http://localhost:5174`.

```bash
cd feature-flag-system/user-app
npm run dev
```

End User app runs at `http://localhost:5175`.

Each frontend can override the backend URL with:

```bash
VITE_API_URL=http://localhost:5000/api
```

## Environment Variables

Backend:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/feature_flag_system
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=1d
SUPER_ADMIN_EMAIL=superadmin@example.com
SUPER_ADMIN_PASSWORD=admin123
CLIENT_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:5175
```

## Sample Login Credentials and Data

Super Admin:
- Email: `superadmin@example.com`
- Password: `admin123`

Example organization:
- Name: `Acme Corp`
- Slug: `acme`

Example feature:
- Feature key: `dark_mode`
- Enabled: `true`

## Testing Flow

1. Start MongoDB and the backend.
2. Open `http://localhost:5173/login`.
3. Log in as the super admin.
4. Create organization `Acme Corp` with slug `acme`.
5. Open `http://localhost:5174/signup`.
6. Create an organization admin with organization slug `acme`.
7. Log in to the organization admin app.
8. Create feature flag `dark_mode` and set enabled to `true`.
9. Open `http://localhost:5175`.
10. Enter organization slug `acme` and feature key `dark_mode`.
11. Confirm the result says the feature is enabled.

## Engineering Decisions

Why JWT:
- JWT keeps API authentication stateless and easy for three separate frontend apps to consume.

Why MongoDB:
- MongoDB fits the small SaaS data model well and makes it easy to store organizations, users, and feature flags with flexible documents.

Why role-based middleware:
- Role checks are centralized, readable, and reusable across protected API routes.

Why feature flags are scoped by organization:
- Multi-tenant systems must isolate tenant data. Each organization can use the same feature key without colliding with another organization.

## Future Improvements

- Audit logs for feature flag changes.
- Caching with Redis for high-volume feature checks.
- Rate limiting on login and public check routes.
- Docker and Docker Compose for local setup.
- Unit and integration tests.
- Better UI with a component system.
- Organization user management.
