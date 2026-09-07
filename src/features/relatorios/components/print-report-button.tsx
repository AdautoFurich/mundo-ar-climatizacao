"use client";

import { Printer } from "lucide-react";

export function PrintReportButton() {
  return (
    <button
      className="report-no-print inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border bg-white px-4 text-sm font-semibold text-[var(--brand)] hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
      onClick={() => window.print()}
      type="button"
    >
      <Printer aria-hidden="true" className="size-4" />
      Imprimir relatório
    </button>
  );
}
