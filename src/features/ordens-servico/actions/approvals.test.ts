import { beforeEach, describe, expect, it, vi } from "vitest";

import { INITIAL_ORDER_ACTION_STATE } from "../types";
import { registerOrderApprovalsAction } from "./approvals";

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

function approvalData() {
  const data = new FormData();
  data.set("decisions", JSON.stringify([{ itemId: ITEM_ID, decision: "aprovado" }]));
  data.set("channel", "whatsapp");
  data.set("respondedAt", "2026-09-08T14:30");
  data.set("notes", "Cliente confirmou por mensagem.");
  data.set("expectedVersion", "5");
  return data;
}

describe("registro das aprovações do orçamento", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requirePermission.mockResolvedValue({ id: "usuario", role: "atendente" });
  });

  it("rejeita o envio sem decisões", async () => {
    const data = approvalData();
    data.set("decisions", "[]");
    const result = await registerOrderApprovalsAction(
      ORDER_ID,
      INITIAL_ORDER_ACTION_STATE,
      data,
    );
    expect(result.status).toBe("error");
    expect(result.fieldErrors).toHaveProperty("decisions");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("registra as decisões em uma única função transacional", async () => {
    rpc.mockResolvedValue({ data: 6, error: null });
    await expect(
      registerOrderApprovalsAction(
        ORDER_ID,
        INITIAL_ORDER_ACTION_STATE,
        approvalData(),
      ),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(rpc).toHaveBeenCalledWith("registrar_aprovacoes_ordem", {
      p_canal: "whatsapp",
      p_decisoes: [{ itemId: ITEM_ID, decision: "aprovado" }],
      p_observacoes: "Cliente confirmou por mensagem.",
      p_ordem_id: ORDER_ID,
      p_respondido_em: "2026-09-08T17:30:00.000Z",
      p_versao: 5,
    });
    expect(redirect).toHaveBeenCalledWith(
      `/ordens-servico/${ORDER_ID}?aprovacao=registrada#orcamento`,
    );
  });

  it("trata conflito de versão separadamente", async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { code: "P0001", message: "CONFLITO_VERSAO" },
    });
    await expect(
      registerOrderApprovalsAction(
        ORDER_ID,
        INITIAL_ORDER_ACTION_STATE,
        approvalData(),
      ),
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith(
      `/ordens-servico/${ORDER_ID}?conflito=1`,
    );
  });
});
