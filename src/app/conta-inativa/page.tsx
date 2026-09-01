import { LogOut, UserRoundX } from "lucide-react";

import { logoutAction } from "@/features/auth/actions";

export default function InactiveAccountPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--canvas)] px-5">
      <div className="w-full max-w-lg rounded-2xl border bg-white p-8 shadow-sm">
        <div className="grid size-12 place-items-center rounded-xl bg-amber-50 text-amber-800"><UserRoundX aria-hidden="true" className="size-6" /></div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.15em] text-[var(--action)]">Conta bloqueada</p>
        <h1 className="font-display mt-2 text-4xl font-bold text-[var(--brand)]">Acesso inativo</h1>
        <p className="mt-3 leading-7 text-[var(--ink-muted)]">Procure o administrador da oficina para verificar a situação da sua conta.</p>
        <form action={logoutAction} className="mt-7">
          <button className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[var(--action)] px-4 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]" type="submit">
            <LogOut aria-hidden="true" className="size-4" /> Voltar ao login
          </button>
        </form>
      </div>
    </main>
  );
}
