"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requirePermission } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { discountSchema, orderIdSchema, orderItemSchema } from "../schemas";
import type { OrderActionState, OrderItemType } from "../types";

type MutationError = { code?: string; message?: string } | null;

function isConflict(error: MutationError) {
  return (
    error?.code === "40001" ||
    (error?.code === "P0001" && error.message?.includes("CONFLITO_VERSAO"))
  );
}

function validVersion(value: number) {
  return Number.isSafeInteger(value) && value > 0;
}

function revalidateOrder(orderId: string) {
  revalidatePath("/");
  revalidatePath("/ordens-servico");
  revalidatePath(`/ordens-servico/${orderId}`);
}

function itemPayload(formData: FormData) {
  return orderItemSchema.safeParse({
    type: formData.get("type"),
    serviceId: formData.get("serviceId"),
    description: formData.get("description"),
    quantity: formData.get("quantity"),
    unitPrice: formData.get("unitPrice"),
  });
}

function invalidOrderState(): OrderActionState {
  return { status: "error", message: "Ordem de serviço inválida." };
}

function mutationFailure(error: MutationError): OrderActionState {
  if (error?.code === "23514" || error?.code === "P0002") {
    return {
      status: "error",
      message:
        "O item não pôde ser alterado na situação atual. Recarregue a ordem e revise os dados.",
    };
  }
  return { status: "error", message: "Não foi possível atualizar o orçamento agora." };
}

async function saveItem(
  operation: "add" | "update",
  orderId: string,
  itemId: string | null,
  expectedVersion: number,
  formData: FormData,
): Promise<OrderActionState> {
  await requirePermission("ordens:atender");
  const validOrderId = orderIdSchema.safeParse(orderId);
  const validItemId = itemId ? orderIdSchema.safeParse(itemId) : null;
  if (
    !validOrderId.success ||
    !validVersion(expectedVersion) ||
    (validItemId && !validItemId.success)
  ) {
    return invalidOrderState();
  }

  const parsed = itemPayload(formData);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise os campos indicados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const common = {
    p_descricao: parsed.data.description,
    p_ordem_id: validOrderId.data,
    p_quantidade: parsed.data.quantityThousandths / 1000,
    p_servico_id: parsed.data.serviceId,
    p_tipo: parsed.data.type as OrderItemType,
    p_valor_unitario: parsed.data.unitPriceCents / 100,
    p_versao: expectedVersion,
  };
  const supabase = await createClient();
  const result =
    operation === "add"
      ? await supabase.rpc("adicionar_item_ordem", common)
      : await supabase.rpc("alterar_item_ordem", {
          ...common,
          p_item_id: validItemId!.data,
        });

  if (isConflict(result.error)) {
    redirect(`/ordens-servico/${validOrderId.data}?conflito=1`);
  }
  if (result.error || result.data === null) return mutationFailure(result.error);

  revalidateOrder(validOrderId.data);
  redirect(
    `/ordens-servico/${validOrderId.data}?orcamento=${operation === "add" ? "item-adicionado" : "item-atualizado"}#orcamento`,
  );
}

export async function addOrderItemAction(
  orderId: string,
  expectedVersion: number,
  previousState: OrderActionState,
  formData: FormData,
) {
  void previousState;
  return saveItem("add", orderId, null, expectedVersion, formData);
}

export async function updateOrderItemAction(
  orderId: string,
  itemId: string,
  expectedVersion: number,
  previousState: OrderActionState,
  formData: FormData,
) {
  void previousState;
  return saveItem("update", orderId, itemId, expectedVersion, formData);
}

export async function removeOrderItemAction(
  orderId: string,
  itemId: string,
  expectedVersion: number,
  previousState: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  void previousState;
  void formData;
  await requirePermission("ordens:atender");
  const validOrderId = orderIdSchema.safeParse(orderId);
  const validItemId = orderIdSchema.safeParse(itemId);
  if (!validOrderId.success || !validItemId.success || !validVersion(expectedVersion)) {
    return invalidOrderState();
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("remover_item_ordem", {
    p_item_id: validItemId.data,
    p_ordem_id: validOrderId.data,
    p_versao: expectedVersion,
  });
  if (isConflict(error)) redirect(`/ordens-servico/${validOrderId.data}?conflito=1`);
  if (error || data === null) return mutationFailure(error);

  revalidateOrder(validOrderId.data);
  redirect(`/ordens-servico/${validOrderId.data}?orcamento=item-removido#orcamento`);
}

export async function applyOrderDiscountAction(
  orderId: string,
  previousState: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  void previousState;
  await requirePermission("ordens:administrar");
  const validOrderId = orderIdSchema.safeParse(orderId);
  if (!validOrderId.success) return invalidOrderState();

  const parsed = discountSchema.safeParse({
    discount: formData.get("discount"),
    expectedVersion: formData.get("expectedVersion"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Revise o desconto informado.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("aplicar_desconto_ordem", {
    p_desconto: parsed.data.discount / 100,
    p_ordem_id: validOrderId.data,
    p_versao: parsed.data.expectedVersion,
  });
  if (isConflict(error)) redirect(`/ordens-servico/${validOrderId.data}?conflito=1`);
  if (error || data === null) {
    return {
      status: "error",
      message:
        error?.code === "23514"
          ? "O desconto é inválido ou ultrapassa o valor permitido."
          : "Não foi possível aplicar o desconto agora.",
    };
  }

  revalidateOrder(validOrderId.data);
  redirect(`/ordens-servico/${validOrderId.data}?orcamento=desconto-aplicado#orcamento`);
}
