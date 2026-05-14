import { NextResponse } from "next/server";
import { submitClaim } from "@/lib/claim-service";
import { getClientIp } from "@/lib/claim-utils";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json({ message: "Payload tidak valid." }, { status: 400 });
  }

  const result = await submitClaim({
    ...(body as Record<string, unknown>),
    ipAddress: getClientIp(request.headers)
  });

  if (result.ok) {
    const params = new URLSearchParams({
      count: String(result.claimCount),
      phone: result.phoneWa
    });
    return NextResponse.json({ redirect: `/success?${params.toString()}` });
  }

  if (result.status === "rate_limited") return NextResponse.json({ redirect: "/rate-limit" }, { status: 429 });
  if (result.status === "already_used") return NextResponse.json({ redirect: "/void" }, { status: 409 });
  if (result.status === "invalid") return NextResponse.json({ redirect: "/invalid" }, { status: 404 });
  if (result.status === "system_error") return NextResponse.json({ redirect: "/maintenance" }, { status: 503 });

  return NextResponse.json({ message: result.message }, { status: 400 });
}
