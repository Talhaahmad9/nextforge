import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { randomBytes } from "node:crypto";
import { connectMongo } from "@/lib/db/mongo";
import { UserModel } from "@/lib/db/models/user.model";
import { loginSchema } from "@/lib/validate";

type AuthUserShape = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: "user" | "admin";
  emailVerified: boolean;
};

function mapUser(user: {
  _id: { toString(): string };
  name: string;
  email: string;
  image?: string;
  role: "user" | "admin";
  emailVerified: boolean;
}): AuthUserShape {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    image: user.image ?? null,
    role: user.role,
    emailVerified: user.emailVerified,
  };
}

async function getCanonicalUserByEmail(email: string): Promise<AuthUserShape | null> {
  await connectMongo();

  const user = await UserModel.findOne({ email: email.toLowerCase() });
  if (!user) return null;

  return mapUser(user);
}

async function upsertGoogleUser(params: {
  email: string;
  name?: string | null;
  image?: string | null;
}): Promise<AuthUserShape | null> {
  const email = params.email.toLowerCase();
  const name = params.name?.trim() || email.split("@")[0] || "User";

  await connectMongo();

  const user = await UserModel.findOneAndUpdate(
    { email },
    {
      $set: {
        name,
        image: params.image ?? undefined,
        emailVerified: true,
      },
      $setOnInsert: {
        password: randomBytes(32).toString("hex"),
        role: "user",
      },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  );

  return user ? mapUser(user) : null;
}

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

          return mapUser(user);
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
    async signIn({ account, user }) {
      if (account?.provider !== "google") return true;

      if (!user.email) {
        console.error("[auth] Google sign-in rejected: missing email");
        return false;
      }

      try {
        const canonicalUser = await upsertGoogleUser({
          email: user.email,
          name: user.name,
          image: user.image,
        });

        return Boolean(canonicalUser);
      } catch (err) {
        console.error("[auth] Google sign-in upsert error:", err);
        return false;
      }
    },

    async jwt({ token, user }) {
      if (user) {
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
      }

      if (token.email) {
        try {
          const canonicalUser = await getCanonicalUserByEmail(token.email);
          if (canonicalUser) {
            token.id = canonicalUser.id;
            token.name = canonicalUser.name;
            token.email = canonicalUser.email;
            token.picture = canonicalUser.image;
            token.role = canonicalUser.role;
            token.emailVerified = canonicalUser.emailVerified;
          }
        } catch (err) {
          console.error("[auth] JWT hydration error:", err);
        }
      }

      return token;
    },

    async session({ session, token }) {
      return {
        ...session,
        user: {
          name: token.name ?? session.user?.name ?? null,
          email: token.email ?? session.user?.email ?? null,
          image: token.picture ?? session.user?.image ?? null,
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
