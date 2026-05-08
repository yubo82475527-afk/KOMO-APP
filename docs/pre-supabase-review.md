# Pre-Supabase Review

Date: 2026-05-07

## Decision

Do not connect the current prototype directly to production Supabase yet. The UI shape is useful as a product prototype, but the code needs a small refactor and the Supabase boundary needs stricter rules before real data is introduced.

## Must Fix Before Supabase Integration

1. Split the large mobile app component by feature.

   Current state: `src/components/oa-mobile-app.tsx` contains all tabs, mock data, admin import, checkin, schedule, and profile logic in one client component.

   Required state: route files remain thin, feature UI is split into dedicated modules, and shared primitives live under `src/components/ui` or `src/components/layout`.

2. Move mock data into fixtures and typed view models.

   Current state: mock records are embedded in UI components.

   Required state: data fixtures live in `src/features/*/fixtures.ts`, view models are typed, and each future Supabase query maps into the same shape.

3. Resolve text encoding before adding more Chinese UI.

   Current risk: the shell output shows mojibake for Chinese literals. Even when build passes, the browser must be treated as the source of truth for rendered text.

   Required state: files are UTF-8, browser text is verified, and no broken copy is committed.

4. Redesign schedule import for the product template.

   Current state: the Edge Function accepts row-based CSV with `employee_no,email,work_date,shift_name,schedule_type`.

   Required state: support the wide Excel template with employee columns followed by date columns and shift codes: `ZC`, `ZB`, `WC`, `XIU`, `-`.

5. Add real authorization to privileged Edge Functions.

   Current state: `import-schedule` uses the service role key but does not verify that the caller is an admin.

   Required state: every privileged Edge Function validates the JWT, loads the user profile/roles, and rejects unauthorized users before writing data.

6. Move privileged SQL helpers out of `public`.

   Current state: `public.has_role` is a `security definer` function in an exposed schema.

   Required state: privileged helpers live in a private schema such as `private`, with carefully granted execute permissions.

## Should Fix Soon

- Add indexes for common queries: schedules by `profile_id, work_date`, approvals by requester/status, approval steps by approver/status, attendance by profile/date.
- Add audit columns where admin writes happen: `created_by`, `updated_by`, `updated_at`.
- Add empty/error/loading states for every list and import action.
- Add route-level state for tabs and filters so refresh/back navigation behaves predictably.
- Decide whether admin schedule management is mobile-only, desktop-first, or responsive across both.

## Integration Gate

Supabase integration can start when these are true:

- The route/component split is in place.
- The schedule import contract matches the Excel template.
- RLS and Edge Function authorization are reviewed together.
- The browser has been checked on mobile width for all primary tabs.
- `npm.cmd run lint` and `npm.cmd run build` pass.
