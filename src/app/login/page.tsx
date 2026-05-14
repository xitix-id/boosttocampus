import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="flex w-full max-w-md flex-col items-center">
        <div className="mb-6 flex w-full items-center gap-3">
          <div className="flex size-11 rotate-3 items-center justify-center bg-btc-lime text-btc-ink shadow-neon" style={{ borderRadius: 8 }}>
            <span className="text-xl font-black">•</span>
          </div>
          <div>
            <p className="text-2xl font-black italic leading-none text-white">BTC 2026</p>
            <p className="mt-1 text-[10px] font-black uppercase tracking-[0.22em] text-btc-mist">Secure Admin Portal</p>
          </div>
        </div>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
