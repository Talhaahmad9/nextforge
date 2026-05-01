"use server";

import { redirect } from "next/navigation";
import { signIn, signOut } from "@/lib/auth";
import { connectMongo } from "@/lib/db/mongo";
import { UserModel } from "@/lib/db/models/user.model";
import { OTPModel } from "@/lib/db/models/otp.model";
import { sanitizeAndStrip, sanitizeString, stripMongoOperators } from "@/lib/sanitize";
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
  } catch {
    return { success: false, error: "Invalid email or password." };
  }

  return { success: true, data: undefined };
}

// ─── registerAction ───────────────────────────────────────────────────────────

export async function registerAction(formData: FormData): Promise<ActionState> {
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const sanitized = sanitizeAndStrip(raw as Record<string, unknown>);

  const parsed = parseSchema(registerSchema, sanitized);
  if (!parsed.success) return parsed;

  const { name, email, password } = parsed.data;

  const rateLimitResult = await checkRateLimit(authRatelimit, email);
  if (!rateLimitResult.success) return rateLimitResult;

  try {
    await connectMongo();

    const existingUserQuery = stripMongoOperators({ email }) as { email: string };
    const existing = await UserModel.findOne(existingUserQuery);
    if (existing) {
      return { success: false, error: "An account with this email already exists." };
    }

    await UserModel.create({ name, email, password });

    const otp = generateOTP();
    const hashedOTP = hashOTP(otp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await OTPModel.create({
      email,
      hashedOTP,
      purpose: "email-verification",
      expiresAt,
    });

    await sendVerificationEmail({ to: email, name, otp });

    return {
      success: true,
      data: undefined,
      message: "Check your email for a verification code.",
    };
  } catch (err) {
    console.error("[registerAction] error:", err);
    return { success: false, error: "Registration failed. Please try again." };
  }
}

// ─── verifyEmailAction ────────────────────────────────────────────────────────

export async function verifyEmailAction(formData: FormData): Promise<ActionState> {
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
  const { email } = sanitized;

  if (!email || typeof email !== "string") {
    return { success: false, error: "Email is required." };
  }

  try {
    await connectMongo();

    // Only strip user-supplied data — never pass trusted operators like $gt
    // through stripMongoOperators, which would remove them and match all records
    const safeEmail = stripMongoOperators({ email }) as { email: string };
    const record = await OTPModel.findOne({
      ...safeEmail,
      purpose: "email-verification",
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

    await UserModel.updateOne(
      stripMongoOperators({ email }) as Parameters<typeof UserModel.updateOne>[0],
      { emailVerified: true }
    );

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
