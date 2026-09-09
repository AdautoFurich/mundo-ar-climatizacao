"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requirePermission } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { orderIdSchema } from "../schemas";
import type { OrderActionState } from "../types";

const itemIdSchema = z.string().uuid();

function isConflict(error: { code?: string; message?: string } | null) {
  return (
    error?.code === "40001" ||
    (error?.code === "P0001" && error.message?.includes("CONFLITO_VERSAO"))
  );
}

export async function setOrderItemExecutedAction(
  orderId: string,
  itemId: string,
  expectedVersion: number,
  executed: boolean,
  previousState: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  void previousState;
  void formData;
  await requirePermission("ordens:executar");

  const validOrderId = orderIdSchema.safeParse(orderId);
  if (!validOrderId.success) {
    return { status: "error", message: "Ordem de serviço inválida." };
  }
  const validItemId = itemIdSchema.safeParse(itemId);
  if (!validItemId.success) {
    return { status: "error", message: "Item da ordem inválido." };
  }
  if (
    !Number.isSafeInteger(expectedVersion) ||
    expectedVersion <= 0 ||
    typeof executed !== "boolean"
  ) {
    return { status: "error", message: "Dados de execução inválidos." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("marcar_item_executado", {
    p_executado: executed,
    p_item_id: validItemId.data,
    p_ordem_id: validOrderId.data,
    p_versao: expectedVersion,
  });

  if (isConflict(error)) {
    redirect(`/ordens-servico/${validOrderId.data}?conflito=1#execucao`);
  }
  if (error || data === null) {
    return {
      status: "error",
      message:
        error?.code === "23514" || error?.code === "P0002"
          ? "Somente itens autorizados de uma ordem em execução podem ser alterados."
          : "Não foi possível atualizar o item agora.",
    };
  }

  revalidatePath("/");
  revalidatePath("/ordens-servico");
  revalidatePath(`/ordens-servico/${validOrderId.data}`);
  redirect(
    `/ordens-servico/${validOrderId.data}?execucao=${executed ? "item-concluido" : "item-reaberto"}#execucao`,
  );
}
