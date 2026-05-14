import Link from "next/link";
import { AlertTriangle, CheckCircle2, Gift, ShieldX, TimerReset, Wrench } from "lucide-react";

type ClaimShellProps = {
  children: React.ReactNode;
  compact?: boolean;
};

export function ClaimShell({ children, compact = false }: ClaimShellProps) {
  return (
    <main className="claim-bg relative min-h-screen overflow-hidden px-4 py-6 text-white">
      <div className="claim-rays" aria-hidden="true" />
      <div className="claim-orbit claim-orbit-one" aria-hidden="true" />
      <div className="claim-orbit claim-orbit-two" aria-hidden="true" />
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-48px)] w-full max-w-md flex-col">
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 rotate-3 items-center justify-center bg-btc-lime text-btc-ink shadow-neon" style={{ borderRadius: 8 }}>
              <Gift className="size-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xl font-black italic leading-none">BTC 2026</p>
              <p className="mt-1 text-[9px] font-black uppercase tracking-[0.2em] text-btc-mist">Claim Portal</p>
            </div>
          </div>
          <span className="rounded-full border border-btc-lime/40 bg-btc-lime/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-btc-limeSoft">
            21+
          </span>
        </header>
        <section className={compact ? "my-auto" : "pb-6"}>{children}</section>
      </div>
    </main>
  );
}

const statusIcon = {
  invalid: ShieldX,
  void: AlertTriangle,
  "rate-limit": TimerReset,
  maintenance: Wrench,
  success: CheckCircle2
};

const statusCopy = {
  invalid: {
    title: "Kode Tidak Valid",
    body: "Kode QR tidak terdaftar untuk campaign ini. Pastikan kamu scan QR dari kemasan resmi."
  },
  void: {
    title: "QR Sudah Digunakan",
    body: "Kode ini sudah pernah dipakai dan otomatis hangus untuk klaim berikutnya."
  },
  "rate-limit": {
    title: "Batas Scan Tercapai",
    body: "Satu perangkat atau jaringan hanya dapat melakukan 2 kali scan dalam 24 jam."
  },
  maintenance: {
    title: "Sedang Pemeliharaan",
    body: "Sistem belum bisa memproses klaim saat ini. Silakan coba lagi beberapa saat nanti."
  },
  success: {
    title: "Kode Berhasil di Submit.",
    body: "Data kamu sudah masuk ke campaign aktif."
  }
};

export function ClaimStatusCard({
  status,
  count,
  phone
}: {
  status: keyof typeof statusCopy;
  count?: string | null;
  phone?: string | null;
}) {
  const Icon = statusIcon[status];
  const copy = statusCopy[status];

  return (
    <ClaimShell compact>
      <div className="btc-panel p-5 text-center shadow-neon">
        <div className="mx-auto mb-5 flex size-16 items-center justify-center bg-btc-lime text-btc-ink" style={{ borderRadius: 8 }}>
          <Icon className="size-8" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-black italic leading-tight">{copy.title}</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm font-semibold leading-6 text-btc-mist">{copy.body}</p>
        {status === "success" ? (
          <p className="mt-4 rounded-lg border border-btc-lime/30 bg-btc-lime/10 p-3 text-sm font-bold text-btc-limeSoft">
            No. HP {phone || "Anda"} telah berhasil mengaktifkan {count || "1"} kode pada campaign ini.
          </p>
        ) : null}
        <Link
          href="/claim"
          className="btc-focus mt-5 inline-flex min-h-11 w-full items-center justify-center bg-btc-lime px-4 text-sm font-black uppercase tracking-[0.16em] text-btc-ink transition hover:bg-btc-limeSoft"
          style={{ borderRadius: 8 }}
        >
          Scan Kode Lain
        </Link>
      </div>
    </ClaimShell>
  );
}
