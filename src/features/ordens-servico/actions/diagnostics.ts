"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requirePermission } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { diagnosisSchema, orderIdSchema } from "../schemas";
import type { OrderActionState } from "../types";

export async function saveDiagnosisAction(
  orderId: string,
  _previousState: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  await requirePermission("ordens:atender");
  const validId = orderIdSchema.safeParse(orderId);
  if (!validId.success) {
    return { status: "error", message: "Ordem de serviço inválida." };
  }

  const parsed = diagnosisSchema.safeParse({
    description: formData.get("description"),
    notes: formData.get("notes"),
    expectedCompletionAt: formData.get("expectedCompletionAt"),
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
  const { data, error } = await supabase.rpc("salvar_diagnostico_ordem", {
    p_ordem_id: validId.data,
    p_descricao: parsed.data.description,
    p_observacoes: parsed.data.notes,
    p_previsao_em: parsed.data.expectedCompletionAt,
    p_versao: parsed.data.expectedVersion,
  });

  if (error?.code === "40001") {
    redirect(`/ordens-servico/${validId.data}?conflito=1`);
  }
  if (error || data === null) {
    return {
      status: "error",
      message:
        error?.code === "23514"
          ? "A situação atual ou a previsão informada não permite registrar o diagnóstico. Recarregue os dados e revise a previsão."
          : "Não foi possível salvar o diagnóstico agora.",
    };
  }

  revalidatePath("/");
  revalidatePath("/ordens-servico");
  revalidatePath(`/ordens-servico/${validId.data}`);
  redirect(`/ordens-servico/${validId.data}?diagnostico=salvo`);
}
