import { UserPlus } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { ClientForm } from "@/features/clientes/components/client-form";
import { requirePermission } from "@/lib/auth/guards";

export default async function NewClientPage() {
  const user = await requirePermission("clientes:gerenciar");

  return (
    <AppShell
      currentPath="/clientes/novo"
      description="Registre uma pessoa física para os atendimentos"
      title="Novo cliente"
      user={user}
    >
      <div className="min-h-[calc(100dvh-5.35rem)] px-3 py-3 sm:px-5 lg:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-3 flex items-center gap-3 rounded-xl border border-teal-100 bg-teal-50/70 px-4 py-3 text-sm text-[var(--brand)]">
            <UserPlus aria-hidden="true" className="size-5 shrink-0 text-[var(--action)]" />
            <p>
              Os campos marcados com <span className="font-bold text-[var(--danger)]">*</span> são obrigatórios.
            </p>
          </div>
          <ClientForm />
        </div>
      </div>
    </AppShell>
  );
}
