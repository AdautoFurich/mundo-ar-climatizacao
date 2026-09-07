"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requirePermission } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { intakeSchema, orderIdSchema } from "../schemas";
import { listActiveOrderVehicles } from "../queries";
import type { OrderActionState, OrderVehicleOption } from "../types";

function formValues(formData: FormData) {
  return {
    clientId: formData.get("clientId"),
    vehicleId: formData.get("vehicleId"),
    responsibleId: formData.get("responsibleId"),
    entryAt: formData.get("entryAt"),
    mileage: formData.get("mileage"),
    fuelLevel: formData.get("fuelLevel"),
    customerComplaint: formData.get("customerComplaint"),
    expectedCompletionAt: formData.get("expectedCompletionAt"),
    accessories: formData.get("accessories"),
    visibleDamage: formData.get("visibleDamage"),
    notes: formData.get("notes"),
  };
}

export async function listVehiclesForOrderAction(
  clientId: string,
): Promise<OrderVehicleOption[]> {
  await requirePermission("ordens:atender");
  if (!orderIdSchema.safeParse(clientId).success) return [];
  return listActiveOrderVehicles(clientId);
}

export async function createServiceOrderAction(
  _previousState: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  await requirePermission("ordens:atender");
  const parsed = intakeSchema.safeParse(formValues(formData));

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os campos indicados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;
  const supabase = await createClient();
  const { data: orderId, error } = await supabase.rpc("criar_ordem_servico", {
    p_cliente_id: data.clientId,
    p_veiculo_id: data.vehicleId,
    p_responsavel_id: data.responsibleId,
    p_entrada_em: data.entryAt,
    p_previsao_em: data.expectedCompletionAt,
    p_quilometragem: data.mileage,
    p_nivel_combustivel: data.fuelLevel,
    p_relato: data.customerComplaint,
    p_acessorios: data.accessories,
    p_avarias: data.visibleDamage,
    p_observacoes: data.notes,
  });

  if (error || !orderId) {
    return {
      status: "error",
      message:
        error?.code === "23514" || error?.code === "23503"
          ? "O cliente, o veículo ou o responsável não está mais disponível."
          : "Não foi possível abrir a ordem de serviço agora.",
    };
  }

  revalidatePath("/");
  revalidatePath("/ordens-servico");
  revalidatePath(`/clientes/${data.clientId}`);
  revalidatePath(`/veiculos/${data.vehicleId}`);
  redirect(`/ordens-servico?criada=${orderId}`);
}
