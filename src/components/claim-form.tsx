"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, ScanLine, ShieldCheck } from "lucide-react";
import { normalizeIndonesianPhone } from "@/lib/claim-utils";

type ClaimFormProps = {
  uniqueCode: string;
  campaignId: string;
};

type FormErrors = Partial<Record<"fullName" | "phoneWa" | "age" | "warungName" | "root", string>>;

export function ClaimForm({ uniqueCode, campaignId }: ClaimFormProps) {
  const router = useRouter();
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [form, setForm] = useState({
    fullName: "",
    phoneWa: "",
    age: "",
    warungName: ""
  });

  const normalizedPhone = useMemo(() => normalizeIndonesianPhone(form.phoneWa), [form.phoneWa]);

  function setField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined, root: undefined }));
  }

  function validateClient() {
    const nextErrors: FormErrors = {};

    if (form.fullName.trim().length < 2) nextErrors.fullName = "Nama wajib diisi.";
    if (!/^62\d{8,15}$/.test(normalizedPhone)) nextErrors.phoneWa = "Nomor WA harus valid.";
    if (!Number.isInteger(Number(form.age)) || Number(form.age) < 21) nextErrors.age = "Usia minimum 21 tahun.";
    if (form.warungName.trim().length < 2) nextErrors.warungName = "Nama warung wajib diisi.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateClient()) return;

    setSubmitting(true);

    try {
      const response = await fetch("/api/claim/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          campaignId,
          uniqueCode,
          fullName: form.fullName,
          phoneWa: normalizedPhone,
          age: form.age,
          warungName: form.warungName
        })
      });
      const payload = (await response.json().catch(() => null)) as { redirect?: string; message?: string } | null;

      if (payload?.redirect) {
        router.replace(payload.redirect);
        return;
      }

      setErrors({ root: payload?.message || "Klaim belum berhasil. Coba lagi." });
    } catch {
      setErrors({ root: "Jaringan bermasalah. Coba lagi sebentar lagi." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {!ageConfirmed ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-btc-ink/82 px-4 backdrop-blur-md">
          <div className="btc-panel w-full max-w-sm p-5 text-center shadow-neon">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center bg-btc-lime text-btc-ink" style={{ borderRadius: 8 }}>
              <ShieldCheck className="size-7" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-black italic leading-tight">Konfirmasi Usia</h1>
            <p className="mt-3 text-sm font-semibold leading-6 text-btc-mist">
              Program ini hanya untuk peserta berusia 21 tahun ke atas.
            </p>
            <button
              type="button"
              onClick={() => setAgeConfirmed(true)}
              className="btc-focus mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 bg-btc-lime px-4 text-sm font-black uppercase tracking-[0.14em] text-btc-ink"
              style={{ borderRadius: 8 }}
            >
              <CheckCircle2 className="size-4" aria-hidden="true" />
              Saya Berusia 21+
            </button>
            <button
              type="button"
              onClick={() => router.replace("/invalid")}
              className="btc-focus mt-3 inline-flex min-h-11 w-full items-center justify-center border border-btc-line bg-white/8 px-4 text-xs font-black uppercase tracking-[0.14em] text-white"
              style={{ borderRadius: 8 }}
            >
              Tidak, akhiri sesi
            </button>
          </div>
        </div>
      ) : null}

      <section className="mb-5 pt-4 text-center">
        <div className="mx-auto mb-4 flex w-fit items-center gap-2 rounded-full border border-btc-lime/40 bg-btc-lime/15 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-btc-limeSoft">
          <ScanLine className="size-4" aria-hidden="true" />
          Kode valid
        </div>
        <h1 className="mx-auto max-w-sm text-5xl font-black italic leading-[0.92] text-white sm:text-6xl">
          GET YOUR <span className="text-btc-lime">COOLEST PRIZE</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xs text-sm font-semibold leading-6 text-btc-mist">
          Isi data kamu untuk mendaftarkan kode.
        </p>
      </section>

      <form onSubmit={submit} className="btc-panel space-y-4 p-4 shadow-neon">
        <div className="rounded-lg border border-btc-lime/30 bg-btc-lime/10 p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-btc-limeSoft">Kode QR</p>
          <p className="mt-1 text-2xl font-black tracking-[0.14em]">{uniqueCode}</p>
        </div>

        <ClaimInput label="Nama Lengkap" value={form.fullName} error={errors.fullName} onChange={(value) => setField("fullName", value)} placeholder="Nama kamu" />
        <ClaimInput
          label="Nomor WhatsApp"
          value={form.phoneWa}
          error={errors.phoneWa}
          onBlur={() => setField("phoneWa", normalizedPhone)}
          onChange={(value) => setField("phoneWa", value)}
          placeholder="08xx / +62xx / 62xx"
          inputMode="tel"
        />
        <ClaimInput label="Usia" value={form.age} error={errors.age} onChange={(value) => setField("age", value)} placeholder="21" inputMode="numeric" />
        <ClaimInput label="Nama Warung" value={form.warungName} error={errors.warungName} onChange={(value) => setField("warungName", value)} placeholder="Nama outlet/warung" />

        {errors.root ? (
          <p className="rounded-lg border border-red-300/40 bg-red-300/10 p-3 text-sm font-semibold text-red-100">{errors.root}</p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="btc-focus inline-flex min-h-12 w-full items-center justify-center gap-2 bg-btc-lime px-4 text-sm font-black uppercase tracking-[0.16em] text-btc-ink transition hover:bg-btc-limeSoft disabled:cursor-not-allowed disabled:opacity-70"
          style={{ borderRadius: 8 }}
        >
          {isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="size-4" aria-hidden="true" />}
          {isSubmitting ? "Memproses" : "Submit"}
        </button>
      </form>
    </div>
  );
}

function ClaimInput({
  label,
  value,
  error,
  onChange,
  onBlur,
  placeholder,
  inputMode = "text"
}: {
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.16em] text-btc-mist">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        inputMode={inputMode}
        className="btc-focus min-h-12 w-full border border-btc-line bg-white/8 px-3 text-sm font-bold text-white placeholder:text-btc-mist"
        style={{ borderRadius: 8 }}
        placeholder={placeholder}
      />
      {error ? <span className="mt-1 block text-xs font-bold text-red-100">{error}</span> : null}
    </label>
  );
}
