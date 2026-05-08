"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { signIn, signOut } from "@/lib/auth";
import { getFirestore } from "@/lib/db/firebase";
import { sanitizeAndStrip, sanitizeString } from "@/lib/sanitize";
import { parseSchema, loginSchema, registerSchema, verifyEmailSchema } from "@/lib/validate";
import { authRatelimit, checkRateLimit } from "@/lib/ratelimit";
import { generateOTP, hashOTP, verifyOTP, OTP_EXPIRY_MINUTES } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/email";
import type { ActionState } from "@/types";

// ─── loginAction ──────────────────────────────────────────────────────────────

export async function loginAction(formData: FormData): Promise<ActionState> {
  // Only sanitize email — passwords must NOT be escaped
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
    const db = getFirestore();

    // Check if user already exists
    const existingSnapshot = await db.collection("users").where("email", "==", email.toLowerCase()).limit(1).get();

    if (!existingSnapshot.empty) {
      return { success: false, error: "An account with this email already exists." };
    }

    // Hash password and create user
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUserRef = db.collection("users").doc();
    await newUserRef.set({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "user",
      email_verified: false,
      provider: "credentials",
      created_at: new Date().toISOString()
    });

    // Generate and send verification OTP
    const otp = generateOTP();
    const hashedOTP = hashOTP(otp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await db.collection("otps").add({
      email: email.toLowerCase(),
      hashed_otp: hashedOTP,
      purpose: "email-verification",
      expires_at: expiresAt.toISOString(),
      used: false,
      created_at: new Date().toISOString()
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

  const { otp } = parsed.data;
  const email = sanitized.email;

  try {
    const db = getFirestore();

    const otpsSnapshot = await db.collection("otps")
      .where("email", "==", email.toLowerCase())
      .where("purpose", "==", "email-verification")
      .where("used", "==", false)
      .orderBy("created_at", "desc")
      .limit(1)
      .get();

    if (otpsSnapshot.empty) {
      return { success: false, error: "Invalid or expired code." };
    }

    const recordDoc = otpsSnapshot.docs[0];
    const record = recordDoc.data();

    if (new Date(record.expires_at) < new Date()) {
      return { success: false, error: "Invalid or expired code." };
    }

    const isValid = verifyOTP(otp, record.hashed_otp);
    if (!isValid) {
      return { success: false, error: "Invalid or expired code." };
    }

    // Mark OTP as used
    await recordDoc.ref.update({ used: true });

    // Mark user as email verified
    const usersSnapshot = await db.collection("users").where("email", "==", email.toLowerCase()).limit(1).get();
    if (!usersSnapshot.empty) {
      await usersSnapshot.docs[0].ref.update({ email_verified: true });
    }

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
