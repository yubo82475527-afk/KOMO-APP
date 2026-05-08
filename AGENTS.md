# OA System Engineering Rules

These rules apply to every code change in this repository.

## Product Shape

- Build mobile-first OA workflows first. Desktop/admin views may exist, but employee workflows must remain usable in a narrow mobile viewport.
- Keep the five primary app tabs stable: Home, Approval, Schedule, Checkin, Profile.
- Admin-only flows live under `/admin/*` and must never be exposed as ordinary employee quick actions unless protected by role checks.
- Do not add marketing-style landing pages. The first screen should be the usable OA app.

## Frontend Rules

- Keep route files thin. `src/app/**/page.tsx` should select data and render feature components, not hold large UI implementations.
- Do not let one component own multiple product modules. Split by feature: `features/home`, `features/approval`, `features/schedule`, `features/checkin`, `features/profile`, `features/admin`.
- Mock data must live in a clearly named fixture file and be replaced by typed data access functions before Supabase integration is considered done.
- User-visible text must be UTF-8 and reviewed in the browser. If Chinese text renders as mojibake, stop and fix encoding before continuing feature work.
- Interactive controls must have explicit disabled, loading, success, error, and empty states before a workflow is called complete.
- Bottom navigation and headers must not cover content on mobile. Preserve safe bottom padding for fixed nav.
- Keep visual style restrained and operational: dense, readable, and task-focused. Avoid decorative hero sections for OA workflows.

## Supabase Rules

- Enable RLS on every exposed table before using it from the frontend.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to browser code. Only Edge Functions or trusted server environments may use it.
- Edge Functions that mutate business data must validate the caller with `auth.getUser()` and check role/permission before using privileged writes.
- Do not put `security definer` functions in an exposed schema such as `public`. Put privileged database functions in a private schema.
- Authorization must be based on server-controlled data such as roles tables or app metadata, not user-editable metadata.
- Every migration that creates tables must also define indexes for expected query paths, RLS policies, and timestamps needed for auditing.
- Generated Supabase TypeScript types should be refreshed after schema changes and committed with the migration.

## Schedule Import Rules

- The product import format is the wide Excel template: employee number, name, department, then one column per date.
- The accepted shift codes are `ZC` early shift, `ZB` middle shift, `WC` night shift, `XIU` rest, and `-` unscheduled.
- Import must be a two-step flow: parse and validate first, then commit only after the admin confirms.
- Import results must be auditable: file name, operator, target month, duplicate handling mode, success rows, failed rows, and row-level errors.
- Duplicate schedule handling must be explicit: overwrite or skip. Silent overwrite is forbidden.
- Schedule writes must be idempotent for the same employee and date.

## Verification Rules

- Run `npm.cmd run lint` and `npm.cmd run build` before handing off frontend changes.
- For major UI changes, verify `/`, `/approval`, `/schedule`, `/checkin`, `/profile`, and `/admin/schedule` in the browser.
- Before applying Supabase migrations to a real project, review RLS policies and run Supabase security/performance advisors.
- Do not mark a Supabase integration done until at least one real auth user can complete the workflow end to end.
