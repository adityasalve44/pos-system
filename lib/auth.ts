/**
 * lib/auth.ts — next-auth v4 configuration.
 *
 * Exports:
 *  - authOptions  → passed to NextAuth() in the route handler and to
 *                   getServerSession() in every API route / server component
 *  - auth()       → thin wrapper around getServerSession so callers never
 *                   need to import authOptions themselves
 *
 * TypeScript: all custom fields are typed via module augmentation in
 * types/next-auth.d.ts — no `as any` casts needed anywhere.
 */
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
  email: z.string().email(),
  password: z.string().min(1),
});

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

        // Return shape maps to the User interface in next-auth.d.ts
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
    // Persist custom fields from User → JWT on every sign-in
    jwt({ token, user }) {
      if (user) {
        // `user` is typed as our augmented User; no casts needed
        token.id = user.id ?? "";
        token.role = user.role;
        token.restaurantId = user.restaurantId;
      }
      return token;
    },

    // Make JWT fields available on the session object
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
//   trustHost: true,
};

/**
 * Server-side session helper.
 * Use in API route handlers and React Server Components.
 *
 * @example
 * const session = await auth();
 * if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 */
export async function auth(): Promise<Session | null> {
  return getServerSession(authOptions);
}
