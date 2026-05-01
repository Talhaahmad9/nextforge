import { Resend } from "resend";
import type { ActionState } from "@/types";
import { OTP_EXPIRY_MINUTES } from "@/lib/tokens";

// ─── Lazy client ──────────────────────────────────────────────────────────────
// Created on first use so that RESEND_API_KEY missing doesn't crash the module
// at import time — Zod validation in server actions can still run and return
// field errors before email sending is ever attempted.

function getResend(): Resend {
  if (!process.env.RESEND_API_KEY) {
    throw new Error(
      "[email] RESEND_API_KEY environment variable is not set. " +
        "Add it to your .env.local file. Get a key at https://resend.com."
    );
  }
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM = process.env.RESEND_FROM_EMAIL ?? "no-reply@yourdomain.com";
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "App";

// ─── Shared layout helpers ────────────────────────────────────────────────────

function otpBox(otp: string): string {
  return `
    <div style="
      background:#f3f4f6;
      border-radius:8px;
      padding:24px 32px;
      text-align:center;
      margin:32px auto;
      max-width:320px;
    ">
      <span style="
        font-family:monospace,Courier New,Courier;
        font-size:32px;
        font-weight:700;
        letter-spacing:8px;
        color:#111827;
      ">${otp}</span>
    </div>
  `;
}

function emailWrapper(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;padding:40px 48px;">
          <tr>
            <td>
              <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">${APP_NAME}</p>
              ${body}
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0;" />
              <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                This email was sent by ${APP_NAME}. If you didn't request this, you can safely ignore it.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── sendVerificationEmail ────────────────────────────────────────────────────

export async function sendVerificationEmail({
  to,
  name,
  otp,
}: {
  to: string;
  name: string;
  otp: string;
}): Promise<ActionState<void>> {
  const subject = `Verify your email — ${APP_NAME}`;

  const html = emailWrapper(
    subject,
    `
    <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#111827;">Verify your email address</h1>
    <p style="margin:0 0 8px;font-size:16px;color:#374151;">Hi ${name},</p>
    <p style="margin:0 0 24px;font-size:16px;color:#374151;line-height:1.6;">
      Thanks for signing up. Use the code below to verify your email address.
      This code expires in <strong>${OTP_EXPIRY_MINUTES} minutes</strong>.
    </p>
    ${otpBox(otp)}
    <p style="margin:0;font-size:14px;color:#6b7280;text-align:center;">
      Enter this code on the verification page. Do not share it with anyone.
    </p>
  `
  );

  const text = [
    `Verify your email — ${APP_NAME}`,
    ``,
    `Hi ${name},`,
    ``,
    `Thanks for signing up. Use the code below to verify your email address.`,
    `This code expires in ${OTP_EXPIRY_MINUTES} minutes.`,
    ``,
    `Your verification code: ${otp}`,
    ``,
    `Do not share this code with anyone.`,
    ``,
    `If you didn't create an account, you can safely ignore this email.`,
  ].join("\n");

  try {
    const { error } = await getResend().emails.send({
      from: FROM,
      to,
      subject,
      html,
      text,
    });

    if (error) {
      console.error("[email] sendVerificationEmail error:", error);
      return { success: false, error: "Failed to send email. Please try again." };
    }

    return { success: true, data: undefined };
  } catch (err) {
    console.error("[email] sendVerificationEmail unexpected error:", err);
    return { success: false, error: "Failed to send email. Please try again." };
  }
}

// ─── sendPasswordResetEmail ───────────────────────────────────────────────────

export async function sendPasswordResetEmail({
  to,
  name,
  otp,
}: {
  to: string;
  name: string;
  otp: string;
}): Promise<ActionState<void>> {
  const subject = `Reset your password — ${APP_NAME}`;

  const html = emailWrapper(
    subject,
    `
    <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#111827;">Reset your password</h1>
    <p style="margin:0 0 8px;font-size:16px;color:#374151;">Hi ${name},</p>
    <p style="margin:0 0 24px;font-size:16px;color:#374151;line-height:1.6;">
      We received a request to reset your password. Use the code below to proceed.
      This code expires in <strong>${OTP_EXPIRY_MINUTES} minutes</strong>.
    </p>
    ${otpBox(otp)}
    <p style="margin:0 0 16px;font-size:14px;color:#6b7280;text-align:center;">
      Enter this code on the password reset page.
    </p>
    <p style="margin:0;font-size:14px;color:#6b7280;text-align:center;">
      If you didn't request a password reset, you can safely ignore this email.
      Your password will not be changed.
    </p>
  `
  );

  const text = [
    `Reset your password — ${APP_NAME}`,
    ``,
    `Hi ${name},`,
    ``,
    `We received a request to reset your password.`,
    `Use the code below to proceed. This code expires in ${OTP_EXPIRY_MINUTES} minutes.`,
    ``,
    `Your reset code: ${otp}`,
    ``,
    `If you didn't request a password reset, you can safely ignore this email.`,
    `Your password will not be changed.`,
  ].join("\n");

  try {
    const { error } = await getResend().emails.send({
      from: FROM,
      to,
      subject,
      html,
      text,
    });

    if (error) {
      console.error("[email] sendPasswordResetEmail error:", error);
      return { success: false, error: "Failed to send email. Please try again." };
    }

    return { success: true, data: undefined };
  } catch (err) {
    console.error("[email] sendPasswordResetEmail unexpected error:", err);
    return { success: false, error: "Failed to send email. Please try again." };
  }
}
