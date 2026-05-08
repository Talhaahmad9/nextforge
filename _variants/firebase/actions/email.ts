"use server";

import bcrypt from "bcryptjs";
import { getFirestore } from "@/lib/db/firebase";
import { sanitizeAndStrip } from "@/lib/sanitize";
import { parseSchema, forgotPasswordSchema, resetPasswordSchema } from "@/lib/validate";
import { otpRatelimit, checkRateLimit } from "@/lib/ratelimit";
import { generateOTP, hashOTP, verifyOTP, OTP_EXPIRY_MINUTES } from "@/lib/tokens";
import { sendPasswordResetEmail, sendVerificationEmail } from "@/lib/email";
import type { ActionState } from "@/types";

// ─── sendPasswordResetOTPAction ───────────────────────────────────────────────

export async function sendPasswordResetOTPAction(
  formData: FormData
): Promise<ActionState> {
  const raw = { email: formData.get("email") };
  const sanitized = sanitizeAndStrip(raw as Record<string, unknown>) as {
    email: string;
  };

  const parsed = parseSchema(forgotPasswordSchema, sanitized);
  if (!parsed.success) return parsed;

  const { email } = parsed.data;

  const rateLimitResult = await checkRateLimit(otpRatelimit, email);
  if (!rateLimitResult.success) return rateLimitResult;

  // Always return the same success message to prevent email enumeration
  const genericSuccess: ActionState = {
    success: true,
    data: undefined,
    message: "If that email exists, a code was sent.",
  };

  try {
    const db = getFirestore();

    const usersSnapshot = await db.collection("users").where("email", "==", email.toLowerCase()).limit(1).get();
    if (usersSnapshot.empty) return genericSuccess;

    const user = usersSnapshot.docs[0].data();

    const otp = generateOTP();
    const hashedOTP = hashOTP(otp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await db.collection("otps").add({
      email: email.toLowerCase(),
      hashed_otp: hashedOTP,
      purpose: "password-reset",
      expires_at: expiresAt.toISOString(),
      used: false,
      created_at: new Date().toISOString()
    });

    await sendPasswordResetEmail({ to: email, name: user.name, otp });

    return genericSuccess;
  } catch (err) {
    console.error("[sendPasswordResetOTPAction] error:", err);
    return genericSuccess;
  }
}

// ─── resetPasswordAction ──────────────────────────────────────────────────────

export async function resetPasswordAction(
  formData: FormData
): Promise<ActionState> {
  const raw = {
    email: formData.get("email"),
    otp: formData.get("otp"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const sanitized = sanitizeAndStrip(raw as Record<string, unknown>);

  const parsed = parseSchema(resetPasswordSchema, sanitized);
  if (!parsed.success) return parsed;

  const { otp, password } = parsed.data;

  const rawEmail = sanitized.email;
  if (!rawEmail || typeof rawEmail !== "string") {
    return { success: false, error: "Email is required." };
  }
  const email = rawEmail;

  try {
    const db = getFirestore();

    const otpsSnapshot = await db.collection("otps")
      .where("email", "==", email.toLowerCase())
      .where("purpose", "==", "password-reset")
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

    await recordDoc.ref.update({ used: true });

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const usersSnapshot = await db.collection("users").where("email", "==", email.toLowerCase()).limit(1).get();
    if (!usersSnapshot.empty) {
      await usersSnapshot.docs[0].ref.update({ password: hashedPassword });
    }

    return {
      success: true,
      data: undefined,
      message: "Password updated. You can now log in.",
    };
  } catch (err) {
    console.error("[resetPasswordAction] error:", err);
    return { success: false, error: "Password reset failed. Please try again." };
  }
}

// ─── resendVerificationOTPAction ──────────────────────────────────────────────

export async function resendVerificationOTPAction(
  formData: FormData
): Promise<ActionState> {
  const raw = { email: formData.get("email") };
  const sanitized = sanitizeAndStrip(raw as Record<string, unknown>) as {
    email: string;
  };

  const parsed = parseSchema(forgotPasswordSchema, sanitized);
  if (!parsed.success) return parsed;

  const { email } = parsed.data;

  const rateLimitResult = await checkRateLimit(otpRatelimit, email);
  if (!rateLimitResult.success) return rateLimitResult;

  const genericSuccess: ActionState = {
    success: true,
    data: undefined,
    message: "A new verification code was sent.",
  };

  try {
    const db = getFirestore();

    const usersSnapshot = await db.collection("users").where("email", "==", email.toLowerCase()).limit(1).get();
    if (usersSnapshot.empty) return genericSuccess;

    const user = usersSnapshot.docs[0].data();

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

    await sendVerificationEmail({ to: email, name: user.name, otp });

    return genericSuccess;
  } catch (err) {
    console.error("[resendVerificationOTPAction] error:", err);
    return genericSuccess;
  }
}
