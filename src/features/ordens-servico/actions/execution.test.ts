import { beforeEach, describe, expect, it, vi } from "vitest";

import { INITIAL_ORDER_ACTION_STATE } from "../types";
import { setOrderItemExecutedAction } from "./execution";

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

const orderId = "f74f53fe-83fd-4e44-9a35-9253204f711a";
const itemId = "669999f7-c1d7-4ca2-9e55-2e1a6ddf8f93";

describe("execução dos itens da ordem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requirePermission.mockResolvedValue({ id: "usuario" });
  });

  it.each([
    [true, "item-concluido"],
    [false, "item-reaberto"],
  ])("registra executado=%s pela função transacional", async (executed, result) => {
    rpc.mockResolvedValue({ data: 5, error: null });

    await expect(
      setOrderItemExecutedAction(
        orderId,
        itemId,
        4,
        executed,
        INITIAL_ORDER_ACTION_STATE,
        new FormData(),
      ),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(requirePermission).toHaveBeenCalledWith("ordens:executar");
    expect(rpc).toHaveBeenCalledWith("marcar_item_executado", {
      p_executado: executed,
      p_item_id: itemId,
      p_ordem_id: orderId,
      p_versao: 4,
    });
    expect(redirect).toHaveBeenCalledWith(
      `/ordens-servico/${orderId}?execucao=${result}#execucao`,
    );
  });

  it("redireciona conflito para uma recarga segura", async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { code: "P0001", message: "CONFLITO_VERSAO" },
    });

    await expect(
      setOrderItemExecutedAction(
        orderId,
        itemId,
        4,
        true,
        INITIAL_ORDER_ACTION_STATE,
        new FormData(),
      ),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(redirect).toHaveBeenCalledWith(
      `/ordens-servico/${orderId}?conflito=1#execucao`,
    );
  });

  it("não acessa o banco com identificadores inválidos", async () => {
    const result = await setOrderItemExecutedAction(
      orderId,
      "item-invalido",
      4,
      true,
      INITIAL_ORDER_ACTION_STATE,
      new FormData(),
    );

    expect(result).toEqual({
      status: "error",
      message: "Item da ordem inválido.",
    });
    expect(rpc).not.toHaveBeenCalled();
  });
});
