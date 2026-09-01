import { Gauge, ShieldCheck, Wrench } from "lucide-react";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[var(--canvas)] lg:grid lg:grid-cols-[minmax(25rem,0.9fr)_minmax(32rem,1.1fr)]">
      <section className="relative hidden overflow-hidden bg-[var(--brand)] px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between xl:px-16">
        <div aria-hidden="true" className="absolute inset-0 opacity-25">
          <div className="absolute -left-28 top-36 h-64 w-[135%] -rotate-6 border-y border-[var(--brand-accent)]/40" />
          <div className="absolute -left-20 top-52 h-32 w-[130%] -rotate-6 border-y border-white/15" />
          <div className="absolute bottom-20 right-12 size-56 rounded-full border border-white/10" />
          <div className="absolute bottom-28 right-20 size-40 rounded-full border border-[var(--brand-accent)]/25" />
        </div>

        <div className="relative flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-xl border border-white/15 bg-white/8 text-[var(--brand-accent)]">
            <Wrench aria-hidden="true" className="size-5" />
          </div>
          <div>
            <p className="font-display text-2xl font-bold uppercase leading-none tracking-[0.02em]">
              Mundo Ar
            </p>
            <p className="mt-1 text-[0.67rem] font-semibold uppercase tracking-[0.19em] text-[var(--brand-accent)]">
              Climatização automotiva
            </p>
          </div>
        </div>

        <div className="relative max-w-xl pb-8">
          <div className="mb-5 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.16em] text-[var(--brand-accent)]">
            <span className="h-px w-9 bg-current" />
            Controle operacional
          </div>
          <h1 className="font-display text-5xl font-bold leading-[1.02] tracking-tight xl:text-6xl">
            Cada atendimento no ponto certo do fluxo.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">
            Acesso interno para acompanhar veículos, diagnósticos e ordens de serviço com segurança.
          </p>

          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            <div className="flex gap-3 border-l-2 border-[var(--brand-accent)] bg-white/6 px-4 py-3">
              <Gauge aria-hidden="true" className="mt-0.5 size-5 text-[var(--brand-accent)]" />
              <div>
                <p className="text-sm font-bold">Visão da oficina</p>
                <p className="mt-0.5 text-sm text-slate-400">Prioridades em leitura rápida</p>
              </div>
            </div>
            <div className="flex gap-3 border-l-2 border-[var(--brand-accent)] bg-white/6 px-4 py-3">
              <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 text-[var(--brand-accent)]" />
              <div>
                <p className="text-sm font-bold">Acesso por função</p>
                <p className="mt-0.5 text-sm text-slate-400">Somente o necessário para trabalhar</p>
              </div>
            </div>
          </div>
        </div>

        <p className="relative text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          Sistema de gestão • Ambiente interno
        </p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-md">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="grid size-11 place-items-center rounded-xl bg-[var(--brand)] text-[var(--brand-accent)]">
              <Wrench aria-hidden="true" className="size-5" />
            </div>
            <div>
              <p className="font-display text-xl font-bold uppercase leading-none text-[var(--brand)]">Mundo Ar</p>
              <p className="mt-1 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-[var(--action)]">Climatização automotiva</p>
            </div>
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}
