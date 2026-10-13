# Starter API

NestJS API starter for session-based authentication, Google OAuth, role-based access control, user and role management, aggregate stats, CSV user import/export, local avatar uploads, password reset emails, and PostgreSQL persistence with TypeORM.

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
- Admin stats endpoint for user and role totals
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

## Docker

This repo has separate Compose files for development and production:

- `compose.dev.yml` builds the `development` Docker target, runs `pnpm start:dev` with the project bind-mounted into `/app`, and starts Adminer on port `8080`.
- `compose.prod.yml` builds the `production` Docker target and runs the compiled app with `pnpm start:prod`.

Both Compose files run PostgreSQL with `postgres:18-alpine`, read `.env`, require database variables to be set, and wait for the database health check before starting the API. Inside Compose, set `DB_HOST=db` in `.env` so the API connects to the database service.

Start the development stack:

```bash
docker compose -f compose.dev.yml -p starter-backend up --build
```

The API is available on `http://localhost:$PORT`. Adminer is available on `http://localhost:8080`.

Run migrations and seeds in the development API container:

```bash
docker compose -f compose.dev.yml -p starter-backend exec api pnpm build
docker compose -f compose.dev.yml -p starter-backend exec api pnpm db:migrate
docker compose -f compose.dev.yml -p starter-backend exec api pnpm db:up
docker compose -f compose.dev.yml -p starter-backend exec api pnpm db:seed
```

Seed credentials for local development:

- `admin@admin.com` / `admin1234`
- `user@user.com` / `user1234`

Start the production-style stack:

```bash
docker compose -f compose.prod.yml -p starter-backend up --build
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

## Project structure

```text
src/
├── main.ts                     # HTTP, CORS, validation, Redis sessions, Passport
├── app.module.ts               # root modules, logging, mail, throttling, global guards
├── modules/
│   ├── auth/                   # sessions, local/Google auth, password flows
│   ├── database/               # TypeORM configuration, migrations, seeds
│   ├── roles/                  # role administration
│   ├── stats/                  # administration totals
│   └── users/                  # users, avatars, CSV import/export
└── shared/
    ├── abstracts/              # common entity and controller bases
    ├── helpers/                # pagination, uploads, CSV, email templates
    └── interfaces/             # shared contracts
```

Feature modules follow CQRS and barrel exports. Reads live under `queries`, writes under `commands`, and side effects may use `events`. Controllers, DTOs, entities, interfaces, and reusable helpers remain in their dedicated folders. Cross-module data access is performed through the owning module's queries or commands rather than by injecting another module's repository.

## Runtime Notes

- Requests are validated with a global `ValidationPipe` using `transform: true`.
- JSON responses are wrapped by the global `ApiResponseInterceptor` as `{ success: true, statusCode, data }`. Empty results use `data: null`; pagination tuples remain inside `data`.
- The global `ApiExceptionFilter` returns `{ success: false, statusCode, message, error }`. HTTP exception messages and validation message arrays are preserved; unexpected errors are logged and return a generic 500 response.
- Direct responses (CSV downloads and OAuth redirects), streamed files, and 204/304 responses retain their existing behavior.
- CORS is credentialed and reflects the request origin (`origin: true`).
- Sessions use `express-session`, Passport, and a PostgreSQL session store.
- The session cookie is named `sid`; `secure` is enabled when `NODE_ENV=production`.

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
- `GET /auth/signin/google` public
- `GET /auth/google/redirect` public
- `POST /auth/signout`
- `GET /auth/me`
- `PATCH /auth/me/update`
- `PATCH /auth/password/update`
- `POST /auth/password/forgot` public
- `POST /auth/password/reset`

### Users

- `POST /users` admin
- `GET /users` admin, supports `q`, `page`, `limit`, and `take` query params
- `POST /users/import/csv` admin, multipart field `file`
- `GET /users/export/csv` admin, supports `q` and exports all matching users
- `POST /users/profile/avatar` authenticated, multipart field `avatar`
- `GET /users/:email` admin
- `PATCH /users/:id` admin
- `DELETE /users/:id` admin

### Roles

- `POST /roles` admin
- `GET /roles` admin, supports `q`, `page`, `limit`, and `take` query params
- `GET /roles/:id` admin
- `PATCH /roles/:id` admin
- `DELETE /roles/:id` admin

### Stats

- `GET /stats` admin, returns user and role totals as `{ label, total }` items

### Pagination and OpenAPI

API documentation is available at `/docs`, with the OpenAPI 3.1 document at `/openapi.json`.
The `/users` and `/roles` responses use `{ success: true, statusCode: 200, data: [items, total] }`.
The schemas define the tuple positions explicitly: `items` contains `UserResponse` or `RoleResponse` objects,
and `total` is the number of matching records before pagination. Client generators must support OpenAPI 3.1 tuple schemas (`prefixItems`).

`page` is a positive integer starting at 1. `limit` accepts integers from 1 to 100 and defaults to 20.
`take` is an alias used when `limit` is absent; `limit` takes precedence when both are supplied.
With no query parameters, `/roles` returns all roles. Any query parameter enables pagination with the defaults above.
Invalid pagination parameters return HTTP 400 with `{ success: false, statusCode, message, error }`.
