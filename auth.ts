/**
 * auth.ts (root) — re-export shim.
 *
 * The real next-auth v4 configuration lives in lib/auth.ts.
 * All API routes import { auth } from "@/auth" — this shim keeps those
 * imports working without any changes to the route files.
 */
export { auth, authOptions } from "@/lib/auth";
