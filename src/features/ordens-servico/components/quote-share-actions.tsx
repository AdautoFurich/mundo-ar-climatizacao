"use client";

import { FileDown, LoaderCircle, MessageCircle } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { formatPlate } from "@/features/veiculos/formatters";
import { formatOrderMoney, formatOrderNumber } from "../formatters";

type Feedback = {
  message: string;
  tone: "error" | "success";
  showWhatsAppLink?: boolean;
};

type QuoteShareActionsProps = {
  clientName: string;
  clientPhone: string;
  fileName: string;
  orderNumber: number;
  quoteUrl: string;
  quotedTotal: number;
  vehicleLabel: string;
  vehiclePlate: string;
};

function whatsappPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("55") && (digits.length === 12 || digits.length === 13)
    ? digits
    : `55${digits}`;
}

function quoteMessage({
  clientName,
  orderNumber,
  quotedTotal,
  vehicleLabel,
  vehiclePlate,
}: Omit<QuoteShareActionsProps, "clientPhone" | "fileName" | "quoteUrl">) {
  return `Olá, ${clientName}. Segue o orçamento da ${formatOrderNumber(orderNumber)} referente ao veículo ${vehicleLabel}, placa ${formatPlate(vehiclePlate)}, no valor de ${formatOrderMoney(quotedTotal)}. Ficamos à disposição para esclarecimentos.`;
}

function supportsFileShare(fileName: string) {
  if (typeof navigator.share !== "function" || typeof navigator.canShare !== "function") {
    return false;
  }

  try {
    return navigator.canShare({
      files: [new File([], fileName, { type: "application/pdf" })],
    });
  } catch {
    return false;
  }
}

function downloadQuote(quoteUrl: string, fileName: string) {
  const link = document.createElement("a");
  link.download = fileName;
  link.href = quoteUrl;
  document.body.append(link);
  link.click();
  link.remove();
}

function isShareCancellation(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

export function QuoteShareActions(props: QuoteShareActionsProps) {
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [pending, setPending] = useState(false);
  const message = quoteMessage(props);
  const whatsappUrl = `https://wa.me/${whatsappPhone(props.clientPhone)}?text=${encodeURIComponent(message)}`;

  const openWhatsAppFallback = () => {
    downloadQuote(props.quoteUrl, props.fileName);
    const openedWindow = window.open(whatsappUrl, "_blank");
    if (openedWindow) openedWindow.opener = null;
    setFeedback({
      message: openedWindow
        ? "PDF baixado. Anexe-o à conversa aberta no WhatsApp."
        : "PDF baixado. O navegador bloqueou a abertura do WhatsApp.",
      showWhatsAppLink: !openedWindow,
      tone: "success",
    });
  };

  const shareQuote = async () => {
    setFeedback(null);

    if (!supportsFileShare(props.fileName)) {
      openWhatsAppFallback();
      return;
    }

    setPending(true);
    try {
      const response = await fetch(props.quoteUrl, { credentials: "same-origin" });
      if (!response.ok) throw new Error("Falha ao gerar o orçamento");

      const file = new File([await response.blob()], props.fileName, {
        type: "application/pdf",
      });
      if (!navigator.canShare({ files: [file] })) {
        openWhatsAppFallback();
        return;
      }

      await navigator.share({
        files: [file],
        text: message,
        title: `Orçamento - ${formatOrderNumber(props.orderNumber)}`,
      });
      setFeedback({ message: "Orçamento compartilhado.", tone: "success" });
    } catch (error) {
      if (!isShareCancellation(error)) {
        setFeedback({
          message: "Não foi possível preparar o orçamento. Tente novamente.",
          tone: "error",
        });
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap justify-end gap-2">
        <a
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border bg-white px-4 text-sm font-semibold text-[var(--ink)] transition-colors hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2"
          download={props.fileName}
          href={props.quoteUrl}
        >
          <FileDown aria-hidden="true" className="size-4" />
          Baixar orçamento em PDF
        </a>
        <Button disabled={pending} onClick={shareQuote} type="button">
          {pending ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" />
          ) : (
            <MessageCircle aria-hidden="true" className="size-4" />
          )}
          {pending ? "Preparando orçamento..." : "Compartilhar pelo WhatsApp"}
        </Button>
      </div>
      {feedback && (
        <div className="mt-2 text-right text-sm">
          <p
            className={feedback.tone === "error" ? "text-[var(--danger)]" : "text-[var(--success)]"}
            role={feedback.tone === "error" ? "alert" : "status"}
          >
            {feedback.message}
          </p>
          {feedback.showWhatsAppLink && (
            <a
              className="mt-1 inline-flex min-h-11 items-center font-semibold text-[var(--action)] underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
              href={whatsappUrl}
              rel="noreferrer"
              target="_blank"
            >
              Abrir WhatsApp manualmente
            </a>
          )}
        </div>
      )}
    </div>
  );
}
