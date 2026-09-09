import { readFile } from "node:fs/promises";
import path from "node:path";

import { getServiceOrderById } from "@/features/ordens-servico/queries";
import {
  createQuotePdf,
  quotePdfFilename,
} from "@/features/ordens-servico/pdf/quote-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function loadBrandLogo() {
  try {
    return new Uint8Array(
      await readFile(path.join(process.cwd(), "public", "brand", "mundo-ar-logo.png")),
    );
  } catch {
    return undefined;
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const order = await getServiceOrderById(id);

  if (!order) {
    return new Response("Ordem de serviço não encontrada.", { status: 404 });
  }

  if (!order.items.some((item) => !item.removedAt)) {
    return new Response("Adicione ao menos um item antes de gerar o orçamento.", {
      status: 409,
    });
  }

  const pdfBytes = await createQuotePdf(order, {
    logoBytes: await loadBrandLogo(),
  });

  return new Response(Buffer.from(pdfBytes), {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="${quotePdfFilename(order.number)}"`,
      "Content-Type": "application/pdf",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
