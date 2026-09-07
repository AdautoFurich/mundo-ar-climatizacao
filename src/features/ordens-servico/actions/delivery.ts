"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requirePermission } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { deliverySchema, orderIdSchema } from "../schemas";
import type { OrderActionState } from "../types";

function isConflict(error: { code?: string; message?: string } | null) {
  return (
    error?.code === "40001" ||
    (error?.code === "P0001" && error.message?.includes("CONFLITO_VERSAO"))
  );
}

export async function deliverOrderAction(
  orderId: string,
  previousState: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  void previousState;
  await requirePermission("ordens:atender");

  const validOrderId = orderIdSchema.safeParse(orderId);
  if (!validOrderId.success) {
    return { status: "error", message: "Ordem de serviço inválida." };
  }

  const parsed = deliverySchema.safeParse({
    paymentMethod: formData.get("paymentMethod"),
    deliveredAt: formData.get("deliveredAt"),
    notes: formData.get("notes"),
    expectedVersion: formData.get("expectedVersion"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os campos indicados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("entregar_ordem_servico", {
    p_entregue_em: parsed.data.deliveredAt,
    p_forma: parsed.data.paymentMethod,
    p_observacoes: parsed.data.notes,
    p_ordem_id: validOrderId.data,
    p_versao: parsed.data.expectedVersion,
  });

  if (isConflict(error)) {
    redirect(`/ordens-servico/${validOrderId.data}?conflito=1#entrega`);
  }
  if (error || data === null) {
    return {
      status: "error",
      message:
        error?.code === "23514" || error?.code === "P0002"
          ? "A entrega só pode ser registrada quando o veículo estiver pronto para retirada."
          : "Não foi possível registrar a entrega agora.",
    };
  }

  revalidatePath("/");
  revalidatePath("/ordens-servico");
  revalidatePath(`/ordens-servico/${validOrderId.data}`);
  redirect(`/ordens-servico/${validOrderId.data}?entrega=registrada#entrega`);
}
