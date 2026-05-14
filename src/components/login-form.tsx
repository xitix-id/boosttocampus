"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Loader2, LockKeyhole, Sparkles } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = useMemo(() => {
    const value = searchParams.get("redirect");
    return value?.startsWith("/admin") ? value : "/admin";
  }, [searchParams]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        setError(payload?.message || "Email atau password admin tidak valid.");
        return;
      }

      router.replace(redirectTo);
      router.refresh();
    } catch {
      setError("Tidak bisa menghubungi server auth. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="btc-panel w-full max-w-md p-5 shadow-neon sm:p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="mb-4 inline-flex size-12 items-center justify-center bg-btc-lime text-btc-ink" style={{ borderRadius: 8 }}>
            <LockKeyhole className="size-6" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-black italic leading-none text-white">Admin Login</h1>
          <p className="mt-2 text-sm font-semibold text-btc-mist">Masuk ke BTC 2026 campaign command center.</p>
        </div>
        <Sparkles className="mt-2 size-6 shrink-0 text-btc-lime" aria-hidden="true" />
      </div>

      <div className="space-y-4">
        <label className="block">
          <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-btc-mist">Email Admin</span>
          <input
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="btc-focus min-h-12 w-full border border-btc-line bg-white/8 px-3 text-sm font-bold text-white placeholder:text-btc-mist"
            style={{ borderRadius: 8 }}
            placeholder="admin@btc2026.local"
            type="email"
            required
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-btc-mist">Password</span>
          <input
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="btc-focus min-h-12 w-full border border-btc-line bg-white/8 px-3 text-sm font-bold text-white placeholder:text-btc-mist"
            style={{ borderRadius: 8 }}
            placeholder="••••••••"
            type="password"
            required
          />
        </label>
      </div>

      {error ? (
        <div className="mt-4 flex items-start gap-2 border border-red-300/40 bg-red-300/10 p-3 text-sm font-semibold text-red-100" style={{ borderRadius: 8 }}>
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isLoading}
        className="btc-focus mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 bg-btc-lime px-4 text-sm font-black uppercase tracking-[0.16em] text-btc-ink transition hover:bg-btc-limeSoft disabled:cursor-not-allowed disabled:opacity-70"
        style={{ borderRadius: 8 }}
      >
        {isLoading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <LockKeyhole className="size-4" aria-hidden="true" />}
        {isLoading ? "Authenticating" : "Login"}
      </button>
    </form>
  );
}
