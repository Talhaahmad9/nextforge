import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { connectMongo } from "@/lib/db/mongo";
import { UserModel } from "@/lib/db/models/user.model";
import { loginSchema } from "@/lib/validate";

// Validate at runtime (dev + prod server) but not during `next build` static collection
if (
  !process.env.AUTH_SECRET &&
  process.env.NEXT_PHASE !== "phase-production-build"
) {
  throw new Error(
    "[auth] AUTH_SECRET environment variable is not set. " +
      "Run `openssl rand -base64 32` and add it to .env.local."
  );
}

export const { auth, signIn, signOut, handlers } = NextAuth({
  secret: process.env.AUTH_SECRET,

  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const parsed = loginSchema.safeParse(credentials);
          if (!parsed.success) return null;

          const { email, password } = parsed.data;

          await connectMongo();
          const user = await UserModel.findOne({ email }).select("+password");
          if (!user) return null;

          const isValid = await user.comparePassword(password);
          if (!isValid) return null;

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            image: user.image ?? null,
            role: user.role,
            emailVerified: user.emailVerified,
          };
        } catch (err) {
          console.error("[auth] Credentials authorize error:", err);
          return null;
        }
      },
    }),

    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // First sign-in: persist custom fields into the token
        const u = user as typeof user & {
          role: "user" | "admin";
          emailVerified: boolean;
        };
        token.id = u.id as string;
        token.role = u.role;
        token.emailVerified = u.emailVerified;
      }
      return token;
    },

    async session({ session, token }) {
      return {
        ...session,
        user: {
          name: session.user?.name ?? null,
          email: session.user?.email ?? null,
          image: session.user?.image ?? null,
          id: token.id as string,
          role: token.role as "user" | "admin",
          emailVerified: token.emailVerified as boolean,
        },
      };
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },
});
