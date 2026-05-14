import { auth } from "@/lib/auth";

export async function POST(request: Request) {
  return auth.api.signOut({
    headers: request.headers,
    asResponse: true
  });
}
