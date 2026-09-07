import { beforeEach, describe, expect, it, vi } from "vitest";

import { INITIAL_ORDER_ACTION_STATE } from "../types";
import { deliverOrderAction } from "./delivery";

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

function deliveryData() {
  const data = new FormData();
  data.set("paymentMethod", "pix");
  data.set("deliveredAt", "2026-09-07T17:30");
  data.set("notes", "Veículo entregue ao proprietário.");
  data.set("expectedVersion", "8");
  return data;
}

describe("entrega da ordem de serviço", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requirePermission.mockResolvedValue({ id: "usuario", role: "atendente" });
  });

  it("valida os dados antes de consultar o banco", async () => {
    const data = deliveryData();
    data.set("paymentMethod", "boleto");

    const result = await deliverOrderAction(
      ORDER_ID,
      INITIAL_ORDER_ACTION_STATE,
      data,
    );

    expect(result.status).toBe("error");
    expect(result.fieldErrors).toHaveProperty("paymentMethod");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("registra pagamento e entrega em uma função transacional", async () => {
    rpc.mockResolvedValue({ data: 9, error: null });

    await expect(
      deliverOrderAction(
        ORDER_ID,
        INITIAL_ORDER_ACTION_STATE,
        deliveryData(),
      ),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(requirePermission).toHaveBeenCalledWith("ordens:atender");
    expect(rpc).toHaveBeenCalledWith("entregar_ordem_servico", {
      p_entregue_em: "2026-09-07T20:30:00.000Z",
      p_forma: "pix",
      p_observacoes: "Veículo entregue ao proprietário.",
      p_ordem_id: ORDER_ID,
      p_versao: 8,
    });
    expect(redirect).toHaveBeenCalledWith(
      `/ordens-servico/${ORDER_ID}?entrega=registrada#entrega`,
    );
  });

  it("envia observações vazias como nulo", async () => {
    rpc.mockResolvedValue({ data: 9, error: null });
    const data = deliveryData();
    data.set("notes", "");

    await expect(
      deliverOrderAction(ORDER_ID, INITIAL_ORDER_ACTION_STATE, data),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(rpc).toHaveBeenCalledWith(
      "entregar_ordem_servico",
      expect.objectContaining({ p_observacoes: null }),
    );
  });

  it("trata conflito de versão com recarga segura", async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { code: "P0001", message: "CONFLITO_VERSAO" },
    });

    await expect(
      deliverOrderAction(
        ORDER_ID,
        INITIAL_ORDER_ACTION_STATE,
        deliveryData(),
      ),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith(
      `/ordens-servico/${ORDER_ID}?conflito=1#entrega`,
    );
  });
});
