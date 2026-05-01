"use server";

import bcrypt from "bcryptjs";
import { getSupabaseServerClient } from "@/lib/db/supabase";
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
    const supabase = getSupabaseServerClient();

    const { data: user, error } = await supabase
      .from("users")
      .select("id, name")
      .eq("email", email.toLowerCase())
      .single();

    if (error || !user) return genericSuccess;

    const otp = generateOTP();
    const hashedOTP = hashOTP(otp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await supabase.from("otps").insert({
      email: email.toLowerCase(),
      hashed_otp: hashedOTP,
      purpose: "password-reset",
      expires_at: expiresAt.toISOString(),
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
    const supabase = getSupabaseServerClient();

    // Find a valid, unused OTP for this email
    const { data: record, error } = await supabase
      .from("otps")
      .select("id, hashed_otp")
      .eq("email", email.toLowerCase())
      .eq("purpose", "password-reset")
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

    // Hash the new password and update the user
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const { error: updateError } = await supabase
      .from("users")
      .update({ password: hashedPassword })
      .eq("email", email.toLowerCase());

    if (updateError) {
      console.error("[resetPasswordAction] update error:", updateError);
      return { success: false, error: "Password reset failed. Please try again." };
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

  // Generic message to prevent email enumeration
  const genericSuccess: ActionState = {
    success: true,
    data: undefined,
    message: "A new verification code was sent.",
  };

  try {
    const supabase = getSupabaseServerClient();

    const { data: user, error } = await supabase
      .from("users")
      .select("id, name")
      .eq("email", email.toLowerCase())
      .single();

    if (error || !user) return genericSuccess;

    const otp = generateOTP();
    const hashedOTP = hashOTP(otp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await supabase.from("otps").insert({
      email: email.toLowerCase(),
      hashed_otp: hashedOTP,
      purpose: "email-verification",
      expires_at: expiresAt.toISOString(),
    });

    await sendVerificationEmail({ to: email, name: user.name, otp });

    return genericSuccess;
  } catch (err) {
    console.error("[resendVerificationOTPAction] error:", err);
    return genericSuccess;
  }
}
