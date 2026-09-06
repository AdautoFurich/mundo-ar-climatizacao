import { Wrench } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { ServiceForm } from "@/features/servicos/components/service-form";
import { requirePermission } from "@/lib/auth/guards";

export default async function NewServicePage() {
  const user = await requirePermission("servicos:gerenciar");

  return (
    <AppShell
      currentPath="/servicos/novo"
      description="Inclua um trabalho no catálogo da oficina"
      title="Novo serviço"
      user={user}
    >
      <div className="min-h-[calc(100dvh-5.35rem)] px-3 py-3 sm:px-5 lg:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-3 flex items-center gap-3 rounded-xl border border-teal-100 bg-teal-50/70 px-4 py-3 text-sm text-[var(--brand)]">
            <Wrench
              aria-hidden="true"
              className="size-5 shrink-0 text-[var(--action)]"
            />
            <p>
              Os campos marcados com{" "}
              <span className="font-bold text-[var(--danger)]">*</span> são
              obrigatórios. O valor-base pode ficar em branco.
            </p>
          </div>
          <ServiceForm />
        </div>
      </div>
    </AppShell>
  );
}
