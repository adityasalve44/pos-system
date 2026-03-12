/**
 * app/api/auth/[...nextauth]/route.ts
 *
 * next-auth v4 catch-all handler for the App Router.
 * v4 returns a plain handler function from NextAuth(), not a { handlers } object.
 */
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
