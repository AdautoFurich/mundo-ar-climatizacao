import { beforeEach, describe, expect, it, vi } from "vitest";

import { INITIAL_ORDER_ACTION_STATE } from "../types";
import { createServiceOrderAction } from "./intake";

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
vi.mock("../queries", () => ({ listActiveOrderVehicles: vi.fn() }));

function validFormData() {
  const data = new FormData();
  data.set("clientId", "10000000-0000-4000-8000-000000000001");
  data.set("vehicleId", "10000000-0000-4000-8000-000000000002");
  data.set("responsibleId", "10000000-0000-4000-8000-000000000003");
  data.set("entryAt", "2026-09-06T13:00");
  data.set("mileage", "84520");
  data.set("fuelLevel", "metade");
  data.set("customerComplaint", "Ar não está resfriando.");
  data.set("expectedCompletionAt", "2026-09-07T18:00");
  data.set("accessories", "Controle do alarme");
  data.set("visibleDamage", "");
  data.set("notes", "");
  return data;
}

describe("ação de abertura da ordem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requirePermission.mockResolvedValue({
      id: "10000000-0000-4000-8000-000000000003",
    });
  });

  it("não acessa o banco quando os dados são inválidos", async () => {
    const result = await createServiceOrderAction(
      INITIAL_ORDER_ACTION_STATE,
      new FormData(),
    );

    expect(result.status).toBe("error");
    expect(result.fieldErrors).toHaveProperty("clientId");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("abre a ordem exclusivamente pela função transacional", async () => {
    rpc.mockResolvedValue({
      data: "f74f53fe-83fd-4e44-9a35-9253204f711a",
      error: null,
    });

    await expect(
      createServiceOrderAction(INITIAL_ORDER_ACTION_STATE, validFormData()),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(rpc).toHaveBeenCalledOnce();
    expect(rpc).toHaveBeenCalledWith("criar_ordem_servico", {
      p_cliente_id: "10000000-0000-4000-8000-000000000001",
      p_veiculo_id: "10000000-0000-4000-8000-000000000002",
      p_responsavel_id: "10000000-0000-4000-8000-000000000003",
      p_entrada_em: "2026-09-06T16:00:00.000Z",
      p_previsao_em: "2026-09-07T21:00:00.000Z",
      p_quilometragem: 84520,
      p_nivel_combustivel: "metade",
      p_relato: "Ar não está resfriando.",
      p_acessorios: "Controle do alarme",
      p_avarias: null,
      p_observacoes: null,
    });
    expect(revalidatePath).toHaveBeenCalledWith("/ordens-servico");
    expect(redirect).toHaveBeenCalledWith(
      "/ordens-servico?criada=f74f53fe-83fd-4e44-9a35-9253204f711a",
    );
  });
});
