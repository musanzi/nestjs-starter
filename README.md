# Starter API

A NestJS starter API with authentication, role-based access control, user management, database persistence, email support, file uploads, and a reusable service/repository foundation.

This project is intended as a practical backend starting point: the core platform concerns are wired up, while the domain modules can be added on top of the existing module structure.

## Features

- **Authentication:** email/password signup and signin with Passport local sessions.
- **Google OAuth:** Google OAuth 2.0 guard and redirect flow.
- **JWT utilities:** global `JwtModule` configured from `JWT_SECRET`, used for password reset tokens and token verification.
- **Session support:** `express-session` and Passport session serialization.
- **Authorization:** global authentication guard, role guard, `@Public()` decorator, and `@Roles()` decorator.
- **Users:** create, list with pagination/search, find by email, update, soft delete, CSV import, CSV export, and profile image upload.
- **Roles:** create, list, paginated list, retrieve, update, and soft delete roles.
- **Database:** MySQL/MariaDB via TypeORM with a shared abstract entity and repository helpers.
- **Migrations:** TypeORM CLI scripts for generating, running, and reverting migrations.
- **Email:** global Nest mailer configuration backed by Nodemailer.
- **Events:** Nest event emitter support for workflows such as password reset emails.
- **Validation:** global `ValidationPipe` with DTO transformation.
- **Response shape:** global interceptor wraps successful responses as `{ data: ... }`.
- **Rate limiting:** global throttling guard configured at 50 requests per minute.
- **Logging:** structured request logging with `nestjs-pino` and pretty console output.
- **Static uploads:** files in `uploads/` are served from `/uploads`.
- **Tooling:** pnpm scripts for build, lint, format, tests, and migrations.

## Stack

- **Framework:** NestJS 11
- **Language:** TypeScript
- **Database:** MySQL or MariaDB
- **ORM:** TypeORM
- **Auth:** Passport, sessions, JWT, Google OAuth
- **Email:** `@nestjs-modules/mailer` and Nodemailer
- **Logging:** `nestjs-pino`
- **Validation:** `class-validator` and `class-transformer`
- **Uploads:** Multer
- **Tests:** Jest and `ts-jest`

## Requirements

- Node.js 18+
- pnpm
- MySQL or MariaDB

## Installation

```bash
pnpm install
```

## Environment

Create a `.env` file in the project root. Use `.env.example` as the starting point.

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

Notes:

- `PORT` defaults to `3000` when it is not provided.
- `SESSION_SECRET` is used by `express-session`.
- `SESSION_MAX_AGE` is the session cookie lifetime in milliseconds.
- `JWT_SECRET` is required because the global `JwtModule` calls `getOrThrow('JWT_SECRET')`.
- `FRONTEND_URI` is used after Google OAuth and when generating password reset links.
- Static uploads are served from the local `uploads/` directory at `/uploads`.

## Running

```bash
pnpm start:dev
```

The API listens on the configured `PORT`, for example:

```text
http://localhost:8000
```

Other runtime commands:

```bash
pnpm start         # Start the app
pnpm start:debug   # Start in debug/watch mode
pnpm build         # Build the application
pnpm start:prod    # Run compiled output from dist/
```

## Scripts

```bash
pnpm build         # Build the application
pnpm format        # Format TypeScript source files
pnpm lint          # Lint and auto-fix files
pnpm start         # Start the application
pnpm start:dev     # Start in watch mode
pnpm start:debug   # Start in debug/watch mode
pnpm start:prod    # Run dist/main
pnpm test          # Run tests
pnpm test:watch    # Run tests in watch mode
pnpm test:cov      # Run tests with coverage
pnpm test:debug    # Run tests with the Node debugger
```

## Database

Database configuration lives in `src/modules/database/database.module.ts` and reads connection settings from `.env`.

The TypeORM runtime configuration uses compiled files from `dist/`:

- Entities: `dist/**/*.entity.js`
- Subscribers: `dist/**/*.subscriber.js`
- Synchronization: disabled

Shared database helpers:

- `AbstractEntity` provides `id`, `created_at`, `updated_at`, and `deleted_at`.
- `AbstractRepository` provides common create, save, find, paginated find, update, soft delete, and hard delete helpers.

## Migrations

Migration files live in:

```text
src/modules/database/migrations/
```

Generate a migration:

```bash
pnpm db:migrate --name=your_migration_name
```

Run pending migrations:

```bash
pnpm db:up
```

Revert the last migration:

```bash
pnpm db:down
```

The migration scripts build the app first, then run the TypeORM CLI against `src/modules/database/orm.config.ts`.

## API Modules

### Auth

Base path: `/auth`

- `POST /auth/signup`
- `POST /auth/signin`
- `GET /auth/google`
- `GET /auth/google/redirect`
- `POST /auth/signout`
- `GET /auth/me`
- `PATCH /auth/me`
- `PATCH /auth/me/password`
- `POST /auth/password/forgot`
- `POST /auth/password/reset`

### Users

Base path: `/users`

- `POST /users`
- `POST /users/import-csv`
- `GET /users`
- `GET /users/by-email/:email`
- `PATCH /users/id/:userId`
- `DELETE /users/id/:userId`
- `GET /users/export/users.csv`
- `POST /users/me/profile-image`

### Roles

Base path: `/roles`

- `POST /roles`
- `GET /roles/paginated`
- `GET /roles`
- `GET /roles/id/:id`
- `PATCH /roles/id/:id`
- `DELETE /roles/id/:id`

## Project Structure

```text
src/
├── app.module.ts
├── main.ts
├── modules/
│   ├── auth/
│   │   ├── controllers/
│   │   ├── decorators/
│   │   ├── dto/
│   │   ├── guards/
│   │   ├── services/
│   │   └── strategies/
│   ├── config/
│   ├── database/
│   ├── email/
│   └── identity/
│       ├── roles/
│       └── users/
└── shared/
    ├── helpers/
    └── interceptors/
```

## Runtime Behavior

- CORS is enabled for `http://localhost:4200` and `http://localhost:4000` with credentials support.
- Global validation transforms request DTOs.
- Passport is initialized for local, session, and Google OAuth flows.
- Protected routes require an authenticated session unless marked with `@Public()`.
- Role-protected routes use `@Roles()` and the global roles guard.
- The throttler guard applies a global rate limit.
- Successful responses are wrapped in a `data` property.
- Request logging is handled by `nestjs-pino`.

## Testing

```bash
pnpm test
pnpm test:cov
```

Jest is configured in `package.json` with `ts-jest`, `tsconfig.spec.json`, and the setup file at `test/jest.setup.ts`.

## License

This project is licensed under the **MIT License**.

## Author

Wilfried M
