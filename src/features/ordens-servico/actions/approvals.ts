"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requirePermission } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { approvalBatchSchema, orderIdSchema } from "../schemas";
import type { OrderActionState } from "../types";

function isConflict(error: { code?: string; message?: string } | null) {
  return (
    error?.code === "40001" ||
    (error?.code === "P0001" && error.message?.includes("CONFLITO_VERSAO"))
  );
}

export async function registerOrderApprovalsAction(
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

  const parsed = approvalBatchSchema.safeParse({
    decisions: formData.get("decisions"),
    channel: formData.get("channel"),
    respondedAt: formData.get("respondedAt"),
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
  const { data, error } = await supabase.rpc("registrar_aprovacoes_ordem", {
    p_canal: parsed.data.channel,
    p_decisoes: parsed.data.decisions,
    p_observacoes: parsed.data.notes,
    p_ordem_id: validOrderId.data,
    p_respondido_em: parsed.data.respondedAt,
    p_versao: parsed.data.expectedVersion,
  });

  if (isConflict(error)) {
    redirect(`/ordens-servico/${validOrderId.data}?conflito=1`);
  }
  if (error || data === null) {
    return {
      status: "error",
      message:
        error?.code === "23514" || error?.code === "P0002"
          ? "As decisões não puderam ser registradas. Recarregue a ordem e revise os itens."
          : "Não foi possível registrar a resposta do cliente agora.",
    };
  }

  revalidatePath("/");
  revalidatePath("/ordens-servico");
  revalidatePath(`/ordens-servico/${validOrderId.data}`);
  redirect(`/ordens-servico/${validOrderId.data}?aprovacao=registrada#orcamento`);
}
