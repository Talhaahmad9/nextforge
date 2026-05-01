import mongoose, { type Connection } from "mongoose";
// mongoose-sanitize has no bundled types — use require to avoid TS errors
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mongooseSanitize = require("mongoose-sanitize") as (
  schema: mongoose.Schema
) => void;

// ─── Global cache (survives Next.js hot reload / serverless warm starts) ──────

declare global {
  var _mongoose: { conn: Connection | null; promise: Promise<Connection> | null };
}

const cached = (global._mongoose ??= { conn: null, promise: null });

// ─── connectMongo ─────────────────────────────────────────────────────────────

export async function connectMongo(): Promise<Connection> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "[mongo] MONGODB_URI environment variable is not set. " +
        "Add it to your .env.local file."
    );
  }

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const dbName = process.env.MONGODB_DB_NAME ?? "app";

    cached.promise = mongoose
      .connect(uri, {
        bufferCommands: false,
        dbName,
      })
      .then((m) => {
        console.log(`[mongo] Connected to database "${dbName}"`);
        return m.connection;
      })
      .catch((err: unknown) => {
        cached.promise = null;
        const message =
          err instanceof Error ? err.message : "Unknown connection error";
        throw new Error(`[mongo] Failed to connect to MongoDB: ${message}`);
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

// ─── Global plugin registration ───────────────────────────────────────────────
// Registers once at module load; applies to every schema going forward.
mongoose.plugin(mongooseSanitize);

// ─── Export mongoose instance for model definitions ───────────────────────────
export default mongoose;
