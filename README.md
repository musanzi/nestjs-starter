# Starter API

NestJS API starter for session-based authentication, Google OAuth, role-based access control, user management, role management, CSV import/export, local avatar uploads, password reset emails, and PostgreSQL persistence with TypeORM.

## Stack

- NestJS 11, TypeScript, Express
- TypeORM with PostgreSQL
- Passport local, session, and Google OAuth
- Nest CQRS
- Nodemailer
- Jest, ESLint, Prettier, pnpm
- Docker and Docker Compose

## Features

- Session-based authentication with Passport local strategy
- Google OAuth sign-in flow
- JWT-backed password reset flow with email delivery
- Global authentication, role, throttling, validation, and response-transform layers
- Role-based access control with `admin` and `user` roles
- User and role CRUD flows implemented with CQRS commands and queries
- CSV user import and export
- Local profile image uploads served from `/uploads`
- PostgreSQL persistence with TypeORM migrations and seed scripts
- Dockerized development stack with API and PostgreSQL services

## Requirements

- Node.js 24+
- pnpm
- PostgreSQL for local development, or Docker for the containerized stack

## Setup

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

`DB_HOST=localhost` is for running the API directly on your machine. Docker Compose overrides the API container database host to `db`.

Generate the initial migration after entity changes:

```bash
name=init pnpm db:migrate
```

Run migrations, seed local credentials, and start the API:

```bash
pnpm db:up
pnpm db:seed
pnpm start:dev
```

## Docker

The Docker setup runs both PostgreSQL and the API. It uses the development Docker target with `pnpm start:dev`, a bind mount for source files, and named volumes for `node_modules` and PostgreSQL data.

Copy and fill `.env` before running Compose:

```bash
cp .env.example .env
```

These values are required:

```env
PORT=8000
DB_PORT=5432
DB_USERNAME=
DB_PASSWORD=
DB_NAME=
```

Start PostgreSQL first:

```bash
docker compose up -d db
```

Generate migrations after entity changes. Migrations and seeds are intentionally manual commands:

```bash
docker compose run --rm api pnpm db:migrate
docker compose run --rm api pnpm db:up
docker compose run --rm api pnpm db:seed
```

Start the API:

```bash
docker compose up api
```

Build the development image directly:

```bash
docker build --target development .
```

Build the production image directly:

```bash
docker build --target production .
```

Do not use starter credentials in production.

### Docker Notes

- `docker-compose.yml` requires `.env` to exist and fails fast when required database variables are empty.
- The database service uses `postgres:18-alpine`.
- The API service uses `DB_HOST=db` inside Compose, regardless of the local `.env` value.
- The Dockerfile copies `pnpm-workspace.yaml` before `pnpm install` so pnpm build-script approvals are available during image builds.
- The production image runs `pnpm start:prod`, which starts the compiled app from `dist/src/main`.

The API listens on `PORT`, or `3000` when `PORT` is not set.

Seed credentials for local development:

- `admin@admin.com` / `admin1234`
- `user@user.com` / `user1234`

## Scripts

```bash
pnpm start:dev          # run in watch mode
pnpm build              # compile to dist/
pnpm start:prod         # run compiled app
pnpm lint               # run ESLint with fixes
pnpm format             # run Prettier
pnpm test               # run unit tests
pnpm test:cov           # run tests with coverage
name=my_migration pnpm db:migrate
pnpm db:up              # apply migrations
pnpm db:down            # revert last migration
pnpm db:seed            # seed local roles and users
```

## Runtime Notes

- Requests are validated with a global `ValidationPipe`.
- Responses are wrapped as `{ data: ... }`.
- CORS allows credentialed requests from `http://localhost:4200` and `http://localhost:4000`.
- Sessions use `express-session` and Passport.
- Auth, roles, and throttling guards are global.
- `@Public()` marks unauthenticated routes.
- Uploaded files are served from `/uploads`.
- Database synchronization is disabled; use migrations.
- Database seed credentials are blocked when `NODE_ENV=production`.

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
- `POST /users/import-csv` admin, multipart `file`
- `GET /users/export-csv` admin
- `GET /users` admin
- `GET /users/:email` admin
- `PATCH /users/id/:userId` admin
- `POST /users/me/profile-image` multipart `profile`
- `DELETE /users/id/:userId` admin

### Roles

- `POST /roles` admin
- `GET /roles` admin
- `GET /roles/id/:id` admin
- `PATCH /roles/id/:id` admin
- `DELETE /roles/id/:id` admin

## Project Layout

```text
.
  Dockerfile                    # multi-stage development and production image
  docker-compose.yml            # API + PostgreSQL development stack
  pnpm-workspace.yaml           # pnpm workspace and approved build-script config
  src/
    main.ts                     # app bootstrap, CORS, sessions, validation
    app.module.ts               # root Nest module and global guards/interceptors
    modules/
      auth/
        commands/               # signup, signout, profile/password updates, reset flow
        controllers/            # /auth routes
        decorators/             # @Public, @Roles, @CurrentUser
        dto/                    # auth request DTOs
        enums/                  # role enum used by guards and seeds
        events/                 # reset-password email event handlers
        guards/                 # auth, roles, local, Google guards
        interfaces/             # Google profile contracts
        queries/                # signin, profile, Google redirect, credential validation
        serializers/            # Passport session serializer
        strategies/             # local and Google Passport strategies
      database/
        migrations/             # generated TypeORM migrations
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

## License

MIT
