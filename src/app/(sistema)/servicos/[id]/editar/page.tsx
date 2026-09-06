import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { ServiceForm } from "@/features/servicos/components/service-form";
import { formatBasePriceInput } from "@/features/servicos/formatters";
import { getServiceById } from "@/features/servicos/queries";
import { requirePermission } from "@/lib/auth/guards";

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("servicos:gerenciar");
  const { id } = await params;
  const service = await getServiceById(id);
  if (!service) notFound();

  return (
    <AppShell
      currentPath={`/servicos/${id}/editar`}
      description={`Atualize os dados de ${service.name}`}
      title="Editar serviço"
      user={user}
    >
      <div className="min-h-[calc(100dvh-5.35rem)] px-3 py-3 sm:px-5 lg:px-6">
        <div className="mx-auto max-w-5xl">
          <ServiceForm
            defaultValues={{
              name: service.name,
              category: service.category,
              description: service.description ?? "",
              basePrice: formatBasePriceInput(service.basePrice),
            }}
            serviceId={service.id}
          />
        </div>
      </div>
    </AppShell>
  );
}
