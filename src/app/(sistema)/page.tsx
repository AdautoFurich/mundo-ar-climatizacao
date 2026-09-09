import { ClipboardPlus, TriangleAlert, UserPlus } from "lucide-react";
import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { DashboardOverview } from "@/features/dashboard/components/dashboard-overview";
import { getDashboardData } from "@/features/dashboard/queries";
import { requireUser } from "@/lib/auth/guards";

export default async function Home() {
  const user = await requireUser();
  const [dashboardResult] = await Promise.allSettled([getDashboardData()]);
  const data =
    dashboardResult.status === "fulfilled" ? dashboardResult.value : null;

  return (
    <AppShell
      currentPath="/"
      description="Acompanhe a operação da oficina com dados atualizados"
      title="Visão geral"
      user={user}
    >
      <div className="min-h-[calc(100dvh-5.35rem)] px-3 py-3 sm:px-5 lg:px-6">
        <div className="mx-auto max-w-[100rem]">
          <div className="mb-3 flex flex-col justify-end gap-2 sm:flex-row">
            <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border bg-white px-4 text-sm font-semibold text-[var(--brand)] hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]" href="/clientes/novo"><UserPlus aria-hidden="true" className="size-4" /> Novo cliente</Link>
            <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--action)] px-4 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(15,118,110,0.18)] hover:bg-[var(--action-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2" href="/ordens-servico/nova"><ClipboardPlus aria-hidden="true" className="size-4" /> Nova ordem de serviço</Link>
          </div>

          {data ? (
            <DashboardOverview data={data} />
          ) : (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-amber-950" role="alert">
              <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
              <div><p className="font-semibold">Não foi possível carregar os dados da oficina.</p><p className="text-sm">Atualize a página para tentar novamente. Nenhum valor demonstrativo será exibido.</p></div>
            </div>
          )}

          <footer className="mt-5 flex flex-col justify-between gap-1 px-1 pb-1 text-xs text-[var(--ink-muted)] sm:flex-row">
            <span>Mundo Ar Climatização © 2026 • Sistema de Gestão da Oficina</span><span className="tabular-nums">Versão 0.1.0</span>
          </footer>
        </div>
      </div>
    </AppShell>
  );
}
