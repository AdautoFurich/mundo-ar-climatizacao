"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requirePermission } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { orderIdSchema } from "../schemas";
import type { OrderActionState } from "../types";

function isConflict(error: { code?: string; message?: string } | null) {
  return (
    error?.code === "40001" ||
    (error?.code === "P0001" && error.message?.includes("CONFLITO_VERSAO"))
  );
}

function revalidateOrder(orderId: string) {
  revalidatePath("/");
  revalidatePath("/ordens-servico");
  revalidatePath(`/ordens-servico/${orderId}`);
}

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

  if (isConflict(error)) {
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

  revalidateOrder(validId.data);
  redirect(`/ordens-servico/${validId.data}?situacao=em_diagnostico`);
}

export async function sendQuoteForApprovalAction(
  orderId: string,
  expectedVersion: number,
  previousState: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  void previousState;
  void formData;
  await requirePermission("ordens:atender");
  const validId = orderIdSchema.safeParse(orderId);
  if (!validId.success || !Number.isSafeInteger(expectedVersion) || expectedVersion <= 0) {
    return { status: "error", message: "Ordem de serviço inválida." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("avancar_ordem_servico", {
    p_destino: "aguardando_aprovacao",
    p_ordem_id: validId.data,
    p_versao: expectedVersion,
  });
  if (isConflict(error)) redirect(`/ordens-servico/${validId.data}?conflito=1`);
  if (error || data === null) {
    return {
      status: "error",
      message:
        error?.code === "23514"
          ? "Registre o diagnóstico e adicione ao menos um item antes de enviar."
          : "Não foi possível enviar o orçamento para aprovação agora.",
    };
  }

  revalidateOrder(validId.data);
  redirect(`/ordens-servico/${validId.data}?situacao=aguardando_aprovacao`);
}

async function advanceExecutionStage(
  orderId: string,
  expectedVersion: number,
  destination: "em_execucao" | "pronta_retirada",
): Promise<OrderActionState> {
  await requirePermission("ordens:executar");
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
    p_destino: destination,
    p_ordem_id: validId.data,
    p_versao: expectedVersion,
  });

  if (isConflict(error)) {
    redirect(`/ordens-servico/${validId.data}?conflito=1#execucao`);
  }
  if (error || data === null) {
    const invalidStateMessage =
      destination === "em_execucao"
        ? "A ordem precisa estar aprovada antes de iniciar a execução."
        : "Conclua todos os itens autorizados antes de liberar a retirada.";
    return {
      status: "error",
      message:
        error?.code === "23514" || error?.code === "P0002"
          ? invalidStateMessage
          : "Não foi possível atualizar a etapa da ordem agora.",
    };
  }

  revalidateOrder(validId.data);
  redirect(
    `/ordens-servico/${validId.data}?situacao=${destination}#execucao`,
  );
}

export async function startExecutionAction(
  orderId: string,
  expectedVersion: number,
  previousState: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  void previousState;
  void formData;
  return advanceExecutionStage(orderId, expectedVersion, "em_execucao");
}

export async function markReadyForPickupAction(
  orderId: string,
  expectedVersion: number,
  previousState: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  void previousState;
  void formData;
  return advanceExecutionStage(orderId, expectedVersion, "pronta_retirada");
}
