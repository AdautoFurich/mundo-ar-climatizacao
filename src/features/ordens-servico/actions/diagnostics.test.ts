import { beforeEach, describe, expect, it, vi } from "vitest";

import { INITIAL_ORDER_ACTION_STATE } from "../types";
import { saveDiagnosisAction } from "./diagnostics";

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

function diagnosisData() {
  const data = new FormData();
  data.set("description", "Baixa pressão no circuito.");
  data.set("notes", "Verificar possível vazamento.");
  data.set("expectedCompletionAt", "2026-09-08T17:30");
  data.set("expectedVersion", "2");
  return data;
}

describe("ação de diagnóstico", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requirePermission.mockResolvedValue({ id: "usuario" });
  });

  it("valida os dados antes de acessar o banco", async () => {
    const result = await saveDiagnosisAction(
      "f74f53fe-83fd-4e44-9a35-9253204f711a",
      INITIAL_ORDER_ACTION_STATE,
      new FormData(),
    );
    expect(result.status).toBe("error");
    expect(result.fieldErrors).toHaveProperty("description");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("salva pela função transacional e redireciona", async () => {
    rpc.mockResolvedValue({ data: 3, error: null });

    await expect(
      saveDiagnosisAction(
        "f74f53fe-83fd-4e44-9a35-9253204f711a",
        INITIAL_ORDER_ACTION_STATE,
        diagnosisData(),
      ),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(rpc).toHaveBeenCalledWith("salvar_diagnostico_ordem", {
      p_ordem_id: "f74f53fe-83fd-4e44-9a35-9253204f711a",
      p_descricao: "Baixa pressão no circuito.",
      p_observacoes: "Verificar possível vazamento.",
      p_previsao_em: "2026-09-08T20:30:00.000Z",
      p_versao: 2,
    });
    expect(revalidatePath).toHaveBeenCalledWith(
      "/ordens-servico/f74f53fe-83fd-4e44-9a35-9253204f711a",
    );
    expect(redirect).toHaveBeenCalledWith(
      "/ordens-servico/f74f53fe-83fd-4e44-9a35-9253204f711a?diagnostico=salvo",
    );
  });

  it("trata conflito de versão separadamente", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "40001" } });
    await expect(
      saveDiagnosisAction(
        "f74f53fe-83fd-4e44-9a35-9253204f711a",
        INITIAL_ORDER_ACTION_STATE,
        diagnosisData(),
      ),
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith(
      "/ordens-servico/f74f53fe-83fd-4e44-9a35-9253204f711a?conflito=1",
    );
  });
});
