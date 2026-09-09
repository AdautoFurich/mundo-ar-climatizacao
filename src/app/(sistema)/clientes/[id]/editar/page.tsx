import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { ClientForm } from "@/features/clientes/components/client-form";
import { formatCpf, formatPhone, formatZipCode } from "@/features/clientes/formatters";
import { getClientById } from "@/features/clientes/queries";
import { requirePermission } from "@/lib/auth/guards";

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("clientes:gerenciar");
  const { id } = await params;
  const client = await getClientById(id);
  if (!client) notFound();

  return (
    <AppShell
      currentPath={`/clientes/${id}/editar`}
      description={`Atualize os dados de ${client.name}`}
      title="Editar cliente"
      user={user}
    >
      <div className="min-h-[calc(100dvh-5.35rem)] px-3 py-3 sm:px-5 lg:px-6">
        <div className="mx-auto max-w-5xl">
          <ClientForm
            clientId={client.id}
            defaultValues={{
              name: client.name,
              cpf: formatCpf(client.cpf),
              primaryPhone: formatPhone(client.primaryPhone),
              alternatePhone: client.alternatePhone
                ? formatPhone(client.alternatePhone)
                : "",
              email: client.email ?? "",
              zipCode: formatZipCode(client.zipCode),
              street: client.street,
              number: client.number,
              complement: client.complement ?? "",
              neighborhood: client.neighborhood,
              city: client.city,
              state: client.state,
              notes: client.notes ?? "",
            }}
          />
        </div>
      </div>
    </AppShell>
  );
}
