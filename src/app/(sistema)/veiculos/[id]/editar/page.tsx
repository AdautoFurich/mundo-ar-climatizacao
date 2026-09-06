import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { VehicleForm } from "@/features/veiculos/components/vehicle-form";
import { formatPlate } from "@/features/veiculos/formatters";
import {
  getVehicleById,
  listActiveClientOptions,
} from "@/features/veiculos/queries";
import { FUEL_VALUES } from "@/features/veiculos/schemas";
import { requirePermission } from "@/lib/auth/guards";

export default async function EditVehiclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("veiculos:gerenciar");
  const { id } = await params;
  const vehicle = await getVehicleById(id);
  if (!vehicle) notFound();
  const clients = await listActiveClientOptions(vehicle.ownerId);
  const fuel = FUEL_VALUES.find((value) => value === vehicle.fuel) ?? "";

  return (
    <AppShell
      currentPath={`/veiculos/${id}/editar`}
      description={`Atualize os dados de ${formatPlate(vehicle.plate)}`}
      title="Editar veículo"
      user={user}
    >
      <div className="min-h-[calc(100dvh-5.35rem)] px-3 py-3 sm:px-5 lg:px-6">
        <div className="mx-auto max-w-5xl">
          <VehicleForm
            clients={clients}
            defaultValues={{
              ownerId: vehicle.ownerId,
              plate: formatPlate(vehicle.plate),
              brand: vehicle.brand,
              model: vehicle.model,
              manufactureYear: String(vehicle.manufactureYear),
              modelYear: String(vehicle.modelYear),
              color: vehicle.color ?? "",
              fuel,
              notes: vehicle.notes ?? "",
            }}
            vehicleId={vehicle.id}
          />
        </div>
      </div>
    </AppShell>
  );
}
