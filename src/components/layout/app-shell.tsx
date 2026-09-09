import {
  BarChart3,
  CarFront,
  ChevronDown,
  ClipboardList,
  Gauge,
  LogOut,
  Menu,
  Search,
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
  { label: "Ordens de serviço", icon: ClipboardList, href: "/ordens-servico" },
] as const;

const registrationNavigation = [
  { label: "Clientes", icon: Users, href: "/clientes" },
  { label: "Veículos", icon: CarFront, href: "/veiculos" },
  { label: "Serviços", icon: Wrench, href: "/servicos" },
] as const;

const managementNavigation = [
  {
    label: "Relatórios",
    icon: BarChart3,
    href: "/relatorios/ordens-periodo",
    activePath: "/relatorios",
  },
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

type NavigationItem = {
  label: string;
  icon: typeof Gauge;
  href: string;
  activePath?: string;
};

function isCurrentPath(currentPath: string, href: string) {
  return href === "/"
    ? currentPath === href
    : currentPath === href || currentPath.startsWith(`${href}/`);
}

function NavigationLink({
  currentPath,
  item,
}: {
  currentPath: string;
  item: NavigationItem;
}) {
  const Icon = item.icon;
  const active = isCurrentPath(currentPath, item.activePath ?? item.href);

  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={cn(
        "sidebar-navigation-link relative flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300",
        active
          ? "border-l-2 border-teal-300 bg-teal-500/25 font-semibold text-white"
          : "text-slate-200 hover:bg-white/8 hover:text-white",
      )}
      href={item.href}
    >
      <Icon aria-hidden="true" className="size-[1.1rem] shrink-0" />
      <span>{item.label}</span>
    </Link>
  );
}

function NavigationGroup({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <div className="sidebar-navigation-group">
      <p className="sidebar-navigation-heading mb-2 px-3 text-2xs font-bold uppercase tracking-[0.18em] text-teal-300">
        {label}
      </p>
      <nav aria-label={label}>
        <ul className="sidebar-navigation-list grid gap-1">
          {children}
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
  return (
    <>
      <div className="sidebar-brand flex h-[8.5rem] shrink-0 items-center justify-center border-b border-white/10">
        <BrandLogo className="sidebar-brand-logo w-32" />
      </div>

      <div className="sidebar-navigation flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-5 lg:overflow-visible">
        <NavigationGroup label="Oficina">
          {operationNavigation.map((item) => (
            <li key={item.href}>
              <NavigationLink currentPath={currentPath} item={item} />
            </li>
          ))}
        </NavigationGroup>
        <NavigationGroup label="Cadastros">
          {registrationNavigation.map((item) => (
            <li key={item.href}>
              <NavigationLink currentPath={currentPath} item={item} />
            </li>
          ))}
        </NavigationGroup>
        <NavigationGroup label="Gestão">
          {managementNavigation.map((item) => (
            <li key={item.href}>
              <NavigationLink currentPath={currentPath} item={item} />
            </li>
          ))}
        </NavigationGroup>
        {can(user.role, "usuarios:gerenciar") ? (
          <NavigationGroup label="Administração">
            <li>
              <NavigationLink
                currentPath={currentPath}
                item={{ label: "Usuários", icon: Users, href: "/usuarios" }}
              />
            </li>
          </NavigationGroup>
        ) : null}
      </div>

      <div className="sidebar-footer shrink-0 space-y-2 border-t border-white/10 px-3 pb-5 pt-3">
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
      <form action="/ordens-servico" className="relative hidden min-w-0 max-w-[21rem] flex-1 xl:block" method="get">
        <label className="sr-only" htmlFor="dashboard-order-search">Buscar ordens</label>
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--ink-faint)]"
        />
        <input
          className="h-10 w-full rounded-lg border bg-white pl-10 pr-20 text-sm outline-none placeholder:text-slate-500 focus:border-[var(--focus)] focus:ring-2 focus:ring-[var(--focus)]/20"
          id="dashboard-order-search"
          name="busca"
          placeholder="Buscar por ordem, cliente, veículo..."
          type="search"
        />
        <button className="absolute right-1.5 top-1/2 min-h-8 -translate-y-1/2 rounded-md bg-[var(--action)] px-3 text-xs font-semibold text-white hover:bg-[var(--action-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]" type="submit">Buscar</button>
      </form>

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

      <div className="app-layout-offset lg:pl-56">
        <header className="app-header sticky top-0 z-30 border-b bg-white/95 backdrop-blur">
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
