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

import { BrandLogo } from "@/components/brand/brand-logo";

import { logoutAction } from "@/features/auth/actions";
import { can } from "@/features/auth/permissions";
import type { CurrentUser } from "@/features/auth/types";
import { cn } from "@/lib/utils";

const navigation = [
  { label: "Visão geral", icon: Gauge, href: "/" },
  { label: "Ordens de serviço", icon: ClipboardList },
  { label: "Clientes", icon: Users },
  { label: "Veículos", icon: CarFront },
  { label: "Serviços", icon: Wrench },
  { label: "Relatórios", icon: BarChart3 },
] as const;

const roleLabel = {
  administrador: "Administrador",
  atendente: "Atendente",
  tecnico: "Técnico",
} as const;

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "MA";
}

function Brand() {
  return (
    <div className="flex justify-center">
      <BrandLogo className="w-28 lg:w-32" />
    </div>
  );
}

function Navigation({
  compact = false,
  currentPath,
  user,
}: {
  compact?: boolean;
  currentPath: string;
  user: CurrentUser;
}) {
  const items = can(user.role, "usuarios:gerenciar")
    ? [...navigation, { label: "Usuários", icon: Users, href: "/usuarios" } as const]
    : navigation;

  return (
    <nav aria-label="Navegação principal">
      <ul className={cn("grid gap-1.5", compact && "grid-cols-2 py-3")}>
        {items.map((item) => {
          const Icon = item.icon;
          const href = "href" in item ? item.href : undefined;
          const active = href === currentPath;
          const classes = cn(
            "group relative flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]",
            active
              ? "service-tag bg-white/11 text-white"
              : href
                ? "text-slate-300 hover:bg-white/7 hover:text-white"
                : "cursor-not-allowed text-slate-500",
            compact && "text-xs",
          );

          return (
            <li key={item.label}>
              {href ? (
                <a aria-current={active ? "page" : undefined} className={classes} href={href}>
                  <Icon aria-hidden="true" className="size-[1.1rem] shrink-0" />
                  <span>{item.label}</span>
                </a>
              ) : (
                <span aria-disabled="true" className={classes} title="Módulo planejado para a próxima etapa">
                  <Icon aria-hidden="true" className="size-[1.1rem] shrink-0" />
                  <span>{item.label}</span>
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function AppShell({
  children,
  currentPath,
  user,
}: {
  children: ReactNode;
  currentPath: string;
  user: CurrentUser;
}) {
  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink)]">
      <a
        className="fixed left-4 top-4 z-50 -translate-y-24 rounded-lg bg-white px-4 py-3 font-semibold text-[var(--ink)] shadow-lg focus:translate-y-0"
        href="#conteudo-principal"
      >
        Ir para o conteúdo
      </a>

      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-[var(--brand)] px-4 py-5 lg:flex">
        <div className="border-b border-white/12 px-2 pb-4"><Brand /></div>
        <div className="mt-5 flex-1">
          <p className="mb-2 px-3 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-slate-400">
            Operação da oficina
          </p>
          <Navigation currentPath={currentPath} user={user} />
        </div>
        <div className="border-t border-white/12 pt-3">
          <span aria-disabled="true" className="flex min-h-11 cursor-not-allowed items-center gap-3 rounded-lg px-3 text-sm font-semibold text-slate-500">
            <Settings aria-hidden="true" className="size-[1.1rem]" />
            Configurações
          </span>
          <form action={logoutAction}>
            <button className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold text-slate-300 transition-colors hover:bg-white/7 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]" type="submit">
              <LogOut aria-hidden="true" className="size-[1.1rem]" />
              Sair
            </button>
          </form>
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
                    <Navigation compact currentPath={currentPath} user={user} />
                  </div>
                  <form action={logoutAction} className="border-t border-white/12 pt-2">
                    <button className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold text-slate-300 hover:bg-white/7 hover:text-white" type="submit">
                      <LogOut aria-hidden="true" className="size-[1.1rem]" /> Sair
                    </button>
                  </form>
                </div>
              </details>
            </div>

            <div className="hidden lg:block">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-faint)]">Ambiente de desenvolvimento</p>
              <p className="mt-0.5 text-sm font-semibold text-[var(--ink)]">Operação em andamento</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden max-w-56 text-right sm:block">
                <p className="truncate text-sm font-semibold text-[var(--ink)]">{user.name}</p>
                <p className="text-xs text-[var(--ink-muted)]">{roleLabel[user.role]}</p>
              </div>
              <div aria-hidden="true" className="grid size-10 place-items-center rounded-full bg-[var(--brand-soft)] text-sm font-bold text-[var(--brand)]">
                {initials(user.name)}
              </div>
            </div>
          </div>
        </header>

        <main id="conteudo-principal">{children}</main>
      </div>
    </div>
  );
}
