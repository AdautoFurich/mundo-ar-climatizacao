import { BarChart3, History, Wrench } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

const reports = [
  { href: "/relatorios/ordens-periodo", label: "Ordens por período", icon: BarChart3 },
  {
    href: "/relatorios/servicos-mais-realizados",
    label: "Serviços mais realizados",
    icon: Wrench,
  },
  {
    href: "/relatorios/historico-veiculos",
    label: "Histórico dos veículos",
    icon: History,
  },
] as const;

export function ReportsNavigation({ currentPath }: { currentPath: string }) {
  return (
    <nav
      aria-label="Relatórios disponíveis"
      className="report-no-print mb-3 flex gap-2 overflow-x-auto rounded-xl border bg-white p-2 shadow-[0_2px_8px_rgba(16,45,63,0.04)]"
    >
      {reports.map((report) => {
        const Icon = report.icon;
        const active = currentPath === report.href;
        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--focus)]",
              active
                ? "bg-[var(--brand)] text-white"
                : "text-[var(--ink-muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)]",
            )}
            href={report.href}
            key={report.href}
          >
            <Icon aria-hidden="true" className="size-4" />
            {report.label}
          </Link>
        );
      })}
    </nav>
  );
}
