import { Activity, ClipboardList, ShieldCheck, UsersRound } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

const highlights = [
  {
    title: "Ordens de serviço",
    description: "Organize e acompanhe os atendimentos da oficina em tempo real.",
    icon: ClipboardList,
  },
  {
    title: "Diagnósticos",
    description: "Registre análises técnicas e o histórico dos veículos.",
    icon: Activity,
  },
  {
    title: "Acesso por função",
    description: "Permissões adequadas para cada perfil da equipe.",
    icon: UsersRound,
  },
] as const;

function TechnicalContours() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -right-64 -top-64 size-[42rem] rounded-full border border-[var(--brand-accent)]/20" />
      <div className="absolute -right-56 -top-56 size-[38rem] rounded-full border border-[var(--brand-accent)]/14" />
      <div className="absolute -right-48 -top-48 size-[34rem] rounded-full border border-white/8" />
      <div className="absolute -bottom-56 -left-64 size-[35rem] rounded-full border border-[var(--brand-accent)]/20" />
      <div className="absolute -bottom-48 -left-56 size-[31rem] rounded-full border border-white/10" />
      <div className="absolute right-12 top-20 grid grid-cols-5 gap-3 opacity-20">
        {Array.from({ length: 20 }, (_, index) => (
          <span className="size-1 rounded-full bg-[var(--brand-accent)]" key={index} />
        ))}
      </div>
    </div>
  );
}

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-dvh bg-[var(--surface-subtle)] lg:grid lg:grid-cols-[minmax(0,0.98fr)_minmax(40rem,1.02fr)]">
      <aside className="relative hidden min-h-dvh overflow-hidden bg-[var(--brand-strong)] px-12 py-10 text-white lg:flex lg:flex-col xl:px-[6.5vw] xl:py-12">
        <TechnicalContours />

        <div className="relative z-10">
          <Image
            alt="Mundo Ar Climatização"
            className="h-auto w-48 object-contain xl:w-52"
            height={1254}
            sizes="208px"
            src="/brand/mundo-ar-logo-white.png"
            width={1254}
          />
        </div>

        <div className="relative z-10 my-auto max-w-[43rem] py-8">
          <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.14em] text-[var(--brand-accent)]">
            <span aria-hidden="true" className="h-0.5 w-8 bg-current" />
            Controle operacional
          </div>

          <h1 className="font-display mt-7 max-w-[40rem] text-[clamp(2.8rem,3.65vw,4.35rem)] font-bold leading-[1.08] tracking-tight">
            Gestão que mantém
            <br />
            o seu <span className="text-[var(--brand-accent)]">fluxo em movimento.</span>
          </h1>
          <p className="mt-6 max-w-[38rem] text-lg leading-8 text-slate-300">
            Acompanhe atendimentos, diagnósticos e ordens de serviço com
            segurança e eficiência em cada etapa.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-4">
            {highlights.map((highlight) => {
              const Icon = highlight.icon;
              return (
                <article
                  className="min-h-44 rounded-xl border border-white/10 bg-white/[0.055] p-5 backdrop-blur-sm"
                  key={highlight.title}
                >
                  <div className="grid size-10 place-items-center rounded-lg border border-[var(--brand-accent)]/15 bg-[var(--action)]/30 text-[var(--brand-accent)] shadow-[0_0_22px_rgba(102,210,201,0.12)]">
                    <Icon aria-hidden="true" className="size-5" />
                  </div>
                  <h2 className="mt-4 text-base font-bold text-white">{highlight.title}</h2>
                  <p className="mt-1.5 text-sm leading-6 text-slate-300">{highlight.description}</p>
                </article>
              );
            })}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3 border-t border-white/10 pt-5 text-sm text-slate-300">
          <ShieldCheck aria-hidden="true" className="size-5 text-[var(--brand-accent)]" />
          <span>Sistema de Gestão</span>
          <span aria-hidden="true">•</span>
          <span>Ambiente Interno</span>
        </div>
      </aside>

      <section className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-8 sm:px-8 lg:px-12">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(102,210,201,0.07),transparent_28%),radial-gradient(circle_at_90%_80%,rgba(16,45,63,0.055),transparent_34%)]" />
        <div className="relative w-full max-w-[39.5rem] rounded-2xl border border-[var(--border)] bg-white px-5 py-8 shadow-[0_24px_65px_rgba(16,45,63,0.09)] sm:px-10 sm:py-10 xl:px-14 xl:py-11">
          {children}

          <footer className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border)] pt-5 text-xs font-medium text-[var(--ink-muted)]">
            <div className="flex items-center gap-2">
              <ShieldCheck aria-hidden="true" className="size-4 text-[var(--action)]" />
              <span>Sistema de Gestão</span>
              <span aria-hidden="true">•</span>
              <span>Ambiente Interno</span>
            </div>
            <span className="tabular-nums">v0.1.0</span>
          </footer>
        </div>
      </section>
    </main>
  );
}
