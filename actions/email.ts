"use server";

import { connectMongo } from "@/lib/db/mongo";
import { UserModel } from "@/lib/db/models/user.model";
import { OTPModel } from "@/lib/db/models/otp.model";
import { sanitizeAndStrip, stripMongoOperators } from "@/lib/sanitize";
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
    await connectMongo();

    const safeQuery = stripMongoOperators({ email }) as Parameters<
      typeof UserModel.findOne
    >[0];
    const user = await UserModel.findOne(safeQuery);

    if (!user) return genericSuccess;

    const otp = generateOTP();
    const hashedOTP = hashOTP(otp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await OTPModel.create({
      email,
      hashedOTP,
      purpose: "password-reset",
      expiresAt,
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
    await connectMongo();

    // Only strip user-supplied data — never pass trusted operators like $gt
    // through stripMongoOperators, which would remove them and match all records
    const safeEmail = stripMongoOperators({ email }) as { email: string };
    const record = await OTPModel.findOne({
      ...safeEmail,
      purpose: "password-reset",
      used: false,
      expiresAt: { $gt: new Date() },
    }).select("+hashedOTP");
    if (!record) {
      return { success: false, error: "Invalid or expired code." };
    }

    const isValid = verifyOTP(otp, record.hashedOTP);
    if (!isValid) {
      return { success: false, error: "Invalid or expired code." };
    }

    record.used = true;
    await record.save();

    const userQuery = stripMongoOperators({ email }) as Parameters<
      typeof UserModel.findOne
    >[0];
    const user = await UserModel.findOne(userQuery).select("+password");
    if (!user) {
      return { success: false, error: "Account not found." };
    }

    user.password = password;
    await user.save(); // pre-save hook hashes the new password

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
    await connectMongo();

    const safeQuery = stripMongoOperators({ email }) as Parameters<
      typeof UserModel.findOne
    >[0];
    const user = await UserModel.findOne(safeQuery);
    if (!user) return genericSuccess;

    const otp = generateOTP();
    const hashedOTP = hashOTP(otp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await OTPModel.create({
      email,
      hashedOTP,
      purpose: "email-verification",
      expiresAt,
    });

    await sendVerificationEmail({ to: email, name: user.name, otp });

    return genericSuccess;
  } catch (err) {
    console.error("[resendVerificationOTPAction] error:", err);
    return genericSuccess;
  }
}
