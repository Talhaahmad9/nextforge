"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { signIn, signOut } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/db/supabase";
import { sanitizeAndStrip, sanitizeString } from "@/lib/sanitize";
import { parseSchema, loginSchema, registerSchema, verifyEmailSchema } from "@/lib/validate";
import { authRatelimit, checkRateLimit } from "@/lib/ratelimit";
import { generateOTP, hashOTP, verifyOTP, OTP_EXPIRY_MINUTES } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/email";
import type { ActionState } from "@/types";

// ─── loginAction ──────────────────────────────────────────────────────────────

export async function loginAction(formData: FormData): Promise<ActionState> {
  // Only sanitize email — passwords must NOT be escaped or they won't match
  // the stored bcrypt hash when they contain characters like & < > " '
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = parseSchema(loginSchema, {
    email: typeof raw.email === "string" ? sanitizeString(raw.email) : raw.email,
    password: raw.password,
  });
  if (!parsed.success) return parsed;

  const rateLimitResult = await checkRateLimit(authRatelimit, parsed.data.email);
  if (!rateLimitResult.success) return rateLimitResult;

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });

    return { success: true, data: undefined };
  } catch (err) {
    // next-auth wraps credential failures in a CallbackRouteError
    const isAuthError =
      err instanceof Error && err.constructor?.name === "CallbackRouteError";

    if (isAuthError) {
      return { success: false, error: "Invalid email or password." };
    }

    console.error("[loginAction] unexpected error:", err);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// ─── registerAction ───────────────────────────────────────────────────────────

export async function registerAction(formData: FormData): Promise<ActionState> {
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const sanitized = sanitizeAndStrip(raw as Record<string, unknown>) as {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  };

  const parsed = parseSchema(registerSchema, sanitized);
  if (!parsed.success) return parsed;

  const { name, email, password } = parsed.data;

  const rateLimitResult = await checkRateLimit(authRatelimit, email);
  if (!rateLimitResult.success) return rateLimitResult;

  try {
    const supabase = getSupabaseServerClient();

    // Check if user already exists
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase())
      .single();

    if (existing) {
      return { success: false, error: "An account with this email already exists." };
    }

    // Hash password and create user
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const { error: insertError } = await supabase.from("users").insert({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "user",
      email_verified: false,
      provider: "credentials",
    });

    if (insertError) {
      console.error("[registerAction] insert error:", insertError);
      return { success: false, error: "Registration failed. Please try again." };
    }

    // Generate and send verification OTP
    const otp = generateOTP();
    const hashedOTP = hashOTP(otp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await supabase.from("otps").insert({
      email: email.toLowerCase(),
      hashed_otp: hashedOTP,
      purpose: "email-verification",
      expires_at: expiresAt.toISOString(),
    });

    await sendVerificationEmail({ to: email, name, otp });

    return { success: true, data: undefined };
  } catch (err) {
    console.error("[registerAction] error:", err);
    return { success: false, error: "Registration failed. Please try again." };
  }
}

// ─── verifyEmailAction ────────────────────────────────────────────────────────

export async function verifyEmailAction(
  formData: FormData
): Promise<ActionState> {
  const raw = {
    email: formData.get("email"),
    otp: formData.get("otp"),
  };

  const sanitized = sanitizeAndStrip(raw as Record<string, unknown>) as {
    email: string;
    otp: string;
  };

  const parsed = parseSchema(verifyEmailSchema, sanitized);
  if (!parsed.success) return parsed;

  const { email, otp } = parsed.data;

  try {
    const supabase = getSupabaseServerClient();

    // Find a valid, unused OTP for this email
    const { data: record, error } = await supabase
      .from("otps")
      .select("id, hashed_otp")
      .eq("email", email.toLowerCase())
      .eq("purpose", "email-verification")
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !record) {
      return { success: false, error: "Invalid or expired code." };
    }

    const isValid = verifyOTP(otp, record.hashed_otp);
    if (!isValid) {
      return { success: false, error: "Invalid or expired code." };
    }

    // Mark OTP as used
    await supabase.from("otps").update({ used: true }).eq("id", record.id);

    // Mark user as email verified
    await supabase
      .from("users")
      .update({ email_verified: true })
      .eq("email", email.toLowerCase());

    return { success: true, data: undefined };
  } catch (err) {
    console.error("[verifyEmailAction] error:", err);
    return { success: false, error: "Verification failed. Please try again." };
  }
}

// ─── logoutAction ─────────────────────────────────────────────────────────────

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
  redirect("/login");
}
