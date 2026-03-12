/**
 * types/next-auth.d.ts — Module augmentation for next-auth v4.
 *
 * Extends the built-in Session, User, and JWT types so every file in the
 * project gets full type safety for `id`, `role`, and `restaurantId`
 * without a single `as any` cast.
 *
 * @see https://next-auth.js.org/getting-started/typescript
 */
import type { DefaultSession, DefaultUser } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";
import type { UserRole } from "@/types";

declare module "next-auth" {
  /**
   * Returned by useSession() and the session callback.
   * Merges custom fields into DefaultSession["user"] so existing
   * fields (name, email, image) are preserved.
   */
  interface Session {
    user: {
      id: string;
      role: UserRole;
      restaurantId: string;
    } & DefaultSession["user"];
  }

  /**
   * Returned by the authorize() callback.
   * These fields are passed into the jwt() callback as `user` on sign-in.
   */
  interface User extends DefaultUser {
    role: UserRole;
    restaurantId: string;
  }
}

declare module "next-auth/jwt" {
  /**
   * The decoded JWT payload, available in the jwt() and session() callbacks
   * and in getToken() calls (e.g. in proxy.ts).
   */
  interface JWT extends DefaultJWT {
    id: string;
    role: UserRole;
    restaurantId: string;
  }
}
