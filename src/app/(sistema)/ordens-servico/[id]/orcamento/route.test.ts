import { beforeEach, describe, expect, it, vi } from "vitest";

import { getServiceOrderById } from "@/features/ordens-servico/queries";
import { createQuotePdf } from "@/features/ordens-servico/pdf/quote-pdf";
import type { ServiceOrderDetails } from "@/features/ordens-servico/types";
import { GET } from "./route";

vi.mock("node:fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();

  return {
    ...actual,
    readFile: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
  };
});

vi.mock("@/features/ordens-servico/queries", () => ({
  getServiceOrderById: vi.fn(),
}));

vi.mock("@/features/ordens-servico/pdf/quote-pdf", () => ({
  createQuotePdf: vi.fn().mockResolvedValue(new Uint8Array([37, 80, 68, 70])),
  quotePdfFilename: (number: number) =>
    `orcamento-os-${String(number).padStart(4, "0")}.pdf`,
}));

const mockedGetOrder = vi.mocked(getServiceOrderById);
const mockedCreatePdf = vi.mocked(createQuotePdf);

function routeContext(id = "order-1") {
  return { params: Promise.resolve({ id }) };
}

describe("download do orçamento", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retorna um PDF privado com nome baseado no número da ordem", async () => {
    const order = {
      id: "order-1",
      number: 18,
      items: [{ removedAt: null }],
    } as ServiceOrderDetails;
    mockedGetOrder.mockResolvedValue(order);

    const response = await GET(new Request("http://localhost"), routeContext());

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(response.headers.get("Content-Disposition")).toBe(
      'attachment; filename="orcamento-os-0018.pdf"',
    );
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(mockedCreatePdf).toHaveBeenCalledWith(
      order,
      expect.objectContaining({ logoBytes: expect.any(Uint8Array) }),
    );
  });

  it("responde 404 quando a ordem não existe", async () => {
    mockedGetOrder.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost"), routeContext());

    expect(response.status).toBe(404);
    expect(mockedCreatePdf).not.toHaveBeenCalled();
  });

  it("impede gerar orçamento sem itens ativos", async () => {
    mockedGetOrder.mockResolvedValue({
      id: "order-1",
      number: 18,
      items: [{ removedAt: "2026-09-07T12:00:00.000Z" }],
    } as ServiceOrderDetails);

    const response = await GET(new Request("http://localhost"), routeContext());

    expect(response.status).toBe(409);
    expect(await response.text()).toContain("Adicione ao menos um item");
    expect(mockedCreatePdf).not.toHaveBeenCalled();
  });
});
