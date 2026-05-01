import mongoose, { type Document, type Model, Schema } from "mongoose";
import bcrypt from "bcryptjs";

// ─── Interface ────────────────────────────────────────────────────────────────

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  emailVerified: boolean;
  role: "user" | "admin";
  image?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [50, "Name must be at most 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
        message: "Please provide a valid email address",
      },
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    image: {
      type: String,
    },
  },
  { timestamps: true }
);

// ─── Pre-save: hash password when modified ────────────────────────────────────

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (err) {
    throw err instanceof Error ? err : new Error("Password hashing failed");
  }
});

// ─── Instance method: comparePassword ────────────────────────────────────────

userSchema.methods.comparePassword = async function (
  candidate: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidate, this.password as string);
  } catch {
    return false;
  }
};

// ─── Model (safe for Next.js hot reload) ─────────────────────────────────────

export const UserModel: Model<IUser> =
  (mongoose.models.User as Model<IUser>) ??
  mongoose.model<IUser>("User", userSchema);
