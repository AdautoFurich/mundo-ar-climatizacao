import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { QuoteShareActions } from "./quote-share-actions";

const props = {
  clientName: "Maria da Silva",
  clientPhone: "(44) 99999-9999",
  fileName: "orcamento-os-0018.pdf",
  orderNumber: 18,
  quoteUrl: "/ordens-servico/order-1/orcamento",
  quotedTotal: 48750,
  vehicleLabel: "Chevrolet Onix",
  vehiclePlate: "ABC1D23",
};

function defineShareApi({
  canShare,
  share,
}: {
  canShare?: (data?: ShareData) => boolean;
  share?: (data?: ShareData) => Promise<void>;
}) {
  Object.defineProperty(navigator, "canShare", {
    configurable: true,
    value: canShare,
  });
  Object.defineProperty(navigator, "share", {
    configurable: true,
    value: share,
  });
}

describe("ações do orçamento", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    defineShareApi({});
  });

  it("compartilha o próprio arquivo PDF quando o navegador oferece suporte", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    defineShareApi({ canShare: () => true, share });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(new Blob(["pdf"], { type: "application/pdf" }), {
          status: 200,
        }),
      ),
    );

    render(<QuoteShareActions {...props} />);
    await userEvent.click(
      screen.getByRole("button", { name: "Compartilhar pelo WhatsApp" }),
    );

    await waitFor(() => expect(share).toHaveBeenCalledOnce());
    expect(fetch).toHaveBeenCalledWith(props.quoteUrl, {
      credentials: "same-origin",
    });
    expect(share).toHaveBeenCalledWith(
      expect.objectContaining({
        files: [expect.any(File)],
        text: expect.stringContaining("OS #0018"),
        title: "Orçamento - OS #0018",
      }),
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Orçamento compartilhado.",
    );
  });

  it("baixa o PDF e abre a conversa no WhatsApp Web como alternativa", async () => {
    defineShareApi({ canShare: () => false });
    let downloadedHref = "";
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
      function click(this: HTMLAnchorElement) {
        downloadedHref = this.getAttribute("href") ?? "";
      },
    );
    const openedWindow = { opener: window } as unknown as Window;
    const open = vi.spyOn(window, "open").mockReturnValue(openedWindow);

    render(<QuoteShareActions {...props} />);
    await userEvent.click(
      screen.getByRole("button", { name: "Compartilhar pelo WhatsApp" }),
    );

    expect(downloadedHref).toBe(props.quoteUrl);
    expect(open).toHaveBeenCalledWith(
      expect.stringMatching(
        /^https:\/\/wa\.me\/5544999999999\?text=.*OS%20%230018/,
      ),
      "_blank",
    );
    expect(openedWindow.opener).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent(
      "PDF baixado. Anexe-o à conversa aberta no WhatsApp.",
    );
  });

  it("informa quando o PDF não pode ser preparado para compartilhamento", async () => {
    defineShareApi({ canShare: () => true, share: vi.fn() });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("Erro", { status: 500 })),
    );

    render(<QuoteShareActions {...props} />);
    await userEvent.click(
      screen.getByRole("button", { name: "Compartilhar pelo WhatsApp" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível preparar o orçamento. Tente novamente.",
    );
    expect(navigator.share).not.toHaveBeenCalled();
  });
});
