import { NextResponse } from "next/server";
import { isAPIError } from "better-auth/api";
import { auth } from "@/lib/auth";
import {
  getAdminBootstrapToken,
  getAdminEmail,
  getAdminPassword,
  isAdminCredential
} from "@/lib/admin-credentials";

type LoginBody = {
  email?: string;
  password?: string;
};

function jsonError(message: string, status = 401) {
  return NextResponse.json({ ok: false, message }, { status });
}

async function ensureAdminUser(request: Request) {
  const email = getAdminEmail();
  const password = getAdminPassword();

  try {
    await auth.api.signInEmail({
      body: {
        email,
        password,
        rememberMe: false
      },
      headers: request.headers
    });
  } catch (error) {
    if (!isAPIError(error)) {
      throw error;
    }

    const bootstrapHeaders = new Headers(request.headers);
    bootstrapHeaders.set("x-admin-bootstrap-token", getAdminBootstrapToken());

    await auth.api.signUpEmail({
      body: {
        name: "BTC Admin",
        email,
        password
      },
      headers: bootstrapHeaders
    });
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as LoginBody;
  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";

  if (!isAdminCredential(email, password)) {
    return jsonError("Email atau password admin tidak valid.");
  }

  try {
    await ensureAdminUser(request);

    return await auth.api.signInEmail({
      body: {
        email,
        password,
        rememberMe: false
      },
      headers: request.headers,
      asResponse: true
    });
  } catch {
    return jsonError("Login gagal. Periksa konfigurasi admin dan database.", 500);
  }
}
