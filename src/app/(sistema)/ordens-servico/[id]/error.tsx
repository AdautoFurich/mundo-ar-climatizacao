"use client";

import { RefreshCw, TriangleAlert } from "lucide-react";
import Link from "next/link";

export default function ServiceOrderDetailsError({ reset }: { reset: () => void }) {
  return (
    <div className="grid min-h-[calc(100dvh-5.35rem)] place-items-center px-4 py-10">
      <div className="w-full max-w-lg rounded-xl border bg-white p-6 text-center shadow-[0_2px_8px_rgba(16,45,63,0.04)]">
        <span aria-hidden="true" className="mx-auto grid size-14 place-items-center rounded-full bg-amber-50 text-[var(--warning)]">
          <TriangleAlert className="size-6" />
        </span>
        <h2 className="mt-4 font-display text-xl font-bold text-[var(--brand)]">Não foi possível carregar a ordem</h2>
        <p className="mt-1 text-sm leading-6 text-[var(--ink-muted)]">Tente recarregar os dados. Se o problema continuar, volte para a listagem.</p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
          <Link className="inline-flex min-h-11 items-center justify-center rounded-lg border px-4 text-sm font-semibold text-[var(--brand)] hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]" href="/ordens-servico">Voltar para a listagem</Link>
          <button className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--action)] px-4 text-sm font-semibold text-white hover:bg-[var(--action-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2" onClick={reset} type="button">
            <RefreshCw aria-hidden="true" className="size-4" /> Tentar novamente
          </button>
        </div>
      </div>
    </div>
  );
}
