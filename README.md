# Athletix MERN Project

This folder contains the existing frontend and Express backend:

- `frontend/` — React 19 + TypeScript + Vite/TanStack Start app. Operational screens use the Express API; static academy copy and images remain in the frontend.
- `backend/` — Express + TypeScript API, MongoDB/Mongoose connection, health endpoints, Phase 2 model registry and development seed.

The API includes health checks, session authentication, public content and inquiries, role-restricted academy resource APIs, scoped coach and portal reads, manual fee payments, and basic reports. The frontend now uses these APIs for authentication, public sports/achievements/events/enrollment, admin resources, and player/parent portal views. Static academy copy and images remain in the frontend.

## Requirements

- Node.js 20 or newer and npm.
- MongoDB running locally, or MongoDB Atlas and a connection URI.

## Configure MongoDB

### Local MongoDB

Install and start MongoDB Community Server. The default local URI selects the `athletix` database:

```text
mongodb://127.0.0.1:27017/athletix
```

### MongoDB Atlas

Create a cluster and database user, allow your development machine IP in Network Access, and copy the cluster URI. Put it in the local `backend/.env`; URL-encode special characters in credentials. Do not commit the URI.

## Run the backend

```sh
cd backend
cp .env.example .env
```

Set `MONGODB_URI` in `backend/.env`, then run:

```sh
npm install
npm run dev
```

The API requires `SESSION_SECRET` (at least 32 random characters). Generate it with:

```sh
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

`SESSION_COOKIE_NAME`, `SESSION_MAX_AGE_MS`, `SESSION_SAME_SITE`, and `TRUST_PROXY_HOPS` have defaults shown in `.env.example`. Production cookies are Secure and HttpOnly. For HTTPS behind a reverse proxy, configure `TRUST_PROXY_HOPS` to the exact trusted hop count; leave it `0` for direct/local development. Production requires an explicit `FRONTEND_ORIGIN` containing exact HTTPS browser origins (comma-separated, no paths or trailing slash); localhost origins are rejected. Cross-site deployments require HTTPS and `SESSION_SAME_SITE=none`. The API returns the CSRF token from `/api/v1/auth/me`; the frontend sends it on writes, while credentialed CORS permits only the configured origins.

The server connects to MongoDB before listening. Health checks:

```sh
curl http://localhost:4000/api/v1/health
curl http://localhost:4000/api/v1/health/db
```

The database health endpoint reports connection state only and does not return credentials. `PORT` defaults to `4000`; in development and tests `FRONTEND_ORIGIN` defaults to `http://localhost:5173` and accepts comma-separated origins.

## Phase 3 authentication

Endpoints are under `/api/v1/auth`:

- `GET /me` returns the server-verified account (or `user: null`) and a CSRF token.
- `POST /login` accepts `{ "email": "...", "password": "..." }`; send the CSRF token in `X-CSRF-Token` and the allowed `Origin` header.
- `POST /logout` requires the same CSRF and origin headers and invalidates the server session.

Sessions use a random opaque cookie backed by MongoDB's `sessions` collection, with an HttpOnly cookie and rolling idle expiry. Passwords use Argon2id. All protected handlers derive role/profile identity from the session and current User/profile records. The reusable middleware includes role checks and self/parent-child/coach-team scope primitives used by feature APIs. Login and public enrollment submissions are rate limited. Never log passwords, hashes, cookies, session IDs, or secret values.

There is no public signup or password reset. Create the first admin manually with an explicit opt-in command:

```sh
cd backend
npm run auth:provision-admin -- --confirm-admin-provisioning
```

Run this only from a trusted interactive terminal after configuring the intended `MONGODB_URI`. The command asks for an email and hidden password twice, requires a 12-character minimum, refuses if any admin already exists, and creates no demo accounts. It does not run on server startup. The Phase 2 seed does not create login users and is not required.

Coach, player, and parent profiles also need login accounts linked to them. First create the profile from the authenticated admin dashboard, then provision it from a trusted terminal:

```sh
cd backend
npm run auth:provision-account -- --role=coach --confirm-account-provisioning
# Or use --role=player or --role=parent
```

The command prompts for the profile email and a hidden password twice. It requires a 12-character password and refuses duplicate accounts or already-linked profiles. It stores only an Argon2id hash. It does not create public accounts or default credentials.

The frontend uses these endpoints through a credentialed API client. There is no public signup or hardcoded demo login. Provision an administrator explicitly using the command above; other role accounts must be provisioned for an existing profile.

For a compiled server:

```sh
npm run build
npm start
```

## Models and frontend ID mapping

Mongoose models and TypeScript document interfaces are in `backend/src/models/`; import them from `backend/src/models/index.ts`. MongoDB relationships use ObjectId refs. This is a backend data shape only: the frontend still uses its existing string IDs and demo adapter.

The seed script maps stable fixture keys (such as `p1`, `s1`, `ss1`) to deterministic ObjectIds using namespaced hashes. These frontend fixture IDs are keys only; they are not treated as ObjectIds. Mongo API endpoints require Mongo ObjectIds. The backend catalogue contains all six public sports and the five existing admin coaches/teams.

The legacy free-text achievement recipient becomes `recipientType` plus `playerId` or `teamId`. Legacy fee rows become `FeeRecord` obligations plus separate `Payment` transactions. Parent `childIds` become ObjectId references. Empty team assignments map to an absent optional `teamId`. `FeeRecord.status` retains the frontend `Paid`, `Pending`, and `Overdue` display states while actual payment entries are separate.

## Explicit development seed

The seed is not run on server startup. It upserts only deterministic demo ObjectIds; it does not clear collections or delete unrelated records. Re-running updates those same demo records. It seeds sports, coaches, teams, players, one parent with two children, sessions, attendance, matches, performance, achievements, fee plans/records, payment examples, announcements, and one clearly synthetic inquiry. It creates no User login accounts or ActivityAudit rows; authentication and audit actors are deferred to Phase 3.

To run, first ensure `.env` points at a development database. Then explicitly opt in:

```sh
cd backend
NODE_ENV=development npm run seed:dev -- --confirm-demo-seed
```

The command refuses to run if `NODE_ENV` is not exactly `development` or if the confirmation flag is missing. Never point a development seed at production data.

## Run the frontend separately

In another terminal:

```sh
cd frontend
npm install
npm run dev
```

Open Vite's displayed URL (normally `http://localhost:5173`). The frontend defaults to `http://localhost:4000/api/v1`. To point it elsewhere, create `frontend/.env.local` with:

```text
VITE_API_URL=http://localhost:4000/api/v1
```

Ensure the backend's `FRONTEND_ORIGIN` includes the exact frontend origin. Run the backend and frontend in separate terminals; browser API requests use the backend session cookie and CSRF token flow.

For production, configure `VITE_API_URL` as an absolute HTTPS API URL ending in `/api/v1`; the frontend production build fails when it is missing, malformed, insecure, or points at localhost. Configure backend `NODE_ENV=production` and an explicit HTTPS `FRONTEND_ORIGIN`. Also provide `MONGODB_URI` and `SESSION_SECRET` through the backend host's secret/environment configuration. Use `SESSION_SAME_SITE=none` for cross-site frontend/API deployments, and set `TRUST_PROXY_HOPS` to the actual trusted proxy count when TLS terminates at a reverse proxy. Never put backend secrets in `VITE_*` variables.

### Production environment variables

Set these in the hosting provider's environment configuration. These are names and requirements only; use the actual service values in the host dashboard.

| Variable | Required? | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | Yes, frontend build | Absolute HTTPS API URL ending in `/api/v1`; this is public browser configuration, never a secret. |
| `MONGODB_URI` | Yes, backend | Connection string for the intended hosted MongoDB database. |
| `SESSION_SECRET` | Yes, backend | Unique random secret of at least 32 characters; keep it private. |
| `FRONTEND_ORIGIN` | Yes in production, backend | Exact HTTPS browser origin(s), comma-separated, without path or trailing slash. |
| `NODE_ENV` | Set to `production` on backend | Enables production validation and secure cookies. |
| `PORT` | Optional | Backend listen port; defaults to `4000` when the host does not provide one. |
| `SESSION_COOKIE_NAME` | Optional | Session cookie name; defaults to `athletix.sid`. |
| `SESSION_MAX_AGE_MS` | Optional | Session idle lifetime in milliseconds; defaults to `28800000`. |
| `SESSION_SAME_SITE` | Optional by topology | Defaults to `lax`; set `none` for cross-site HTTPS frontend/API origins. |
| `TRUST_PROXY_HOPS` | Optional by topology | Defaults to `0`; set to the exact trusted reverse-proxy hop count when TLS terminates before Express. |

For cross-site deployments, the browser must allow credentialed CORS and third-party cookies, and the frontend must use the returned CSRF token for writes. The backend keeps sessions in MongoDB. Payment transactions use MongoDB transactions, so the production database must support transactions (Atlas or a replica set; a standalone MongoDB server is insufficient). No production host, domain, database URI, or secret has been configured or verified from this source checkout.

## Backend checks

From `backend/`:

```sh
npm test
npm run build
```

Tests cover health responses, 404 behavior, model validation, declared unique indexes, and anonymous denial on protected API groups. Auth integration tests run only when `MONGODB_TEST_URI` is explicitly set, and they verify that it targets the database named exactly `athletix_auth_test`; that isolated test database is dropped before and after the test. Never set it to your development or production URI. Example:

```sh
MONGODB_TEST_URI=mongodb://127.0.0.1:27017/athletix_auth_test npm test
```

Without that variable, database-backed auth tests are skipped. Tests do not run the Phase 2 seed or touch `athletix`.

## Feature API (Phase 4)

All paths below are prefixed by `/api/v1`. Success responses use `{ "data": ... }`; lists also include `{ "pagination": { "page", "limit", "total", "pages" } }`. Lists default to 25 and accept `page`, `limit` (maximum 100), `q`, and resource-specific filters. Errors use `{ "error": { "message": "..." } }`. Authenticated write requests follow the existing session, CSRF, and origin requirements.

| Group | Endpoints | Access |
| --- | --- | --- |
| Public catalogue | `GET /public/sports`, `GET /public/achievements`, `GET /public/announcements` | Public; active sports, featured achievements, published announcements |
| Enrollment | `POST /public/enrollment-inquiries` | Public, rate limited; sport must be active |
| Admin resources | `GET/POST /admin/resources/:resource`, `GET/PATCH/DELETE /admin/resources/:resource/:id` | Admin; closed resource list: sports, coaches, teams, players, parents, sessions, attendance, matches, performance, achievements, feePlans, fees, announcements, enrollmentInquiries |
| Admin activity | `GET /admin/activity` | Admin |
| Coach | `GET /coach/teams`; `GET /coach/teams/:teamId/{players,sessions,matches,performance}`; scoped session/match create, update, delete; session attendance `GET/PUT /coach/teams/:teamId/sessions/:sessionId/attendance`; performance create | Assigned coach only; ownership checked against authenticated profile |
| Player portal | `GET /portal/player`, `PATCH /portal/player/profile` | Signed-in player; profile edits limited to email, phone and emergency contacts |
| Parent portal | `GET /portal/parent/children`, `GET /portal/parent/children/:childId` | Signed-in parent; child link checked against stored relationship |
| Payments | `GET/POST /fees/:feeId/payments` | Admin; manual transactions; posting uses MongoDB transactions to prevent concurrent overpayment |
| Payment history | `GET /portal/player/payments`, `GET /portal/parent/children/:childId/payments` | Player self or linked parent |
| Reports | `GET /reports/dashboard`, `GET /reports/attendance.csv` | Admin; server-side CSV capped at 10,000 rows |

Admin CRUD uses an explicit resource registry and field allowlists, not arbitrary model names. Mongoose validation and route relationship checks apply to writes. Workflows remain partial: coach performance supports create/read only; fee balance is calculated when accepting payments, with no gateway or refund workflow; reporting currently covers summary counts and attendance CSV. Attendance bulk writes validate team membership and are repeatable per session/player, but are not promised atomic across the whole batch. Confirm the unique index exists in the target database before relying on duplicate protection.

Payment posting needs MongoDB transactions, so use Atlas or a local replica-set deployment. Standalone local mongod does not support this operation.

The API test suite has database-free smoke coverage for protected-route denial and an opt-in isolated sports CRUD/persistence/public-visibility integration test. Set `MONGODB_API_TEST_URI` only to a disposable database named exactly `athletix_api_test`; that test drops and recreates only that named database, then drops it during cleanup. This URI is not set automatically. Broad role-scope, payment transaction, attendance, enrollment and export integration coverage remains incomplete.
