# Starter API

A NestJS starter API for building session-based backend services with authentication, roles, users, database persistence, email workflows, file uploads, CQRS handlers, and a consistent response shape.

The README is intended to get a new developer from clone to a running local API, then give enough structure to add the next module without reverse-engineering the project.

## Features

- **Authentication:** email/password signup and signin using Passport local strategy and server-side sessions.
- **Google OAuth:** Google OAuth 2.0 entrypoint and redirect callback.
- **Authorization:** global authentication guard, roles guard, `@Public()` decorator, and `@Roles()` decorator.
- **Users:** create, list with pagination/search, find by email, update, soft delete, CSV import, CSV export, and profile image upload.
- **Roles:** create, list, paginated list, retrieve, update, and soft delete roles.
- **CQRS:** command/query handlers organize module behavior behind Nest CQRS buses.
- **Database:** MySQL-compatible TypeORM setup with explicit entities, subscribers, and disabled synchronization.
- **Migrations:** TypeORM CLI scripts for generating, running, and reverting migrations.
- **Email:** global Nest mailer configuration backed by Nodemailer.
- **Events:** Nest CQRS event handlers for welcome and password reset email flows.
- **Validation:** global `ValidationPipe` with DTO transformation enabled.
- **Response shape:** successful responses are wrapped as `{ data: ... }`.
- **Rate limiting:** global throttling guard configured at 50 requests per minute.
- **Logging:** request logging through `nestjs-pino` with pretty console output.
- **Static uploads:** files in `uploads/` are served from `/uploads`.

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
- **Package manager:** pnpm

## Requirements

- Node.js 18+
- pnpm
- MySQL or MariaDB

## Getting Started

Install dependencies:

```bash
pnpm install
```

Create your local environment file:

```bash
cp .env.example .env
```

Fill in the database, session, JWT, mail, Google OAuth, and frontend values in `.env`.

Build the application before running migrations, because the TypeORM configuration points at compiled `dist/` files:

```bash
pnpm build
```

Run pending migrations:

```bash
pnpm db:up
```

Start the API in watch mode:

```bash
pnpm start:dev
```

The API listens on `PORT` from `.env`, or `3000` when `PORT` is not set.

```text
http://localhost:8000
```

## Environment

Use `.env.example` as the source of truth for required local variables.

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

Important notes:

- `SESSION_SECRET` is required by `express-session`.
- `SESSION_MAX_AGE` is the session cookie lifetime in milliseconds.
- `JWT_SECRET` is required at startup because the global `JwtModule` uses `getOrThrow('JWT_SECRET')`.
- `FRONTEND_URI` is used after Google OAuth and when generating password reset links.
- Static uploads are served from the local `uploads/` directory at `/uploads`.
- CORS currently allows credentialed requests from `http://localhost:4200` and `http://localhost:4000`.

## Scripts

```bash
pnpm build         # Build the application
pnpm format        # Format TypeScript source files
pnpm lint          # Lint and auto-fix files
pnpm start         # Start the application
pnpm start:dev     # Start in watch mode
pnpm start:debug   # Start in debug/watch mode
pnpm start:prod    # Run compiled output from dist/main
pnpm test          # Run tests
pnpm test:watch    # Run tests in watch mode
pnpm test:cov      # Run tests with coverage
pnpm test:debug    # Run tests with the Node debugger
```

## Database

Database configuration lives in `src/modules/database/database.module.ts` and reads connection settings from `.env`.

Runtime TypeORM settings:

- Driver: `mysql`
- Entities: `dist/**/*.entity.js`
- Subscribers: `dist/**/*.subscriber.js`
- Synchronization: disabled
- Entity auto-loading: disabled

The shared `AbstractEntity` in `src/modules/database/abstract.entity.ts` provides:

- `id`
- `created_at`
- `updated_at`
- `deleted_at`

Feature modules inject standard TypeORM repositories with `@InjectRepository(...)`.

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

Protected routes require an authenticated session unless they are marked with `@Public()`. Role-protected routes use `@Roles()` and the global roles guard.

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
- `GET /users?page=1&limit=20`
- `GET /users/by-email/:email`
- `PATCH /users/id/:userId`
- `DELETE /users/id/:userId`
- `GET /users/export/users.csv`
- `POST /users/me/profile-image`

### Roles

Base path: `/roles`

- `POST /roles`
- `GET /roles/paginated?page=1&limit=20`
- `GET /roles`
- `GET /roles/id/:id`
- `PATCH /roles/id/:id`
- `DELETE /roles/id/:id`

Paginated endpoints default to `limit=20` and accept `limit` values from `1` to `100`.

## Project Structure

```text
src/
├── app.module.ts
├── main.ts
├── modules/
│   ├── auth/
│   │   ├── commands/
│   │   ├── controllers/
│   │   ├── decorators/
│   │   ├── dto/
│   │   ├── events/
│   │   ├── guards/
│   │   ├── queries/
│   │   ├── serializers/
│   │   └── strategies/
│   ├── database/
│   ├── roles/
│   │   ├── commands/
│   │   ├── controllers/
│   │   ├── dto/
│   │   ├── entities/
│   │   ├── interfaces/
│   │   └── queries/
│   └── users/
│       ├── commands/
│       ├── controllers/
│       ├── dto/
│       ├── entities/
│       ├── helpers/
│       ├── interfaces/
│       ├── queries/
│       └── subscribers/
└── shared/
    ├── helpers/
    ├── interceptors/
    └── interfaces/
```

## Adding a Module

Follow the existing `users` and `roles` modules:

1. Create a feature folder under `src/modules/<feature>`.
2. Add DTOs, entities, commands, queries, handlers, and controllers as needed.
3. Register entities with `TypeOrmModule.forFeature(...)` in the feature module.
4. Register command/query handlers in the module providers.
5. Import the feature module in `src/app.module.ts`.
6. Add tests under `test/<feature>/` for handler behavior.

## Runtime Behavior

- Global validation transforms request DTOs.
- Passport is initialized for local, session, and Google OAuth flows.
- `express-session` stores the authenticated session cookie.
- Successful responses are wrapped in a `data` property.
- The throttler guard applies a global rate limit.
- Request logging is handled by `nestjs-pino`.
- Uploaded files are stored locally and served from `/uploads`.

## Testing

```bash
pnpm test
pnpm test:cov
```

Jest is configured in `package.json` with `ts-jest`, `tsconfig.spec.json`, and setup at `test/jest.setup.ts`.

## License

This project is licensed under the **MIT License**.
