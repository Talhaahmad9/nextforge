import mongoose, { type Document, type Model, Schema } from "mongoose";

// ─── Interface ────────────────────────────────────────────────────────────────

export interface IOTP extends Document {
  email: string;
  hashedOTP: string;
  purpose: "email-verification" | "password-reset";
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const otpSchema = new Schema<IOTP>({
  email: {
    type: String,
    required: [true, "Email is required"],
    lowercase: true,
    trim: true,
  },
  hashedOTP: {
    type: String,
    required: [true, "Hashed OTP is required"],
    select: false,
  },
  purpose: {
    type: String,
    required: [true, "Purpose is required"],
    enum: ["email-verification", "password-reset"],
  },
  expiresAt: {
    type: Date,
    required: [true, "Expiry date is required"],
    index: { expireAfterSeconds: 0 }, // TTL: MongoDB auto-deletes when expiresAt passes
  },
  used: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// ─── Model (safe for Next.js hot reload) ─────────────────────────────────────

export const OTPModel: Model<IOTP> =
  (mongoose.models.OTP as Model<IOTP>) ??
  mongoose.model<IOTP>("OTP", otpSchema);
