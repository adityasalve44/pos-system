import CredentialsProvider from "next-auth/providers/credentials";
import { getServerSession } from "next-auth";
import type { NextAuthOptions, Session } from "next-auth";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { UserRole } from "@/types";

const signInSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

// In production the NEXTAUTH_URL is https:// → next-auth sets the __Secure-
// prefixed cookie. The authOptions must declare the same cookie names so that
// both the sign-in handler and getServerSession() read the same cookie.
const isProduction = process.env.NODE_ENV === "production";
const cookieName = isProduction
  ? "__Secure-next-auth.session-token"
  : "next-auth.session-token";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = signInSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (!user || !user.isActive) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as UserRole,
          restaurantId: user.restaurantId,
        };
      },
    }),
  ],

  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id ?? "";
        token.role = user.role;
        token.restaurantId = user.restaurantId;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.restaurantId = token.restaurantId;
      return session;
    },
  },

  pages: {
    signIn: "/login",
  },

  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,

  // Explicitly declare cookie names so sign-in, getServerSession(), and
  // getToken() in proxy.ts all agree on the same cookie in every environment.
  cookies: {
    sessionToken: {
      name: cookieName,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProduction,
      },
    },
  },
};

export async function auth(): Promise<Session | null> {
  return getServerSession(authOptions);
}