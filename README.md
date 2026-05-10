<div align="center">
  <img src="public/nextforge_logo.svg" alt="NextForge Scaffold" height="100" />
  <br /><br />
  <p><strong>Production-Ready, Security-Hardened Next.js 16 Starter</strong></p>
  <p>Full authentication, database flexibility, and modern tooling. Clone it, run one command to choose your database, and start building.</p>
  <br />

  ![Next.js](https://img.shields.io/badge/Next.js-16-2563eb?style=for-the-badge&logo=nextdotjs&logoColor=ffffff)
  ![TypeScript](https://img.shields.io/badge/TypeScript-Strict-2563eb?style=for-the-badge&logo=typescript&logoColor=ffffff)
  ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-2563eb?style=for-the-badge&logo=tailwindcss&logoColor=ffffff)
  ![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-2563eb?style=for-the-badge&logo=mongodb&logoColor=ffffff)
  ![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-2563eb?style=for-the-badge&logo=supabase&logoColor=ffffff)
  ![Firebase](https://img.shields.io/badge/Firebase-Firestore-2563eb?style=for-the-badge&logo=firebase&logoColor=ffffff)
</div>

Spin up a **secure, full-auth Next.js backend in under 60 seconds** — with your choice of database.

Docs: https://nextforge.talhaahmad.me

No boilerplate. No repeated setup. No security gaps.  
No leftover scaffold code. No vendor lock-in.

## ⚡ What you get

- 🔐 Complete authentication (email + Google OAuth)
- 🛡️ Security-first setup (XSS, SQLi/NoSQLi protection, rate limiting)
- 🗄️ Choose your database: MongoDB, PostgreSQL (Supabase), or Firebase (Firestore)
- 📧 Email verification + password reset flows
- 🧱 Clean, production-ready architecture

All with one command:

```bash
node setup.mjs
```
→ Pick your stack. Ship.

## Who this is for

- Developers tired of rebuilding auth and security every project
- Indie hackers shipping SaaS quickly
- Agencies handling multiple client backends
- Anyone who wants a **secure default starting point**


## Why this scaffold?

Most starters give you structure.

This gives you a **production-ready backend system**:

- OTPs are hashed (never stored in plaintext)
- Timing-safe comparisons prevent side-channel attacks
- MongoDB inputs sanitized against operator injection
- Parameterized queries for PostgreSQL
- Rate limits separated for auth and OTP endpoints

Security is not optional — it’s the default.

## What you don’t have to build again

- Login / registration flows  
- Email verification system  
- Password reset logic  
- Rate limiting  
- Input validation  
- Basic security protections  

It’s already done.
---

## Features

- ⚡ **Next.js 16** with App Router and Turbopack
- 🔐 **NextAuth v5** — Credentials + Google OAuth, JWT sessions
- 🗄️ **Database choice** — MongoDB (Mongoose), Supabase (PostgreSQL), or Firebase (Firestore) via interactive setup
- 📧 **Full auth flow** — Register, login, email verification, forgot/reset password
- 🛡️ **Security-hardened** — bcrypt (cost 12), CSPRNG OTPs, timing-safe comparison, CSP headers, HSTS
- 🚫 **Rate limiting** — Upstash Redis, separate limits for auth and OTP endpoints
- 📨 **Transactional email** — Resend integration with HTML templates
- ✅ **Zod validation** — All inputs validated on the server before touching the database
- 🔒 **NoSQL injection protection** — Operator stripping for MongoDB, parameterized queries for Supabase
- 🎨 **Tailwind CSS v4** — Dark mode, CSS variables, responsive design
- 🍞 **Toast notification system** — Accessible, animated, auto-dismissing
- 🧱 **Reusable UI components** — Button, Input (with icons), Modal, Loader, Toast
- 📡 **Route protection** — `proxy.ts` middleware with configurable public/protected routes

---

## Quick Start

### 1. Clone

```bash
git clone https://github.com/Talhaahmad9/nextforge.git my-project
cd my-project
```

### 2. Choose your database

```bash
node setup.mjs
```

```
┌──────────────────────────────────────────┐
│        NextForge — Database Setup        │
└──────────────────────────────────────────┘

Which database backend do you want to use?
  1) MongoDB (Mongoose)
  2) Supabase (PostgreSQL)
  3) Firebase (Firestore)

Enter 1, 2, or 3: _
```

The script will:
- Copy the correct database files into place
- Remove the unused variant's dependencies from `package.json`
- Generate a `.env.local.example` with only the env vars you need
- Delete `_variants/` and `setup.mjs` itself (clean slate)

### 3. Install

```bash
npm install
```

### 4. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in `.env.local` — see the [Environment Variables](#environment-variables) section below.

### 5. (Supabase only) Run the database schema

Open your Supabase project → SQL Editor → paste and run `lib/db/schema.sql`.

### 6. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

➡️ Leaves you with a clean, standard Next.js project (no scaffold leftovers)
---

## Project Structure

```
├── _variants/                  # Database variant files (deleted after setup)
│   ├── mongodb/                # Mongoose-based auth + OTP logic
│   ├── supabase/               # Supabase-based auth + OTP logic + SQL schema
│   └── firebase/               # Firebase-based auth + OTP logic
│
├── actions/
│   ├── auth.ts                 # loginAction, registerAction, verifyEmailAction, logoutAction
│   └── email.ts                # sendPasswordResetOTPAction, resetPasswordAction, resendVerificationOTPAction
│
├── app/
│   ├── (auth)/
│   │   ├── login/              # /login
│   │   ├── register/           # /register
│   │   ├── verify-email/       # /verify-email
│   │   ├── forgot-password/    # /forgot-password
│   │   └── reset-password/     # /reset-password
│   ├── dashboard/              # /dashboard (protected route)
│   ├── api/auth/[...nextauth]/ # NextAuth handler
│   ├── error.tsx               # Global error boundary
│   ├── not-found.tsx           # 404 page
│   ├── layout.tsx              # Root layout
│   └── globals.css             # Tailwind + CSS variable design tokens
│
├── components/
│   ├── auth/                   # Form components for each auth page
│   ├── nav/                    # Navbar, MobileMenu, NavLinks, ThemeToggle
│   ├── footer/                 # Footer
│   └── ui/                     # Button, Input, Modal, Loader, Toast
│
├── hooks/
│   └── useToast.tsx            # Toast state + provider
│
├── lib/
│   ├── auth.ts                 # NextAuth configuration
│   ├── db/
│   │   ├── mongo.ts            # Mongoose connection (MongoDB variant)
│   │   ├── models/             # User + OTP Mongoose models
│   │   └── supabase.ts         # Supabase client — anon + service role (Supabase variant)
│   ├── email.ts                # Resend email templates + sender
│   ├── ratelimit.ts            # Upstash Redis rate limiters
│   ├── sanitize.ts             # XSS escaping + (MongoDB) NoSQL injection stripping
│   ├── tokens.ts               # OTP generation, hashing, verification
│   └── validate.ts             # Zod schemas for all forms
│
├── proxy.ts                    # Next.js 16 middleware (route protection + security headers)
├── setup.mjs                   # Interactive database setup script
└── types/
    ├── index.ts                # ActionState, shared types
    └── next-auth.d.ts          # NextAuth session type extensions
```

---

## Authentication Flow

### Registration
1. User submits name, email, password
2. Server: Zod validation → sanitize → rate limit → check duplicate → bcrypt hash → create user → generate OTP → send verification email
3. User is redirected to `/verify-email`

### Email Verification
1. User submits the 6-digit OTP from their email
2. Server: validate → find valid (unused, unexpired) OTP → timing-safe hash comparison → mark used → mark user verified

### Login
1. User submits email + password
2. NextAuth Credentials provider: look up user → `bcrypt.compare` → return user object → JWT minted
3. JWT stored as HTTP-only cookie; session available via `auth()` or `useSession()`

### Google OAuth
- Handled by NextAuth's Google provider
- No additional setup beyond `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`

### Forgot / Reset Password
1. User submits email → server checks if user exists (generic response to prevent email enumeration) → generates OTP → sends reset email
2. User submits email + OTP + new password → validate OTP → mark used → bcrypt hash new password → update user

---

## Security

| Layer | Implementation |
|---|---|
| Password hashing | bcrypt, cost factor 12 |
| OTP generation | `crypto.randomInt` (CSPRNG), 6-digit |
| OTP storage | SHA-256 hash stored, plaintext never persisted |
| OTP verification | `crypto.timingSafeEqual` — constant-time comparison |
| OTP expiry | 10 minutes, checked at query time |
| NoSQL injection | `stripMongoOperators` strips `$` / `.` keys from user input (MongoDB) |
| SQL injection | Supabase JS client uses parameterized queries |
| XSS | `escapeHTML` applied to all user-supplied string inputs |
| Rate limiting | Upstash Redis sliding window — 5 requests/15 min auth, 3 requests/10 min OTP |
| Session | JWT strategy, `AUTH_SECRET` required in all environments |
| Route protection | `proxy.ts` middleware — unauthenticated → `/login`, authenticated + verified → allowed |
| Security headers | CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, HSTS (production) |
| Email enumeration | Password reset and OTP resend always return the same generic response |

### Recent Hardening Updates

- Reset-password and email-verification flows now validate `email` directly in Zod schemas.
- Protected route guard now blocks both unauthenticated users and authenticated-but-unverified users.
- Password reset OTP send now surfaces provider send failures instead of silently returning success.
- Removed `mongoose-sanitize` plugin usage in favor of explicit input sanitization utilities.

---

## Environment Variables

After running `setup.mjs`, your `.env.local.example` will contain only the variables relevant to your chosen database.

### Always required

```bash
# NextAuth — generate with: openssl rand -base64 32
AUTH_SECRET=

# Google OAuth (optional — remove Google provider from lib/auth.ts if unused)
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=

# Resend (transactional email)
RESEND_API_KEY=
RESEND_FROM_EMAIL=no-reply@yourdomain.com

# Upstash Redis (rate limiting)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Public app config
NEXT_PUBLIC_APP_NAME=MyApp
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### MongoDB variant

```bash
# Full Atlas connection string
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/mydb?retryWrites=true&w=majority
```

### Supabase variant

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # ⚠️ server-only — never expose to the browser
```

### Firebase variant

```bash
FIREBASE_PROJECT_ID=my-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@my-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

---

## Database Variants

The scaffold ships with two production-ready database backends. The auth logic, OTP flow, and security model are identical — only the data access layer differs.

### MongoDB (Mongoose)

- Mongoose models with pre-save bcrypt hook (`UserModel`, `OTPModel`)
- TTL index on `OTPModel.expiresAt` — MongoDB auto-deletes expired OTPs
- Global `mongoose-sanitize` plugin as an additional defence layer
- `stripMongoOperators` strips `$` and `.` keys from all user input before queries

### Supabase (PostgreSQL)

- Two tables: `users` and `otps` (schema at `lib/db/schema.sql`)
- Supabase JS client with anon key (browser-safe) and service role key (server-only)
- `.gt('expires_at', ...)` for expiry checking — equivalent to MongoDB's `$gt`
- Optional pg_cron job for periodic OTP cleanup (see `schema.sql` for instructions)
- `bcrypt.compare` in server actions — passwords are never handled by Supabase Auth

### Firebase (Firestore)

- Two collections: `users` and `otps`
- Server-side only integration using `firebase-admin`
- NextAuth Credentials integration checking against Firestore documents
- Expiry checking done in-memory on the server after querying
- `bcrypt.compare` in server actions — passwords are never handled by native Firebase Auth

---

## Adding to a New Project (Workflow)

```bash
# Clone the scaffold as your new project
git clone https://github.com/Talhaahmad9/nextforge.git my-new-project
cd my-new-project

# Pick your database — this is a one-time operation
node setup.mjs

# Install (setup.mjs already patched package.json)
npm install

# Set env vars
cp .env.local.example .env.local
# Edit .env.local

# Point to your own repo
git remote set-url origin https://github.com/YourUsername/my-new-project.git
git add -A && git commit -m "chore: init from scaffold"
git push -u origin main

# Start building
npm run dev
```

After `setup.mjs` runs, the project is a completely standard Next.js app — no scaffold-specific code remains.

---

## Customisation

### Changing protected/public routes

Edit `proxy.ts`:

```typescript
const PUBLIC_ROUTES = ["/", "/login", "/register", "/forgot-password"];
const AUTH_ROUTES = ["/login", "/register"]; // redirect to /dashboard if already logged in
```

### Adding a new auth provider

Add it to the `providers` array in `lib/auth.ts`:

```typescript
import GitHub from "next-auth/providers/github";
// ...
providers: [
  Credentials({ ... }),
  Google({ ... }),
  GitHub({ clientId: process.env.AUTH_GITHUB_ID, clientSecret: process.env.AUTH_GITHUB_SECRET }),
],
```

### Changing OTP expiry

In `lib/tokens.ts`:

```typescript
export const OTP_EXPIRY_MINUTES = 10; // change this
```

### Changing rate limits

In `lib/ratelimit.ts`:

```typescript
export const authRatelimit = new Ratelimit({
  limiter: Ratelimit.slidingWindow(5, "1 m"), // 5 requests per minute
});
```

### Adding roles

The `role` field (`"user" | "admin"`) is already on the user model and propagated through the JWT. Use it in server actions:

```typescript
const session = await auth();
if (session?.user.role !== "admin") {
  return { success: false, error: "Forbidden." };
}
```

---

## Tech Stack

| Category | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) |
| Auth | [NextAuth v5](https://authjs.dev) |
| Database (pick one) | [MongoDB Atlas](https://www.mongodb.com/atlas) + [Mongoose](https://mongoosejs.com) · [Supabase](https://supabase.com) · [Firebase](https://firebase.google.com) |
| Email | [Resend](https://resend.com) |
| Rate Limiting | [Upstash Redis](https://upstash.com) |
| Validation | [Zod](https://zod.dev) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| Icons | [Lucide React](https://lucide.dev) |
| Password Hashing | [bcryptjs](https://github.com/dcodeIO/bcrypt.js) |
| Language | TypeScript |

---

## Scripts

```bash
npm run dev      # Start dev server (Turbopack)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint
node setup.mjs   # Database variant setup (run once, after cloning)
```

---

## Licence

MIT — use freely in personal and commercial projects.
