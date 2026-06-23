# Starter API

NestJS API starter for session-based authentication, Google OAuth, role-based access control, user and role management, CSV user import/export, local avatar uploads, password reset emails, and PostgreSQL persistence with TypeORM.

## Stack

- NestJS 11, TypeScript, Express 5
- TypeORM 0.3 with PostgreSQL
- Passport local, session, and Google OAuth strategies
- Nest CQRS for command/query handlers and event handlers
- PostgreSQL-backed sessions with `connect-pg-simple`
- Nodemailer via `@nestjs-modules/mailer`
- Pino request logging
- Jest, ESLint, Prettier, Husky, pnpm
- Docker and Docker Compose, including an Adminer service for local database access

## Features

- Session authentication with Passport local sign-in
- Google OAuth sign-in and redirect flow
- Role-based access control with `admin` and `user` roles
- Global authentication, role, throttling, validation, and response transform layers
- Auth flows for signup, signin, signout, profile updates, password updates, forgot password, and reset password
- User and role CRUD implemented through CQRS command and query handlers
- User CSV import and export
- Local avatar uploads served from `/uploads`
- PostgreSQL persistence with TypeORM migrations
- Local seed script for starter admin and user credentials
- Development and production Docker Compose files
- Adminer in the development Compose stack

## Requirements

- Node.js 24+
- pnpm
- PostgreSQL, or Docker for the containerized stack

## Setup

Install dependencies and create a local environment file:

```bash
pnpm install
cp .env.example .env
```

Configure `.env`:

```env
PORT=8000

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=
DB_PASSWORD=
DB_NAME=

MAIL_HOST=smtp.gmail.com
MAIL_PORT=465
MAIL_USERNAME=
MAIL_PASSWORD=

SESSION_SECRET=
SESSION_MAX_AGE=

JWT_SECRET=
JWT_AUTH_TOKEN_EXPIRERS_IN=

GOOGLE_CLIENT_ID=
GOOGLE_SECRET=
GOOGLE_REDIRECT_URI=
FRONTEND_URI=
```

Run the API locally against a PostgreSQL instance on your machine:

```bash
pnpm build
pnpm db:up
pnpm db:seed
pnpm start:dev
```

The API listens on `PORT`, or `3000` when `PORT` is not set. Use `DB_HOST=localhost` when running the API directly on your machine.

Seed credentials for local development:

- `admin@admin.com` / `admin1234`
- `user@user.com` / `user1234`

The seed script refuses to run when `NODE_ENV=production`.

## Database

TypeORM CLI commands use `src/modules/database/orm.config.ts`. The current data source loads compiled entities and migrations from `dist/`, so build before running database commands.

Generate a migration after entity changes:

```bash
pnpm build
name=my_migration pnpm db:migrate
```

Apply or revert migrations:

```bash
pnpm db:up
pnpm db:down
```

Seed local roles and users:

```bash
pnpm db:seed
```

Database synchronization is disabled.

## Docker

This repo has separate Compose files for development and production:

- `compose.dev.yml` builds the `development` Docker target, runs `pnpm start:dev` with the project bind-mounted into `/app`, and starts Adminer on port `8080`.
- `compose.prod.yml` builds the `production` Docker target and runs the compiled app with `pnpm start:prod`.

Both Compose files run PostgreSQL with `postgres:18-alpine`, read `.env`, require database variables to be set, and wait for the database health check before starting the API. Inside Compose, set `DB_HOST=db` in `.env` so the API connects to the database service.

Start the development stack:

```bash
docker compose -f compose.dev.yml up --build
```

The API is available on `http://localhost:$PORT`. Adminer is available on `http://localhost:8080`.

Run migrations and seeds in the development API container:

```bash
docker compose -f compose.dev.yml run --rm api pnpm build
docker compose -f compose.dev.yml run --rm api pnpm db:up
docker compose -f compose.dev.yml run --rm api pnpm db:seed
```

Start the production-style stack:

```bash
docker compose -f compose.prod.yml up --build
```

Build Docker targets directly:

```bash
docker build --target development .
docker build --target production .
```

## Scripts

```bash
pnpm start            # run Nest once
pnpm start:dev        # run Nest in watch mode
pnpm start:debug      # run Nest with debugger in watch mode
pnpm build            # compile to dist/
pnpm start:prod       # run dist/src/main
pnpm lint             # run ESLint with fixes
pnpm format           # run Prettier on src/**/*.ts
pnpm test             # run unit tests
pnpm test:watch       # run unit tests in watch mode
pnpm test:cov         # run unit tests with coverage
pnpm test:debug       # run Jest with Node inspector
name=my_migration pnpm db:migrate
pnpm db:up            # apply migrations
pnpm db:down          # revert last migration
pnpm db:seed          # seed local roles and users
```

## Runtime Notes

- Requests are validated with a global `ValidationPipe` using `transform: true`.
- Responses are wrapped by `TransformInterceptor`.
- CORS is credentialed and reflects the request origin (`origin: true`).
- Sessions use `express-session`, Passport, and a PostgreSQL session store.
- The session cookie is named `sid`; `secure` is enabled when `NODE_ENV=production`.
- The session table is created automatically by `connect-pg-simple` when it is missing.
- Global guards are registered for authentication, roles, and throttling.
- Throttling is configured at 50 requests per 60 seconds.
- `@Public()` marks unauthenticated routes.
- `@Roles([RoleEnum.ADMIN])` restricts routes to admin users.
- Uploaded files are served from `/uploads`.

## API

Protected routes require an authenticated session. Admin routes require the `admin` role.

### Auth

- `POST /auth/signup` public
- `POST /auth/signin` public
- `GET /auth/google` public
- `GET /auth/google/redirect` public
- `POST /auth/signout`
- `GET /auth/me`
- `PATCH /auth/me`
- `PATCH /auth/me/password`
- `POST /auth/password/forgot` public
- `POST /auth/password/reset`

### Users

- `POST /users` admin
- `GET /users` admin, supports `q`, `page`, and `limit` query params
- `POST /users/import/csv` admin, multipart field `file`
- `GET /users/export/csv` admin, supports `q`, `page`, and `limit` query params
- `POST /users/profile/avatar` authenticated, multipart field `avatar`
- `GET /users/:email` admin
- `PATCH /users/:id` admin
- `DELETE /users/:id` admin

### Roles

- `POST /roles` admin
- `GET /roles` admin, supports `q`, `page`, and `limit` query params
- `GET /roles/:id` admin
- `PATCH /roles/:id` admin
- `DELETE /roles/:id` admin

## Project Layout

```text
.
  Dockerfile                    # multi-stage development and production image
  compose.dev.yml               # development API + PostgreSQL stack
  compose.prod.yml              # production-style API + PostgreSQL stack
  .env.example                  # required runtime configuration keys
  pnpm-workspace.yaml           # pnpm workspace and build-script approvals
  src/
    main.ts                     # app bootstrap, CORS, sessions, validation
    app.module.ts               # root Nest module and global guards/interceptor
    modules/
      auth/
        commands/               # signup, signout, profile/password updates, reset flow
        controllers/            # /auth routes
        decorators/             # @Public, @Roles, @CurrentUser
        dto/                    # auth request DTOs
        enums/                  # RoleEnum
        events/                 # reset-password email event handlers
        guards/                 # auth, roles, local, Google guards
        interfaces/             # Google profile contracts
        queries/                # signin, profile, Google redirect, credential validation
        serializers/            # Passport session serializer
        strategies/             # local and Google Passport strategies
      database/
        migrations/             # TypeORM migrations
        seeds/                  # starter admin/user seed data
        abstract.entity.ts      # shared UUID/timestamp columns
        database.module.ts      # Nest TypeORM runtime connection
        orm.config.ts           # TypeORM CLI DataSource
      roles/
        commands/               # role create/update/delete handlers
        controllers/            # /roles routes
        dto/                    # role request DTOs
        entities/               # Role entity
        interfaces/             # role filters
        queries/                # role lookup/list handlers
      users/
        commands/               # user create/update/delete/import/avatar handlers
        common/                 # user mapping helpers
        controllers/            # /users routes
        dto/                    # user request DTOs
        entities/               # User entity
        events/                 # welcome-email event handlers
        helpers/                # CSV helpers
        interfaces/             # user response/filter contracts
        queries/                # user lookup/list/export handlers
        subscribers/            # user entity subscribers
    shared/
      helpers/                  # upload, CSV, email, pagination, test helpers
      interceptors/             # response transform interceptor
      interfaces/               # shared pagination contracts
  uploads/                      # runtime upload target, gitignored
```
