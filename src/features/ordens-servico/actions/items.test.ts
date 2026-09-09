import { beforeEach, describe, expect, it, vi } from "vitest";

import { INITIAL_ORDER_ACTION_STATE } from "../types";
import {
  addOrderItemAction,
  applyOrderDiscountAction,
  removeOrderItemAction,
  updateOrderItemAction,
} from "./items";

const { revalidatePath, redirect, requirePermission, rpc } = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
  requirePermission: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("@/lib/auth/guards", () => ({ requirePermission }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ rpc })),
}));

const ORDER_ID = "f74f53fe-83fd-4e44-9a35-9253204f711a";
const ITEM_ID = "669999f7-c1d7-4ca2-9e55-2e1a6ddf8f93";
const SERVICE_ID = "241a81ad-8f70-4c3c-a162-a763d8258d93";

function itemData() {
  const data = new FormData();
  data.set("type", "servico");
  data.set("serviceId", SERVICE_ID);
  data.set("description", "Higienização completa");
  data.set("quantity", "1,5");
  data.set("unitPrice", "250,00");
  return data;
}

describe("ações dos itens do orçamento", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requirePermission.mockResolvedValue({ id: "usuario", role: "atendente" });
  });

  it("valida os dados antes de acessar o banco", async () => {
    const result = await addOrderItemAction(
      ORDER_ID,
      3,
      INITIAL_ORDER_ACTION_STATE,
      new FormData(),
    );
    expect(result.status).toBe("error");
    expect(result.fieldErrors).toHaveProperty("description");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("adiciona um item convertendo quantidade e dinheiro", async () => {
    rpc.mockResolvedValue({ data: ITEM_ID, error: null });
    await expect(
      addOrderItemAction(ORDER_ID, 3, INITIAL_ORDER_ACTION_STATE, itemData()),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(rpc).toHaveBeenCalledWith("adicionar_item_ordem", {
      p_descricao: "Higienização completa",
      p_ordem_id: ORDER_ID,
      p_quantidade: 1.5,
      p_servico_id: SERVICE_ID,
      p_tipo: "servico",
      p_valor_unitario: 250,
      p_versao: 3,
    });
    expect(redirect).toHaveBeenCalledWith(
      `/ordens-servico/${ORDER_ID}?orcamento=item-adicionado#orcamento`,
    );
  });

  it("altera um item pela função transacional", async () => {
    rpc.mockResolvedValue({ data: 4, error: null });
    await expect(
      updateOrderItemAction(
        ORDER_ID,
        ITEM_ID,
        3,
        INITIAL_ORDER_ACTION_STATE,
        itemData(),
      ),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(rpc).toHaveBeenCalledWith(
      "alterar_item_ordem",
      expect.objectContaining({ p_item_id: ITEM_ID, p_versao: 3 }),
    );
  });

  it("remove logicamente o item após confirmar sua identidade", async () => {
    rpc.mockResolvedValue({ data: 4, error: null });
    await expect(
      removeOrderItemAction(
        ORDER_ID,
        ITEM_ID,
        3,
        INITIAL_ORDER_ACTION_STATE,
        new FormData(),
      ),
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(rpc).toHaveBeenCalledWith("remover_item_ordem", {
      p_item_id: ITEM_ID,
      p_ordem_id: ORDER_ID,
      p_versao: 3,
    });
  });

  it("reserva a alteração de desconto ao administrador", async () => {
    rpc.mockResolvedValue({ data: 4, error: null });
    const data = new FormData();
    data.set("discount", "25,50");
    data.set("expectedVersion", "3");

    await expect(
      applyOrderDiscountAction(ORDER_ID, INITIAL_ORDER_ACTION_STATE, data),
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(requirePermission).toHaveBeenCalledWith("ordens:administrar");
    expect(rpc).toHaveBeenCalledWith("aplicar_desconto_ordem", {
      p_desconto: 25.5,
      p_ordem_id: ORDER_ID,
      p_versao: 3,
    });
  });

  it("redireciona conflitos normalizados para recarregamento", async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { code: "P0001", message: "CONFLITO_VERSAO" },
    });
    await expect(
      addOrderItemAction(ORDER_ID, 3, INITIAL_ORDER_ACTION_STATE, itemData()),
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith(
      `/ordens-servico/${ORDER_ID}?conflito=1`,
    );
  });
});
