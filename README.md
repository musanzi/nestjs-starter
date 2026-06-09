# Starter API

NestJS 11 API starter with session authentication, Google OAuth, role-based access, users, roles, local uploads, email flows, CQRS handlers, and MySQL persistence through TypeORM.

## Stack

- NestJS, TypeScript, Express
- TypeORM with MySQL or MariaDB
- Passport local, session, and Google OAuth strategies
- Nest CQRS for commands, queries, and events
- Nodemailer via `@nestjs-modules/mailer`
- Jest, ESLint, Prettier, pnpm

## Requirements

- Node.js 18+
- pnpm
- MySQL or MariaDB

## Setup

```bash
pnpm install
cp .env.example .env
```

Fill in `.env`:

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

Build before running database commands because TypeORM reads compiled files from `dist/`.

```bash
pnpm build
pnpm db:up
pnpm start:dev
```

The API listens on `PORT`, or `3000` when `PORT` is not set.

## Scripts

```bash
pnpm start:dev       # run in watch mode
pnpm build           # compile to dist/
pnpm start:prod      # run dist/main
pnpm lint            # eslint with fixes
pnpm format          # prettier on src/**/*.ts
pnpm test            # run Jest
pnpm test:cov        # run Jest with coverage
pnpm db:migrate --name=my_change
pnpm db:up
pnpm db:down
```

## Runtime Behavior

- Global validation uses `ValidationPipe` with DTO transformation.
- CORS allows credentialed requests from `http://localhost:4200` and `http://localhost:4000`.
- `express-session` and Passport provide server-side login sessions.
- `JwtModule` requires `JWT_SECRET` at startup.
- Global guards apply roles, authentication, and rate limiting.
- `@Public()` marks routes that bypass the auth guard.
- Successful responses are wrapped as `{ data: ... }`.
- Static files under `uploads/` are served from `/uploads`.
- Database synchronization is disabled.

## API Surface

Protected routes require an authenticated session unless marked public. Admin-only routes use `@Roles([RoleEnum.ADMIN])`.

### Auth

Base path: `/auth`

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

Base path: `/users`

- `POST /users` admin
- `POST /users/import-csv` admin, multipart field `file`
- `GET /users/export/users.csv` admin
- `GET /users` admin
- `GET /users/by-email/:email` public
- `PATCH /users/id/:userId` admin
- `POST /users/me/profile-image` multipart field `profile`
- `DELETE /users/id/:userId` admin

### Roles

Base path: `/roles`

- `POST /roles` admin
- `GET /roles/paginated` admin
- `GET /roles` admin
- `GET /roles/id/:id` admin
- `PATCH /roles/id/:id` admin
- `DELETE /roles/id/:id` admin

## Project Layout

```text
src/
  app.module.ts
  main.ts
  modules/
    auth/       # auth controllers, guards, strategies, DTOs, CQRS handlers, events
    database/   # TypeORM module, data source config, base entity
    roles/      # role entity, controller, DTOs, CQRS handlers
    users/      # user entity, controller, DTOs, CSV/avatar helpers, CQRS handlers
  shared/
    helpers/
    interceptors/
    interfaces/
test/
  jest.setup.ts
```

## Database

Runtime database config is in `src/modules/database/database.module.ts`. CLI data source config is in `src/modules/database/orm.config.ts`.

Both use MySQL, compiled entities from `dist/**/*.entity.js`, and `synchronize: false`.

## Testing

```bash
pnpm test
pnpm test:cov
```

Unit tests live beside their handlers in `commands/test`, `queries/test`, and `events/test`.

## License

MIT
