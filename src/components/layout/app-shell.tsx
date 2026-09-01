import {
  BarChart3,
  CarFront,
  ClipboardList,
  Gauge,
  LogOut,
  Menu,
  Settings,
  Users,
  Wrench,
} from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const navigation = [
  { label: "Visão geral", icon: Gauge, active: true },
  { label: "Ordens de serviço", icon: ClipboardList },
  { label: "Clientes", icon: Users },
  { label: "Veículos", icon: CarFront },
  { label: "Serviços", icon: Wrench },
  { label: "Relatórios", icon: BarChart3 },
];

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div
        aria-hidden="true"
        className="grid size-11 place-items-center rounded-xl border border-white/15 bg-white/8 text-[var(--brand-accent)]"
      >
        <Wrench className="size-5" strokeWidth={2.2} />
      </div>
      <div>
        <p className="font-display text-xl font-bold uppercase leading-none tracking-[0.02em] text-white">
          Mundo Ar
        </p>
        <p className="mt-1 text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-[var(--brand-accent)]">
          Climatização automotiva
        </p>
      </div>
    </div>
  );
}

function Navigation({ compact = false }: { compact?: boolean }) {
  return (
    <nav aria-label="Navegação principal">
      <ul className={cn("grid gap-1.5", compact && "grid-cols-2 py-3")}>
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.label}>
              <a
                aria-current={item.active ? "page" : undefined}
                className={cn(
                  "group relative flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]",
                  item.active
                    ? "service-tag bg-white/11 text-white"
                    : "text-slate-300 hover:bg-white/7 hover:text-white",
                  compact && "text-xs",
                )}
                href="#"
              >
                <Icon aria-hidden="true" className="size-[1.1rem] shrink-0" />
                <span>{item.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink)]">
      <a
        className="fixed left-4 top-4 z-50 -translate-y-24 rounded-lg bg-white px-4 py-3 font-semibold text-[var(--ink)] shadow-lg focus:translate-y-0"
        href="#conteudo-principal"
      >
        Ir para o conteúdo
      </a>

      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-[var(--brand)] px-4 py-5 lg:flex">
        <div className="border-b border-white/12 px-2 pb-5">
          <Brand />
        </div>
        <div className="mt-6 flex-1">
          <p className="mb-2 px-3 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-slate-400">
            Operação da oficina
          </p>
          <Navigation />
        </div>
        <div className="border-t border-white/12 pt-3">
          <a
            className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-slate-300 transition-colors hover:bg-white/7 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]"
            href="#"
          >
            <Settings aria-hidden="true" className="size-[1.1rem]" />
            Configurações
          </a>
          <a
            className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-slate-300 transition-colors hover:bg-white/7 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]"
            href="#"
          >
            <LogOut aria-hidden="true" className="size-[1.1rem]" />
            Sair
          </a>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-white/94 backdrop-blur">
          <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="lg:hidden">
              <details className="relative">
                <summary className="flex size-11 cursor-pointer list-none items-center justify-center rounded-lg border border-[var(--border)] text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]">
                  <Menu aria-hidden="true" className="size-5" />
                  <span className="sr-only">Abrir menu principal</span>
                </summary>
                <div className="absolute left-0 top-13 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-[var(--border)] bg-[var(--brand)] p-4 shadow-xl">
                  <Brand />
                  <div className="mt-4 border-t border-white/12 pt-2">
                    <Navigation compact />
                  </div>
                </div>
              </details>
            </div>

            <div className="hidden lg:block">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-faint)]">
                Segunda-feira, 31 de agosto
              </p>
              <p className="mt-0.5 text-sm font-semibold text-[var(--ink)]">
                Operação em andamento
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-[var(--ink)]">Administrador</p>
                <p className="text-xs text-[var(--ink-muted)]">Mundo Ar</p>
              </div>
              <div
                aria-hidden="true"
                className="grid size-10 place-items-center rounded-full bg-[var(--brand-soft)] text-sm font-bold text-[var(--brand)]"
              >
                AD
              </div>
            </div>
          </div>
        </header>

        <main id="conteudo-principal">{children}</main>
      </div>
    </div>
  );
}
