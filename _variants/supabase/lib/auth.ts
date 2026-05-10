import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { getSupabaseServerClient } from "@/lib/db/supabase";
import { loginSchema } from "@/lib/validate";

type AuthUserShape = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: "user" | "admin";
  emailVerified: boolean;
};

type SupabaseUserRow = {
  id: string;
  name: string;
  email: string;
  password?: string | null;
  image?: string | null;
  role: "user" | "admin";
  email_verified: boolean;
  provider?: string | null;
};

function mapUser(user: SupabaseUserRow): AuthUserShape {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image ?? null,
    role: user.role,
    emailVerified: user.email_verified,
  };
}

async function getCanonicalUserByEmail(email: string): Promise<AuthUserShape | null> {
  const supabase = getSupabaseServerClient();
  const { data: user, error } = await supabase
    .from("users")
    .select("id, name, email, image, role, email_verified")
    .eq("email", email.toLowerCase())
    .single();

  if (error || !user) return null;

  return mapUser(user as SupabaseUserRow);
}

async function upsertGoogleUser(params: {
  email: string;
  name?: string | null;
  image?: string | null;
}): Promise<AuthUserShape | null> {
  const supabase = getSupabaseServerClient();
  const email = params.email.toLowerCase();
  const fallbackName = email.split("@")[0] || "User";

  const { data: existingUser } = await supabase
    .from("users")
    .select("id, name, email, password, image, role, email_verified, provider")
    .eq("email", email)
    .single();

  const payload = {
    email,
    name: params.name?.trim() || existingUser?.name || fallbackName,
    image: params.image ?? existingUser?.image ?? null,
    email_verified: true,
    provider: existingUser?.provider || "google",
    role: existingUser?.role || "user",
  };

  const { data: user, error } = await supabase
    .from("users")
    .upsert(payload, { onConflict: "email" })
    .select("id, name, email, image, role, email_verified")
    .single();

  if (error || !user) {
    console.error("[auth] Supabase Google upsert error:", error);
    return null;
  }

  return mapUser(user as SupabaseUserRow);
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

          const supabase = getSupabaseServerClient();
          const { data: user, error } = await supabase
            .from("users")
            .select("id, name, email, password, image, role, email_verified")
            .eq("email", email.toLowerCase())
            .single();

          if (error || !user || !user.password) return null;

          const isValid = await bcrypt.compare(password, user.password);
          if (!isValid) return null;

          return mapUser(user as SupabaseUserRow);
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
