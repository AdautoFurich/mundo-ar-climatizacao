"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requirePermission } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { orderIdSchema } from "../schemas";
import type { OrderActionState } from "../types";

export async function startDiagnosisAction(
  orderId: string,
  expectedVersion: number,
  previousState: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  void previousState;
  void formData;

  await requirePermission("ordens:atender");
  const validId = orderIdSchema.safeParse(orderId);
  if (
    !validId.success ||
    !Number.isSafeInteger(expectedVersion) ||
    expectedVersion <= 0
  ) {
    return { status: "error", message: "Ordem de serviço inválida." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("avancar_ordem_servico", {
    p_destino: "em_diagnostico",
    p_ordem_id: validId.data,
    p_versao: expectedVersion,
  });

  if (error?.code === "40001") {
    redirect(`/ordens-servico/${validId.data}?conflito=1`);
  }
  if (error || data === null) {
    return {
      status: "error",
      message:
        error?.code === "23514"
          ? "A ordem não pode iniciar o diagnóstico na situação atual. Recarregue os dados."
          : "Não foi possível iniciar o diagnóstico agora.",
    };
  }

  revalidatePath("/");
  revalidatePath("/ordens-servico");
  revalidatePath(`/ordens-servico/${validId.data}`);
  redirect(`/ordens-servico/${validId.data}?situacao=em_diagnostico`);
}
