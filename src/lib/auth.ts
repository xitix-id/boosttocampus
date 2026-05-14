import "server-only";

import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { getDb } from "@/db/client";
import * as schema from "@/db/schema";
import { getAdminBootstrapToken, getAdminEmail } from "@/lib/admin-credentials";

const isProduction = process.env.NODE_ENV === "production";
const baseURL = process.env.BETTER_AUTH_URL || "http://localhost:3000";
const authSecret = process.env.BETTER_AUTH_SECRET || "btc-2026-local-build-secret-change-before-production";

export const auth = betterAuth({
  appName: "BTC 2026 Admin",
  baseURL,
  trustedOrigins: [baseURL, "http://localhost:3000", "http://127.0.0.1:3000"],
  secret: authSecret,
  database: drizzleAdapter(getDb(), {
    provider: "sqlite",
    schema,
    transaction: true
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: false
  },
  session: {
    expiresIn: 60 * 60 * 8,
    updateAge: 60 * 30,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5
    }
  },
  advanced: {
    useSecureCookies: isProduction,
    cookiePrefix: "btc-admin",
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction
    }
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-up/email") {
        const email = String(ctx.body?.email ?? "").trim().toLowerCase();
        const bootstrapToken = ctx.headers?.get("x-admin-bootstrap-token");

        if (email !== getAdminEmail() || bootstrapToken !== getAdminBootstrapToken()) {
          throw new APIError("FORBIDDEN", {
            message: "Admin bootstrap is not allowed for this request."
          });
        }
      }
    })
  },
  plugins: [nextCookies()]
});

export type AuthSession = typeof auth.$Infer.Session;
