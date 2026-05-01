import crypto from "crypto";

/** OTP expiry window in minutes */
export const OTP_EXPIRY_MINUTES = 10;

/**
 * Generates a cryptographically random 6-digit OTP string.
 * Uses crypto.randomInt to avoid Math.random bias.
 */
export function generateOTP(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/**
 * Returns the SHA-256 hex digest of the given OTP string.
 * Store only the hash — never the plaintext OTP.
 */
export function hashOTP(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

/**
 * Compares a plaintext OTP against a stored SHA-256 hash
 * using constant-time comparison to prevent timing attacks.
 */
export function verifyOTP(plain: string, hashed: string): boolean {
  const candidateHash = hashOTP(plain);
  const a = Buffer.from(candidateHash, "hex");
  const b = Buffer.from(hashed, "hex");

  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Generates a cryptographically random 32-byte CSRF token as a hex string.
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString("hex");
}
