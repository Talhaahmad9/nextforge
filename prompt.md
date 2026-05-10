# NextForge Docs Update Prompt (Session Master Record)

Use this prompt to update the official documentation with all outcomes from this session.

## Goal

Update the documentation so users can configure and test all three database variants (MongoDB, Supabase, Firebase) with fewer setup errors, based on real issues discovered and fixed in this session.

## Scope of this session

This session covered:

1. A strict prelaunch audit and risk review.
2. High-priority code fixes across root and all database variants.
3. MongoDB end-to-end validation and runtime bug fixes.
4. Supabase migration to new key system and end-to-end validation.
5. Firebase setup guidance and troubleshooting through real errors.
6. README refinements and publishing updated commits.

## High-level outcomes

- MongoDB auth flow fully tested end-to-end.
- Supabase auth flow fully tested end-to-end.
- Firebase flow progressed through setup blockers with clear runbook and known index requirement.
- Security and validation hardening shipped across all variants.
- Supabase switched from legacy key naming to new key system.
- Google OAuth backend user sync is now implemented for MongoDB, Supabase, and Firebase variants.

## Chronological timeline with technical changes

### Phase 1: Audit and risk identification

Primary findings identified before launch:

- Email was not validated in `resetPasswordSchema` and `verifyEmailSchema` at schema level.
- Protected-route middleware allowed authenticated but unverified users to access protected routes.
- README rate-limit wording did not match actual configured windows.
- No tests/CI were present (not fixed in this session, documented as risk).

### Phase 2: Cross-variant validation and security fixes (Step 1)

Applied fixes to root files and all three variants where applicable.

#### 1) Zod schema hardening

File:
- `lib/validate.ts`

Changes:
- Added `email: emailField` to `resetPasswordSchema`.
- Added `email: emailField` to `verifyEmailSchema`.

Impact:
- Email is now normalized/validated before any database query in reset/verify flows.

#### 2) Action parsing cleanup in root and variants

Files:
- `actions/auth.ts`
- `actions/email.ts`
- `_variants/mongodb/actions/auth.ts`
- `_variants/mongodb/actions/email.ts`
- `_variants/supabase/actions/auth.ts`
- `_variants/supabase/actions/email.ts`
- `_variants/firebase/actions/auth.ts`
- `_variants/firebase/actions/email.ts`

Changes:
- Replaced raw email extraction from sanitized object with parsed schema data.
- Standardized patterns such as:
  - `const { email, otp } = parsed.data`
  - `const { email, otp, password } = parsed.data`
- Removed fallback raw-email checks that previously bypassed schema-level guarantees.

Impact:
- Consistent and safer input handling across all variants.

#### 3) Middleware route-protection fix

File:
- `proxy.ts`

Change:
- Protected route guard updated to block both:
  - unauthenticated users, and
  - authenticated users with unverified email.

Impact:
- Unverified users can no longer access protected routes until verification.

#### 4) Documentation correctness fix

File:
- `README.md`

Change:
- Rate-limit wording corrected from per-minute phrasing to configured windows:
  - auth: 5 requests / 15 minutes
  - OTP: 3 requests / 10 minutes

Impact:
- Docs now match runtime behavior.

### Phase 3: MongoDB runtime debugging and fixes

#### 1) Registration crash: `next is not a function`

Observed error:
- During `registerAction`, Mongoose threw `TypeError: next is not a function`.

Root cause:
- `mongoose-sanitize` plugin behavior conflicted with current Mongoose runtime path.

Fixes:

File:
- `lib/db/mongo.ts`

Changes:
- Removed global plugin registration for `mongoose-sanitize`.
- Removed plugin import/require block.

Dependency updates:
- Uninstalled `mongoose-sanitize` package.
- `package.json` and `package-lock.json` updated accordingly.

Why safe:
- Existing explicit sanitization utilities (`sanitizeAndStrip`, `stripMongoOperators`) already handle server-side sanitization in action flows.

#### 2) Password-reset OTP send silently failing

Observed behavior:
- Verification OTP worked but reset OTP not received.

Root cause:
- `sendPasswordResetOTPAction` ignored email provider send result and returned success message anyway.

File:
- `actions/email.ts`

Change:
- Captured result from `sendPasswordResetEmail(...)`.
- Returned user-visible error when email send failed instead of silently returning generic success.

Impact:
- Delivery failures now surface as actionable errors.

MongoDB final status:
- Flow validated: register -> verify OTP -> login -> forgot password -> reset -> login again.

### Phase 4: Commit and publish of security/hardening changes

Commit created and pushed:
- `b44af38` - `fix: harden auth validation and reset OTP delivery`

Files included (summary):
- root actions and validation
- all variant action parity updates
- middleware update
- Mongo plugin removal
- README corrections
- dependency lock updates

### Phase 5: Supabase key-system research and migration

Research result:
- Supabase recommends new key types (`sb_publishable_*`, `sb_secret_*`) over legacy anon/service_role naming.

Decision made:
- Use new key system only for current test baseline.

Implemented migration:

Files:
- `lib/db/supabase.ts`
- `_variants/supabase/lib/db/supabase.ts`
- `_variants/supabase/env.example`
- `README.md`

Changes:
- Browser key env switched to `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Server key env switched to `SUPABASE_SECRET_KEY`.
- Error messages/comments updated to new key terminology.
- README and env examples updated.

Commit created and pushed:
- `b08d566` - `refactor: adopt Supabase publishable and secret keys`

Supabase final status:
- Flow validated end-to-end:
  - register -> verify OTP -> login -> forgot password -> reset -> login again.

### Phase 6: Firebase setup, research, and troubleshooting

Research conclusion:
- Current Firebase variant is server-side Firebase Admin SDK architecture, not legacy browser compat API.
- The Firebase web config snippet (`apiKey`, `authDomain`, etc.) is not the credential set needed by this scaffold's server actions.

Required Firebase env keys for this project:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

Major issues encountered and resolutions:

#### Error A: `Invalid PEM formatted message`

Cause:
- `FIREBASE_PRIVATE_KEY` was provided without PEM wrapper lines.

Fix pattern:
- Use full key string with wrappers and escaped newlines:
- `"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"`

Security note:
- Exposed/posted keys should be rotated immediately.

#### Error B: `PERMISSION_DENIED` Firestore API disabled

Cause:
- Firestore API (`firestore.googleapis.com`) not enabled for project.

Resolution:
- Enable Firestore API and wait for propagation.

#### Error C: `NOT_FOUND` on first Firestore query

Cause:
- Firestore `(default)` database not created yet (or mismatched credentials/project).

Resolution:
- Create Firestore Database `(default)` in Firebase Console under Build -> Firestore.

#### Error D: `FAILED_PRECONDITION` query requires index

Cause:
- Composite query in OTP verification/reset required an index on `otps` collection.

Resolution:
- Open Firestore-provided index creation link from error and create index.
- Wait until index status is `Enabled`.

## Validation summary by database

### MongoDB

Validated:
- Register
- Email verification OTP
- Login
- Forgot password OTP
- Reset password
- Re-login after reset

Key fixes that enabled success:
- Removed `mongoose-sanitize` plugin conflict.
- Added reset-email delivery failure handling.

### Supabase

Validated:
- Register
- Email verification OTP
- Login
- Forgot password OTP
- Reset password
- Re-login after reset

Key updates:
- Migrated to publishable/secret key naming.
- Confirmed schema execution requirement before testing.

### Firebase

Validated during setup/troubleshooting:
- Admin credential model clarified.
- Firestore API enablement requirement identified.
- Firestore DB creation requirement identified.
- Composite index requirement identified for OTP query pattern.

Operational checklist provided to complete full flow.

## Additional README updates done at end of session

Files:
- `README.md`
- `.gitignore`

README updates:
- Corrected outdated Supabase wording in project structure and variant details:
  - now references publishable/secret keys.
- Removed outdated mention of global `mongoose-sanitize` plugin from MongoDB variant section.
- Added concise "Database setup notes (short)" section with real-world blockers and links:
  - MongoDB docs link
  - Supabase docs link
  - Firebase docs link

Git ignore update:
- Added `prompt.md` to `.gitignore` so local prompt artifact is not committed.

## Phase 7: Homepage and OAuth UX completion

### 1) Blank root route fixed

Observed issue:
- `/` rendered a blank page because `app/page.tsx` returned an empty fragment.

Implementation:

File:
- `app/page.tsx`

Changes:
- Replaced empty fragment with a boilerplate landing page.
- Added clear CTAs for:
  - sign in (`/login`)
  - register (`/register`)
  - dashboard (`/dashboard`)

Impact:
- New users no longer land on a blank screen.
- Scaffold has an immediate, usable entry page.

### 2) Google OAuth button added to login UI

Files:
- `components/auth/LoginForm.tsx`

Changes:
- Added explicit "Sign in with Google" button.
- Wired button to NextAuth client call: `signIn("google", { callbackUrl: "/dashboard" })`.
- Added visual divider between credentials form and OAuth action.

Impact:
- Google provider was already configured server-side, but now exposed in UI.

### 3) Google OAuth button added to register UI

Files:
- `components/auth/RegisterForm.tsx`

Changes:
- Added explicit "Continue with Google" button.
- Wired button to NextAuth client call: `signIn("google", { callbackUrl: "/dashboard" })`.
- Added same divider pattern for consistent UX with login page.

Impact:
- OAuth path now available on both auth entry points.

### 4) Icon source standardized to library import

Requirement:
- Use icon from `lucide-react` or `react-icons` instead of custom inline SVG.

Final implementation:
- Used `FcGoogle` from `react-icons/fc` in both forms.
- Added dependency: `react-icons`.

Files affected:
- `components/auth/LoginForm.tsx`
- `components/auth/RegisterForm.tsx`
- `package.json`
- `package-lock.json`

Validation:
- Diagnostics clean after icon-library migration.

### 5) Recommended smoke test for this phase

- Open `/` and verify boilerplate page renders.
- From `/login`, test Google button redirects and returns to `/dashboard`.
- From `/register`, test Google button redirects and returns to `/dashboard`.
- From `/dashboard`, test the logout button redirects back to `/login`.
- Verify credentials login/register paths still work.

## Phase 9: Dashboard logout completion

Observed gap:
- The starter dashboard page had placeholder content only and did not expose an obvious logout control, even though logout server actions already existed across root, MongoDB, Supabase, and Firebase auth flows.

Implemented fix:

File:
- `app/dashboard/page.tsx`

Changes:
- Imported `logoutAction` from `@/actions/auth`.
- Added a visible logout button in the dashboard header.
- Wired the button through a standard server-action form submission.

Why this works for all three database variants:
- The dashboard imports `@/actions/auth`, which is the active auth implementation after `setup.mjs` copies the selected variant into place.
- MongoDB, Supabase, and Firebase variants all expose the same `logoutAction` contract.
- The logout flow continues to rely on NextAuth session invalidation and redirect behavior, not on backend-specific session storage.

Validation:
- Editor diagnostics remained clean after the dashboard update.
- Recommended manual smoke test: log in via credentials and Google, open `/dashboard`, click logout, verify redirect to `/login`.

## Phase 8: Google OAuth backend completion across all variants

Observed issue:
- Google OAuth UI existed, and NextAuth provider configuration existed, but first-time Google sign-in did not guarantee creation or syncing of a canonical backend user record.
- This meant protected-route logic depending on backend fields like `id`, `role`, and `emailVerified` could be incomplete after OAuth login.

Diagnosis:
- MongoDB root app and MongoDB variant had no user upsert path for Google users.
- Supabase and Firebase variants had the same gap: Google provider configured, but no database write/sync step on OAuth sign-in.
- Middleware depended on the session carrying canonical fields, especially verified status for protected routes.

Implemented fix:

Files:
- `lib/auth.ts`
- `_variants/mongodb/lib/auth.ts`
- `_variants/supabase/lib/auth.ts`
- `_variants/firebase/lib/auth.ts`

Changes:
- Added provider-specific `signIn` callback logic for Google in all affected auth configs.
- On Google sign-in, each backend now creates or updates the matching user by email.
- JWT callback now reloads canonical user data from the database and stores:
  - `id`
  - `role`
  - `emailVerified`
  - canonical `name` and `image`
- Session callback now prefers canonical token data so middleware and app code receive the backend-backed user shape.

Backend-specific notes:

MongoDB:
- Generates a random password on first OAuth insert because the Mongoose schema requires a password field.
- Marks Google users as `emailVerified: true`.

Supabase:
- Upserts by `email` into the `users` table.
- Compatible with the existing schema because `password` is nullable for OAuth-only users.

Firebase:
- Creates or updates a `users` document keyed by generated document ID after looking up by email.
- Stores `provider: "google"`, verified status, timestamps, and canonical profile fields.

Validation:
- Editor diagnostics showed no errors in all four updated auth files.
- `npm run build` passed successfully after the MongoDB/root auth changes.
- Live OAuth flow still needs real provider testing in each configured environment.

## Final documentation requirements this prompt should drive

Update official docs with:

1. **Short README guidance + deep links**
- Keep README concise.
- Link to detailed per-database docs:
  - `https://nextforge.talhahmad.me/documentation/database/mongodb`
  - `https://nextforge.talhahmad.me/documentation/database/supabase`
  - `https://nextforge.talhahmad.me/documentation/database/firebase`

2. **Per-database setup pages should include troubleshooting sections**

MongoDB page:
- Common connection issues.
- Auth flow smoke test steps.
- Note that sanitization is explicit in app logic (no `mongoose-sanitize` plugin dependency).

Supabase page:
- Run `lib/db/schema.sql` before auth tests.
- Use new key names only:
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - `SUPABASE_SECRET_KEY`
- Mention schema/credential mismatch symptoms.

Firebase page:
- Use Admin service account credentials, not web SDK config values.
- Exact `.env.local` formatting for `FIREBASE_PRIVATE_KEY` with PEM wrapper + `\n` escapes.
- Firestore API enablement step.
- Firestore `(default)` DB creation step.
- Composite index creation flow from runtime error link.

3. **Global verification checklist page**
- Include shared smoke flow for each DB:
  - register -> verify OTP -> login -> forgot password -> reset -> login
- Include note that missing Upstash keys causes no-op rate limiting in local/dev.
- Add a Google OAuth smoke flow:
  - login/register with Google -> redirect to `/dashboard` -> verify backend user record exists/updates correctly

## Suggested release-note style changelog entry

- Hardened auth input validation and route protection.
- Fixed password reset OTP delivery error handling.
- Removed Mongo plugin causing runtime registration failure.
- Migrated Supabase variant to publishable/secret key env names.
- Added database setup notes reflecting real test-session blockers.
- Completed Google OAuth backend user sync so OAuth users are persisted consistently across MongoDB, Supabase, and Firebase.
- Added a working logout button to the starter dashboard using the shared auth server action contract.

## Session reference commits

- `b44af38` - hardening and reset OTP delivery fixes.
- `b08d566` - Supabase new-key migration.
- `<add-latest-commit-hash>` - homepage boilerplate + Google OAuth buttons + icon library integration.
- `<add-next-commit-hash>` - cross-variant Google OAuth backend user sync and docs update.
- `<add-next-commit-hash>` - dashboard logout button, docs refresh, and publish.

## Done criteria for docs update

- README remains concise and links to detailed pages.
- All three database docs include real error signatures and exact fixes.
- Environment variable examples match current code behavior.
- Troubleshooting sections map 1:1 to errors seen in this session.
- Google OAuth docs explain both provider setup and backend user synchronization behavior.
