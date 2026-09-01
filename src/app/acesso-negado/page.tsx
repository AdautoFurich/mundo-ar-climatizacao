import { ArrowLeft, ShieldX } from "lucide-react";
import Link from "next/link";

export default function AccessDeniedPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--canvas)] px-5">
      <div className="w-full max-w-lg rounded-2xl border bg-white p-8 shadow-sm">
        <div className="grid size-12 place-items-center rounded-xl bg-amber-50 text-amber-800"><ShieldX aria-hidden="true" className="size-6" /></div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.15em] text-[var(--action)]">Permissão necessária</p>
        <h1 className="font-display mt-2 text-4xl font-bold text-[var(--brand)]">Acesso não permitido</h1>
        <p className="mt-3 leading-7 text-[var(--ink-muted)]">Seu perfil não possui permissão para realizar esta operação.</p>
        <Link className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[var(--action)] px-4 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]" href="/">
          <ArrowLeft aria-hidden="true" className="size-4" /> Voltar à visão geral
        </Link>
      </div>
    </main>
  );
}
