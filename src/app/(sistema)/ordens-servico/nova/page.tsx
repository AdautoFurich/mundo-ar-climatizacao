import { ClipboardPlus, TriangleAlert } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { IntakeForm } from "@/features/ordens-servico/components/intake-form";
import {
  listActiveOrderClients,
  listActiveOrderResponsibles,
  listActiveOrderVehicles,
} from "@/features/ordens-servico/queries";
import { orderIdSchema } from "@/features/ordens-servico/schemas";
import { requirePermission } from "@/lib/auth/guards";

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function officeDateTimeInput(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}T${value.hour}:${value.minute}`;
}

export default async function NewServiceOrderPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePermission("ordens:atender");
  const params = await searchParams;
  const [clientsResult, responsiblesResult] = await Promise.allSettled([
    listActiveOrderClients(),
    listActiveOrderResponsibles(),
  ]);
  const clients = clientsResult.status === "fulfilled" ? clientsResult.value : [];
  const responsibles = responsiblesResult.status === "fulfilled" ? responsiblesResult.value : [];
  const requestedClientId = firstValue(params.cliente);
  const initialClientId =
    orderIdSchema.safeParse(requestedClientId).success &&
    clients.some((client) => client.id === requestedClientId)
      ? requestedClientId
      : "";
  const initialVehicles = initialClientId
    ? await listActiveOrderVehicles(initialClientId).catch(() => [])
    : [];
  const loadError =
    clientsResult.status === "rejected" || responsiblesResult.status === "rejected";

  return (
    <AppShell
      currentPath="/ordens-servico/nova"
      description="Registre a entrada e as condições iniciais do veículo"
      title="Nova ordem de serviço"
      user={user}
    >
      <div className="min-h-[calc(100dvh-5.35rem)] px-3 py-3 sm:px-5 lg:px-6">
        <div className="mx-auto max-w-[88rem]">
          <div className="mb-3 flex items-center gap-3 rounded-xl border border-teal-100 bg-teal-50/70 px-4 py-3 text-sm text-[var(--brand)]">
            <ClipboardPlus aria-hidden="true" className="size-5 shrink-0 text-[var(--action)]" />
            <p>Os campos marcados com <span className="font-bold text-[var(--danger)]">*</span> são obrigatórios.</p>
          </div>
          {loadError ? (
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-amber-950" role="alert">
              <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
              <div><p className="font-semibold">Não foi possível preparar o formulário.</p><p className="text-sm">Atualize a página para carregar clientes e responsáveis.</p></div>
            </div>
          ) : (
            <IntakeForm
              clients={clients}
              currentUserId={user.id}
              defaultEntryAt={officeDateTimeInput()}
              initialClientId={initialClientId}
              initialVehicles={initialVehicles}
              responsibles={responsibles}
            />
          )}
        </div>
      </div>
    </AppShell>
  );
}
