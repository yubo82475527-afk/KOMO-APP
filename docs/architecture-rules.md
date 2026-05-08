# Architecture Rules

## Folder Layout

Use this target layout as the app grows:

```text
src/
  app/
    page.tsx
    approval/page.tsx
    schedule/page.tsx
    checkin/page.tsx
    profile/page.tsx
    admin/schedule/page.tsx
  components/
    layout/
    ui/
  features/
    home/
    approval/
    schedule/
    checkin/
    profile/
    admin-schedule/
  lib/
    supabase/
    validation/
    dates/
```

## Route Rules

- App routes should not contain product logic.
- Route pages should compose feature components and pass route/search params.
- Tab state that affects navigation should be represented in URLs or search params.
- Modal state can stay local only when it is not important to browser back/forward behavior.

## Data Rules

- Each feature owns a typed view model.
- Supabase row types should be mapped into view models before they reach UI components.
- Do not bind UI directly to raw database rows unless the screen is a simple admin table.
- Mutations must return a typed success/error result, not throw unhandled errors into components.

## UI State Rules

Every data-backed screen needs:

- loading state
- empty state
- error state
- successful populated state
- permission-denied state when the feature is role-gated

Every mutation needs:

- disabled state while submitting
- optimistic or pending state where appropriate
- success feedback
- structured validation errors
- retry or correction path

## Naming Rules

- Use business names consistently: approval request, approval step, shift template, schedule, attendance record, attendance summary.
- Avoid mixing terms like shift, schedule, roster, and calendar unless the distinction is explicit.
- Keep route names stable and product-facing names in Chinese once encoding is verified.

## Verification Checklist

Before merging a feature:

- Run lint and build.
- Click through the relevant mobile flow.
- Check a narrow viewport around 390px width.
- Verify fixed bottom nav does not cover the last actionable element.
- Confirm all forms have validation and non-happy paths.
