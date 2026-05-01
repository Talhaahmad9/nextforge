#!/usr/bin/env node

/**
 * setup.mjs — Interactive scaffold setup script.
 *
 * Prompts for a database backend (MongoDB or Supabase), copies the variant-specific
 * files into the project root, patches package.json, generates .env.local.example,
 * and cleans up the _variants directory and this script.
 *
 * Usage: node setup.mjs
 */

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = __dirname;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ask(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;

  if (fs.statSync(src).isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

function removeRecursive(target) {
  if (!fs.existsSync(target)) return;
  fs.rmSync(target, { recursive: true, force: true });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log();
  console.log("┌──────────────────────────────────────────┐");
  console.log("│    Reusable Scaffold — Database Setup     │");
  console.log("└──────────────────────────────────────────┘");
  console.log();

  const variants = ["mongodb", "supabase"];
  const labels = {
    mongodb: "MongoDB (Mongoose)",
    supabase: "Supabase (PostgreSQL)",
  };

  console.log("Which database backend do you want to use?\n");
  variants.forEach((v, i) => console.log(`  ${i + 1}) ${labels[v]}`));
  console.log();

  let choice;
  while (!choice) {
    const answer = await ask("Enter 1 or 2: ");
    const index = parseInt(answer, 10) - 1;
    if (index >= 0 && index < variants.length) {
      choice = variants[index];
    } else {
      console.log("  Invalid choice. Please enter 1 or 2.");
    }
  }

  console.log(`\n  Selected: ${labels[choice]}\n`);

  const variantDir = path.join(ROOT, "_variants", choice);

  if (!fs.existsSync(variantDir)) {
    console.error(`  ✗ Variant directory not found: ${variantDir}`);
    process.exit(1);
  }

  // ── Step 1: Remove files from the OTHER variant that may be in root ────────

  const otherVariant = choice === "mongodb" ? "supabase" : "mongodb";
  const filesToClean = {
    mongodb: [
      "lib/db/mongo.ts",
      "lib/db/models/user.model.ts",
      "lib/db/models/otp.model.ts",
    ],
    supabase: [
      "lib/db/supabase.ts",
    ],
  };

  // Remove the other variant's DB-specific files from root
  for (const f of filesToClean[otherVariant] || []) {
    const target = path.join(ROOT, f);
    if (fs.existsSync(target)) {
      fs.unlinkSync(target);
    }
  }

  // Also remove postgres.ts if it still exists (dropped entirely)
  const pgFile = path.join(ROOT, "lib/db/postgres.ts");
  if (fs.existsSync(pgFile)) {
    fs.unlinkSync(pgFile);
  }

  // Clean up empty model directories
  const modelsDir = path.join(ROOT, "lib/db/models");
  if (fs.existsSync(modelsDir)) {
    try {
      const remaining = fs.readdirSync(modelsDir);
      if (remaining.length === 0) fs.rmdirSync(modelsDir);
    } catch { /* ignore */ }
  }

  console.log("  ✓ Cleaned up unused database files");

  // ── Step 2: Copy variant files to root ─────────────────────────────────────

  // Files that the variant overrides
  const overrideFiles = ["lib/auth.ts", "lib/sanitize.ts", "actions/auth.ts", "actions/email.ts"];
  for (const f of overrideFiles) {
    const src = path.join(variantDir, f);
    const dest = path.join(ROOT, f);
    if (fs.existsSync(src)) {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(src, dest);
    }
  }

  // Copy variant-specific DB files (lib/db/*)
  const variantDbDir = path.join(variantDir, "lib/db");
  if (fs.existsSync(variantDbDir)) {
    copyRecursive(variantDbDir, path.join(ROOT, "lib/db"));
  }

  console.log(`  ✓ Copied ${labels[choice]} variant files`);

  // ── Step 3: Patch package.json ─────────────────────────────────────────────

  const pkgPath = path.join(ROOT, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  const depsFile = path.join(variantDir, "deps.json");

  if (fs.existsSync(depsFile)) {
    const deps = JSON.parse(fs.readFileSync(depsFile, "utf-8"));

    // Add variant dependencies
    if (deps.add) {
      for (const [name, version] of Object.entries(deps.add)) {
        pkg.dependencies = pkg.dependencies || {};
        pkg.dependencies[name] = version;
      }
    }
    if (deps.addDev) {
      for (const [name, version] of Object.entries(deps.addDev)) {
        pkg.devDependencies = pkg.devDependencies || {};
        pkg.devDependencies[name] = version;
      }
    }

    // Remove other variant's dependencies
    if (deps.remove) {
      for (const name of deps.remove) {
        if (pkg.dependencies) delete pkg.dependencies[name];
        if (pkg.devDependencies) delete pkg.devDependencies[name];
      }
    }

    // Always remove pg (dropped entirely)
    if (pkg.dependencies) delete pkg.dependencies["pg"];
    if (pkg.devDependencies) {
      delete pkg.devDependencies["@types/pg"];
    }
  }

  // Sort dependencies alphabetically
  if (pkg.dependencies) {
    pkg.dependencies = Object.fromEntries(
      Object.entries(pkg.dependencies).sort(([a], [b]) => a.localeCompare(b))
    );
  }
  if (pkg.devDependencies) {
    pkg.devDependencies = Object.fromEntries(
      Object.entries(pkg.devDependencies).sort(([a], [b]) => a.localeCompare(b))
    );
  }

  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
  console.log("  ✓ Updated package.json");

  // ── Step 4: Generate .env.local.example ────────────────────────────────────

  const sharedEnv = `# ──────────────────────────────────────────────────────────────────────────────
# Copy this file to .env.local and fill in your values.
# NEVER commit .env.local to git — it is already listed in .gitignore.
# ──────────────────────────────────────────────────────────────────────────────

# ── Auth ──────────────────────────────────────────────────────────────────────

# Secret used to sign JWTs and encrypt session cookies.
# Generate one with: openssl rand -base64 32
AUTH_SECRET=

`;

  const variantEnv = fs.readFileSync(path.join(variantDir, "env.example"), "utf-8");

  const restEnv = `
# ── OAuth Providers ───────────────────────────────────────────────────────────

# Google OAuth 2.0 credentials.
# Create at: https://console.cloud.google.com/apis/credentials
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=

# ── Resend (email) ────────────────────────────────────────────────────────────

# API key for sending transactional email via Resend.
# Get yours at: https://resend.com/api-keys
RESEND_API_KEY=

# The "from" address used in outgoing emails.
# Must be a verified sender domain in your Resend account.
# Example: no-reply@yourdomain.com
RESEND_FROM_EMAIL=

# ── Upstash Redis (rate limiting) ─────────────────────────────────────────────

# REST endpoint and token for Upstash Redis, used by @upstash/ratelimit.
# Create a database at: https://console.upstash.com
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# ── Public app config ─────────────────────────────────────────────────────────

# Human-readable app name — shown in email templates and page titles.
# Example: MyApp
NEXT_PUBLIC_APP_NAME=

# Canonical public URL of the app (no trailing slash).
# Used for building absolute URLs in emails and OAuth redirects.
# Example: https://yourdomain.com
NEXT_PUBLIC_APP_URL=
`;

  const envContent = sharedEnv + variantEnv + restEnv;
  fs.writeFileSync(path.join(ROOT, ".env.local.example"), envContent);
  console.log("  ✓ Generated .env.local.example");

  // ── Step 5: Cleanup ────────────────────────────────────────────────────────

  removeRecursive(path.join(ROOT, "_variants"));
  console.log("  ✓ Removed _variants/ directory");

  // Delete this setup script
  try {
    fs.unlinkSync(__filename);
    console.log("  ✓ Removed setup.mjs");
  } catch { /* ignore if locked */ }

  // ── Done ───────────────────────────────────────────────────────────────────

  console.log();
  console.log("  ╔═══════════════════════════════════════════╗");
  console.log(`  ║  Setup complete — ${labels[choice].padEnd(23)} ║`);
  console.log("  ╚═══════════════════════════════════════════╝");
  console.log();
  console.log("  Next steps:");
  console.log("    1. Run: npm install");
  console.log("    2. Copy .env.local.example → .env.local and fill in your values");

  if (choice === "supabase") {
    console.log("    3. Run lib/db/schema.sql in your Supabase SQL Editor");
  }

  console.log();
}

main().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
