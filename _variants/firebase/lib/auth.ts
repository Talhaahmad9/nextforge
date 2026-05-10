import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { getFirestore } from "@/lib/db/firebase";
import { loginSchema } from "@/lib/validate";

type AuthUserShape = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: "user" | "admin";
  emailVerified: boolean;
};

type FirestoreUser = {
  name: string;
  email: string;
  password?: string;
  image?: string | null;
  role: "user" | "admin";
  email_verified: boolean;
  provider?: string;
  created_at?: string;
  updated_at?: string;
};

function mapUser(id: string, user: FirestoreUser): AuthUserShape {
  return {
    id,
    name: user.name,
    email: user.email,
    image: user.image ?? null,
    role: user.role,
    emailVerified: user.email_verified,
  };
}

async function getCanonicalUserByEmail(email: string): Promise<AuthUserShape | null> {
  const db = getFirestore();
  const snapshot = await db
    .collection("users")
    .where("email", "==", email.toLowerCase())
    .limit(1)
    .get();

  if (snapshot.empty) return null;

  const userDoc = snapshot.docs[0];
  return mapUser(userDoc.id, userDoc.data() as FirestoreUser);
}

async function upsertGoogleUser(params: {
  email: string;
  name?: string | null;
  image?: string | null;
}): Promise<AuthUserShape | null> {
  const db = getFirestore();
  const email = params.email.toLowerCase();
  const fallbackName = email.split("@")[0] || "User";
  const now = new Date().toISOString();

  const existingSnapshot = await db
    .collection("users")
    .where("email", "==", email)
    .limit(1)
    .get();

  if (!existingSnapshot.empty) {
    const userDoc = existingSnapshot.docs[0];
    const existingUser = userDoc.data() as FirestoreUser;

    await userDoc.ref.update({
      name: params.name?.trim() || existingUser.name || fallbackName,
      image: params.image ?? existingUser.image ?? null,
      email_verified: true,
      provider: existingUser.provider || "google",
      updated_at: now,
    });

    const updatedUser = (await userDoc.ref.get()).data() as FirestoreUser;
    return mapUser(userDoc.id, updatedUser);
  }

  const newUserRef = db.collection("users").doc();
  const newUser: FirestoreUser = {
    name: params.name?.trim() || fallbackName,
    email,
    image: params.image ?? null,
    role: "user",
    email_verified: true,
    provider: "google",
    created_at: now,
    updated_at: now,
  };

  await newUserRef.set(newUser);

  return mapUser(newUserRef.id, newUser);
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

          const db = getFirestore();
          const snapshot = await db.collection("users").where("email", "==", email.toLowerCase()).limit(1).get();

          if (snapshot.empty) return null;

          const userDoc = snapshot.docs[0];
          const user = userDoc.data();

          if (!user.password) return null;

          const isValid = await bcrypt.compare(password, user.password);
          if (!isValid) return null;

          return mapUser(userDoc.id, user as FirestoreUser);
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
