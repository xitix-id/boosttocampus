"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();
  const [isLoading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => null);
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      aria-label="Logout"
      title="Logout"
      onClick={() => void logout()}
      disabled={isLoading}
      className="btc-focus inline-flex size-9 items-center justify-center border border-btc-line bg-white/8 text-white transition hover:border-btc-lime/50 hover:bg-btc-lime/15 disabled:cursor-not-allowed disabled:opacity-70"
      type="button"
      style={{ borderRadius: 8 }}
    >
      {isLoading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <LogOut className="size-4" aria-hidden="true" />}
    </button>
  );
}
