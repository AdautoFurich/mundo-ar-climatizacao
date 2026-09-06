import { CarFront } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { VehicleForm } from "@/features/veiculos/components/vehicle-form";
import { listActiveClientOptions } from "@/features/veiculos/queries";
import { vehicleIdSchema } from "@/features/veiculos/schemas";
import { requirePermission } from "@/lib/auth/guards";

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function NewVehiclePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePermission("veiculos:gerenciar");
  const [clients, params] = await Promise.all([
    listActiveClientOptions(),
    searchParams,
  ]);
  const requestedOwnerId = firstValue(params.cliente);
  const ownerId =
    vehicleIdSchema.safeParse(requestedOwnerId).success &&
    clients.some((client) => client.id === requestedOwnerId)
      ? requestedOwnerId
      : "";

  return (
    <AppShell
      currentPath="/veiculos/novo"
      description="Vincule um carro ou utilitário ao proprietário atual"
      title="Novo veículo"
      user={user}
    >
      <div className="min-h-[calc(100dvh-5.35rem)] px-3 py-3 sm:px-5 lg:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-3 flex items-center gap-3 rounded-xl border border-teal-100 bg-teal-50/70 px-4 py-3 text-sm text-[var(--brand)]">
            <CarFront
              aria-hidden="true"
              className="size-5 shrink-0 text-[var(--action)]"
            />
            <p>
              Os campos marcados com{" "}
              <span className="font-bold text-[var(--danger)]">*</span> são
              obrigatórios.
            </p>
          </div>
          <VehicleForm
            clients={clients}
            defaultValues={{
              ownerId,
              plate: "",
              brand: "",
              model: "",
              manufactureYear: "",
              modelYear: "",
              color: "",
              fuel: "",
              notes: "",
            }}
          />
        </div>
      </div>
    </AppShell>
  );
}
