import {
  BarChart3,
  Bell,
  CalendarDays,
  CarFront,
  ChevronDown,
  ClipboardList,
  Gauge,
  LogOut,
  Menu,
  Search,
  Settings,
  SlidersHorizontal,
  Stethoscope,
  Users,
  Wrench,
} from "lucide-react";
import type { ReactNode } from "react";
import Link from "next/link";

import { BrandLogo } from "@/components/brand/brand-logo";
import { logoutAction } from "@/features/auth/actions";
import { can } from "@/features/auth/permissions";
import type { CurrentUser } from "@/features/auth/types";
import { cn } from "@/lib/utils";

const operationNavigation = [
  { label: "Visão geral", icon: Gauge, href: "/" },
  { label: "Ordens de serviço", icon: ClipboardList },
  { label: "Diagnósticos", icon: Stethoscope },
  { label: "Clientes", icon: Users, href: "/clientes" },
  { label: "Veículos", icon: CarFront, href: "/veiculos" },
  { label: "Serviços", icon: Wrench },
] as const;

const managementNavigation = [
  { label: "Relatórios", icon: BarChart3 },
  { label: "Agenda", icon: CalendarDays },
] as const;

const roleLabel = {
  administrador: "Administrador",
  atendente: "Atendente",
} as const;

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "MA"
  );
}

function NavigationGroup({
  currentPath,
  items,
  label,
}: {
  currentPath: string;
  items: ReadonlyArray<{
    label: string;
    icon: typeof Gauge;
    href?: string;
  }>;
  label: string;
}) {
  return (
    <div className="sidebar-navigation-group">
      <p className="sidebar-navigation-heading mb-2 px-3 text-2xs font-bold uppercase tracking-[0.18em] text-teal-300">
        {label}
      </p>
      <nav aria-label={label}>
        <ul className="sidebar-navigation-list grid gap-1">
          {items.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/"
                ? currentPath === "/"
                : Boolean(item.href && currentPath.startsWith(item.href));
            const classes = cn(
              "sidebar-navigation-link relative flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300",
              active
                ? "border-l-2 border-teal-300 bg-teal-500/25 text-white"
                : item.href
                  ? "text-slate-200 hover:bg-white/8 hover:text-white"
                  : "cursor-not-allowed text-slate-300/75",
            );

            return (
              <li key={item.label}>
                {item.href ? (
                  <Link
                    aria-current={active ? "page" : undefined}
                    className={classes}
                    href={item.href}
                  >
                    <Icon aria-hidden="true" className="size-[1.1rem] shrink-0" />
                    {item.label}
                  </Link>
                ) : (
                  <span
                    aria-disabled="true"
                    className={classes}
                    title="Módulo planejado para uma próxima etapa"
                  >
                    <Icon aria-hidden="true" className="size-[1.1rem] shrink-0" />
                    {item.label}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

function SidebarContent({
  currentPath,
  user,
}: {
  currentPath: string;
  user: CurrentUser;
}) {
  const configurationItems = can(user.role, "usuarios:gerenciar")
    ? [
        { label: "Usuários", icon: Users, href: "/usuarios" },
        { label: "Configurações", icon: Settings },
      ]
    : [{ label: "Configurações", icon: Settings }];

  return (
    <>
      <div className="sidebar-brand flex h-[8.5rem] shrink-0 items-center justify-center border-b border-white/10">
        <BrandLogo className="sidebar-brand-logo w-32" />
      </div>

      <div className="sidebar-navigation flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-5 lg:overflow-visible">
        <NavigationGroup
          currentPath={currentPath}
          items={operationNavigation}
          label="Operação da oficina"
        />
        <div className="sidebar-navigation-section border-t border-white/8 pt-5">
          <NavigationGroup
            currentPath={currentPath}
            items={managementNavigation}
            label="Gestão"
          />
        </div>
        <div className="sidebar-navigation-section border-t border-white/8 pt-5">
          <NavigationGroup
            currentPath={currentPath}
            items={configurationItems}
            label="Configurações"
          />
        </div>
      </div>

      <div className="sidebar-footer shrink-0 space-y-2 px-3 pb-5">
        <div className="sidebar-environment rounded-lg border border-white/20 bg-white/[0.035] p-3">
          <div className="flex items-start gap-2.5">
            <div
              aria-hidden="true"
              className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-teal-400/10 text-teal-300"
            >
              <Gauge className="size-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">Ambiente interno</p>
              <p className="sidebar-environment-copy mt-0.5 text-xs leading-4 text-slate-300">
                Acesso restrito e monitorado
              </p>
            </div>
          </div>
        </div>
        <form action={logoutAction}>
          <button
            className="sidebar-logout flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-200 transition-colors hover:bg-white/8 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
            type="submit"
          >
            <LogOut aria-hidden="true" className="size-[1.1rem]" />
            Sair
          </button>
        </form>
      </div>
    </>
  );
}

function DashboardTools({ user }: { user: CurrentUser }) {
  return (
    <div className="flex min-w-0 flex-1 items-center justify-end gap-2.5">
      <label className="relative hidden min-w-0 max-w-[21rem] flex-1 xl:block">
        <span className="sr-only">Buscar no sistema</span>
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--ink-faint)]"
        />
        <input
          className="h-10 w-full rounded-lg border bg-white pl-10 pr-14 text-sm outline-none placeholder:text-slate-500 focus:border-[var(--focus)] focus:ring-2 focus:ring-[var(--focus)]/20"
          placeholder="Buscar por ordem, cliente, veículo..."
          readOnly
          type="search"
        />
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border bg-[var(--surface-subtle)] px-1.5 py-0.5 text-2xs text-[var(--ink-faint)]">
          Ctrl + K
        </kbd>
      </label>

      <button
        aria-disabled="true"
        className="hidden h-10 items-center gap-2 rounded-lg border bg-white px-3 text-sm font-semibold text-[var(--brand)] lg:flex"
        title="Filtro demonstrativo"
        type="button"
      >
        <CalendarDays aria-hidden="true" className="size-4" />
        Hoje
        <ChevronDown aria-hidden="true" className="size-3.5" />
      </button>
      <button
        aria-disabled="true"
        className="hidden h-10 items-center gap-2 rounded-lg border bg-white px-3 text-sm font-semibold text-[var(--brand)] 2xl:flex"
        title="Filtro demonstrativo"
        type="button"
      >
        <SlidersHorizontal aria-hidden="true" className="size-4" />
        Todos os status
        <ChevronDown aria-hidden="true" className="size-3.5" />
      </button>

      <button
        aria-label="Notificações: 3 não lidas"
        className="relative grid size-10 shrink-0 place-items-center rounded-lg text-[var(--brand)] hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
        type="button"
      >
        <Bell aria-hidden="true" className="size-[1.15rem]" />
        <span className="absolute right-0.5 top-0.5 grid size-4 place-items-center rounded-full bg-[var(--action)] text-2xs font-bold text-white">
          3
        </span>
      </button>

      <div className="hidden h-10 items-center gap-2.5 border-l pl-3 sm:flex">
        <div
          aria-hidden="true"
          className="grid size-9 shrink-0 place-items-center rounded-full bg-teal-50 text-xs font-bold text-[var(--action)]"
        >
          {initials(user.name)}
        </div>
        <div className="hidden min-w-0 max-w-32 xl:block">
          <p className="truncate text-sm font-semibold leading-4 text-[var(--brand)]">
            {user.name}
          </p>
          <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
            {roleLabel[user.role]}
          </p>
        </div>
        <ChevronDown aria-hidden="true" className="hidden size-3.5 text-[var(--ink-faint)] xl:block" />
      </div>
    </div>
  );
}

export function AppShell({
  children,
  currentPath,
  description,
  title,
  user,
}: {
  children: ReactNode;
  currentPath: string;
  /** Subtítulo da rota, exibido sob o h1 na barra superior. */
  description: string;
  /** Único h1 da página. Cada rota informa o seu. */
  title: string;
  user: CurrentUser;
}) {
  return (
    <div className="min-h-dvh bg-[var(--canvas)] text-[var(--ink)]">
      <a
        className="fixed left-4 top-4 z-[60] -translate-y-24 rounded-lg bg-white px-4 py-3 font-semibold text-[var(--ink)] shadow-lg focus:translate-y-0"
        href="#conteudo-principal"
      >
        Ir para o conteúdo
      </a>

      <aside
        className="sidebar-desktop fixed inset-y-0 left-0 z-40 hidden w-56 flex-col overflow-hidden bg-[var(--brand-strong)] lg:flex"
        data-testid="desktop-sidebar"
      >
        <SidebarContent currentPath={currentPath} user={user} />
      </aside>

      <div className="lg:pl-56">
        <header className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur">
          <div className="flex min-h-[5.35rem] items-center gap-4 px-4 sm:px-6 lg:px-7">
            <details className="relative lg:hidden">
              <summary className="flex size-10 cursor-pointer list-none items-center justify-center rounded-lg border text-[var(--brand)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]">
                <Menu aria-hidden="true" className="size-5" />
                <span className="sr-only">Abrir menu principal</span>
              </summary>
              <div className="absolute -left-4 top-12 flex max-h-[calc(100dvh-6rem)] w-[min(22rem,calc(100vw-1rem))] flex-col overflow-y-auto rounded-r-xl bg-[var(--brand-strong)] shadow-2xl">
                <SidebarContent currentPath={currentPath} user={user} />
              </div>
            </details>

            <div className="min-w-0 shrink-0">
              <h1 className="font-display truncate text-xl font-bold tracking-tight text-[var(--brand)]">
                {title}
              </h1>
              <p className="hidden text-xs text-[var(--ink-muted)] md:block">
                {description}
              </p>
            </div>

            {currentPath === "/" ? (
              <DashboardTools user={user} />
            ) : (
              <div className="ml-auto flex items-center gap-3">
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-semibold text-[var(--ink)]">{user.name}</p>
                  <p className="text-xs text-[var(--ink-muted)]">{roleLabel[user.role]}</p>
                </div>
                <div
                  aria-hidden="true"
                  className="grid size-10 place-items-center rounded-full bg-teal-50 text-sm font-bold text-[var(--action)]"
                >
                  {initials(user.name)}
                </div>
              </div>
            )}
          </div>
        </header>

        <main id="conteudo-principal">{children}</main>
      </div>
    </div>
  );
}
