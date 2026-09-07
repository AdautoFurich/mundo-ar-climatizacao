import { beforeEach, describe, expect, it, vi } from "vitest";

import { INITIAL_ORDER_ACTION_STATE } from "../types";
import { sendQuoteForApprovalAction, startDiagnosisAction } from "./workflow";

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

describe("início do diagnóstico", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requirePermission.mockResolvedValue({ id: "usuario" });
  });

  it("avança somente pela função transacional", async () => {
    rpc.mockResolvedValue({ data: 2, error: null });

    await expect(
      startDiagnosisAction(
        "f74f53fe-83fd-4e44-9a35-9253204f711a",
        1,
        INITIAL_ORDER_ACTION_STATE,
        new FormData(),
      ),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(rpc).toHaveBeenCalledWith("avancar_ordem_servico", {
      p_destino: "em_diagnostico",
      p_ordem_id: "f74f53fe-83fd-4e44-9a35-9253204f711a",
      p_versao: 1,
    });
    expect(redirect).toHaveBeenCalledWith(
      "/ordens-servico/f74f53fe-83fd-4e44-9a35-9253204f711a?situacao=em_diagnostico",
    );
  });

  it("redireciona conflitos para recarga segura", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "40001" } });
    await expect(
      startDiagnosisAction(
        "f74f53fe-83fd-4e44-9a35-9253204f711a",
        1,
        INITIAL_ORDER_ACTION_STATE,
        new FormData(),
      ),
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith(
      "/ordens-servico/f74f53fe-83fd-4e44-9a35-9253204f711a?conflito=1",
    );
  });
});

describe("envio do orçamento para aprovação", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requirePermission.mockResolvedValue({ id: "usuario" });
  });

  it("avança para aguardando aprovação pela função transacional", async () => {
    rpc.mockResolvedValue({ data: 5, error: null });
    await expect(
      sendQuoteForApprovalAction(
        "f74f53fe-83fd-4e44-9a35-9253204f711a",
        4,
        INITIAL_ORDER_ACTION_STATE,
        new FormData(),
      ),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(rpc).toHaveBeenCalledWith("avancar_ordem_servico", {
      p_destino: "aguardando_aprovacao",
      p_ordem_id: "f74f53fe-83fd-4e44-9a35-9253204f711a",
      p_versao: 4,
    });
    expect(redirect).toHaveBeenCalledWith(
      "/ordens-servico/f74f53fe-83fd-4e44-9a35-9253204f711a?situacao=aguardando_aprovacao",
    );
  });
});
