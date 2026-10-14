# Companies implementation notes

Implements the approved `01-companies.md` against main commit `4983525b74cfe6c34685aef13b8f29b51cb4300c`.

## HTTP contract

All five routes use the existing authenticated session and global ADMIN role guards:

| Method | Route                         | Result                                                                  |
| ------ | ----------------------------- | ----------------------------------------------------------------------- |
| POST   | `/api/v1/admin/companies`     | 201, manual company                                                     |
| GET    | `/api/v1/admin/companies`     | 200, paginated active companies                                         |
| GET    | `/api/v1/admin/companies/:id` | 200, active company                                                     |
| PATCH  | `/api/v1/admin/companies/:id` | 200, manual company renamed with `expectedVersion`                      |
| DELETE | `/api/v1/admin/companies/:id` | 204, manual company archived with `expectedVersion` in the request body |

Successful non-204 responses retain the global `{ success, statusCode, data }` envelope. List `data` is `{ items, total, page, limit }`, as approved, rather than the older Roles/Users tuple. The shared pagination parser supplies defaults and bounds; the module-specific DTO rejects invalid integers and unknown fields. The existing tuple-only `ApiPaginatedResponse` decorator is not used because it would document the wrong response shape. Explicit response DTOs describe the actual envelopes in OpenAPI.

No global route, authentication, validation, filter, or interceptor changes are made. In particular:

- The existing AuthGuard returns false for anonymous requests, which Nest maps to **403**, not the specification's intended 401. Changing that requires a separate authentication change.
- HTTP DTO/UUID validation uses the existing **400** convention; internal command business validation uses **422**.
- Conflict identifiers (`STALE_VERSION`, `ODOO_MANAGED_COMPANY`, `COMPANY_ARCHIVED`) use the existing error envelope's **`error`** field. The global filter discards extra `code` fields.

## Internal contracts

Import public contracts from `@/modules/companies`, import `CompaniesModule` in consuming feature modules, and dispatch through the application's command/query buses:

- `CreateCompany(CreateCompanyDto)` returns `ICompanyResponse`.
- `UpdateCompany(id, UpdateCompanyDto)` returns `ICompanyResponse`.
- `ArchiveCompany(id, ArchiveCompanyDto)` returns void.
- `UpsertOdooCompany({ name, odooInstanceId, odooModel, odooRecordId })` returns `ICompanyResponse`.
- `FindCompanyById(id)` and `FindCompanyByExternalIdentity(identity)` return the same active-company read model, or 404.
- `FindCompanies(FilterCompaniesDto)` returns `ICompaniesPage`.

The repository is private to this module. External identifiers remain generic, case-sensitive strings, normalized by trimming surrounding whitespace. No Odoo model is assumed. There is no Odoo HTTP synchronization endpoint.

Manual mutations hold a PostgreSQL row lock in a transaction across the version check and write. An unchanged name with a current version is a no-op; a stale version still conflicts. Odoo inserts use targeted `ON CONFLICT DO NOTHING` followed by a locked read including archived rows. In the pinned TypeORM 1.1 dependency, `orUpdate([], identityColumns)` generates that targeted SQL. Changed names increment the version; identical replays do not. Unrelated database failures propagate to the existing safe global error filter.

## Manual database migration required

Generate and review the migration yourself after building. No migration, seed, synchronization, or database command was generated or executed for this implementation.

The entity metadata declares:

- `companies` table, inherited UUID primary key and created/updated/deleted timestamptz columns.
- Required varchar(255) name; `company_source` enum (`ODOO`, `MANUAL`).
- Three nullable varchar(128) Odoo identifier columns.
- Integer `version`, default 1, with a positive-value check.
- `UQ_companies_external_identity`, a unique composite index over all three external identifiers, **including archived rows**. Do not turn this into a partial active-only index.
- Checks for nonblank/trimmed names and all-or-none source-dependent external identifiers.

Apply your migration before using the endpoints. When Participations is implemented, block company archival while active participations exist; this module intentionally does not pretend to perform that future check.

## Verification

- `pnpm build` passed.
- Targeted ESLint for `src/modules/companies` and `src/app.module.ts` passed.
- Formatting and `git diff --check` passed.
- No tests were generated or run. PostgreSQL concurrency and live HTTP behavior remain for manual acceptance after applying your migration.
