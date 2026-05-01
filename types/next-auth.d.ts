import type { DefaultUser } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: "user" | "admin";
      emailVerified: boolean;
    };
  }

  interface User extends DefaultUser {
    role: "user" | "admin";
    emailVerified: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: "user" | "admin";
    emailVerified: boolean;
  }
}
