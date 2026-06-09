# Starter API

NestJS API starter for session-based authentication, Google OAuth, role-based access control, user management, role management, CSV import/export, local avatar uploads, password reset emails, and MariaDB persistence with TypeORM.

## Stack

- NestJS 11, TypeScript, Express
- TypeORM with MariaDB
- Passport local, session, and Google OAuth
- Nest CQRS
- Nodemailer
- Jest, ESLint, Prettier, pnpm

## Requirements

- Node.js 18+
- pnpm
- MariaDB

## Setup

```bash
pnpm install
cp .env.example .env
```

Configure `.env`:

```env
PORT=8000

DB_HOST=
DB_PORT=
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

Run migrations and start the API:

```bash
pnpm db:up
pnpm db:seed
pnpm start:dev
```

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
- `GET /users/export/users.csv` admin
- `GET /users` admin
- `GET /users/by-email/:email` public
- `PATCH /users/id/:userId` admin
- `POST /users/me/profile-image` multipart `profile`
- `DELETE /users/id/:userId` admin

### Roles

- `POST /roles` admin
- `GET /roles/paginated` admin
- `GET /roles` admin
- `GET /roles/id/:id` admin
- `PATCH /roles/id/:id` admin
- `DELETE /roles/id/:id` admin

## Project Layout

```text
src/
  main.ts
  app.module.ts
  modules/
    auth/
    database/
    roles/
    users/
  shared/
```

## License

MIT
