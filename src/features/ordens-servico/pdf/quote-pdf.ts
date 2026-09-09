import {
  PDFDocument,
  PageSizes,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFImage,
  type PDFPage,
} from "pdf-lib";

import { formatCpf, formatPhone } from "@/features/clientes/formatters";
import { formatPlate, formatVehicleYear } from "@/features/veiculos/formatters";
import {
  formatOrderMoney,
  formatOrderNumber,
  formatOrderQuantity,
} from "../formatters";
import type { ServiceOrderDetails } from "../types";

const [PAGE_WIDTH, PAGE_HEIGHT] = PageSizes.A4;
const MARGIN = 40;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const FOOTER_Y = 24;

const colors = {
  brand: rgb(0.035, 0.19, 0.4),
  action: rgb(0.055, 0.47, 0.43),
  actionDark: rgb(0.035, 0.36, 0.33),
  border: rgb(0.77, 0.82, 0.86),
  ink: rgb(0.09, 0.15, 0.19),
  muted: rgb(0.34, 0.41, 0.45),
  paleBlue: rgb(0.94, 0.97, 0.99),
  paleTeal: rgb(0.92, 0.98, 0.97),
  white: rgb(1, 1, 1),
};

type QuotePdfOptions = {
  generatedAt?: Date;
  logoBytes?: Uint8Array;
};

function safeText(value: string) {
  return value
    .replace(/[\u2010-\u2015]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\u2026/g, "...")
    .replace(/\u00a0/g, " ");
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const paragraphs = safeText(text).split(/\r?\n/);
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push("");
      continue;
    }

    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        line = candidate;
        continue;
      }

      if (line) lines.push(line);
      if (font.widthOfTextAtSize(word, size) <= maxWidth) {
        line = word;
        continue;
      }

      let fragment = "";
      for (const character of word) {
        const next = fragment + character;
        if (font.widthOfTextAtSize(next, size) > maxWidth && fragment) {
          lines.push(fragment);
          fragment = character;
        } else {
          fragment = next;
        }
      }
      line = fragment;
    }
    if (line) lines.push(line);
  }

  return lines;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function drawRightAlignedText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  width: number,
  font: PDFFont,
  size: number,
  color = colors.ink,
) {
  const safe = safeText(text);
  page.drawText(safe, {
    x: x + width - font.widthOfTextAtSize(safe, size),
    y,
    font,
    size,
    color,
  });
}

export function quotePdfFilename(orderNumber: number) {
  return `orcamento-os-${String(orderNumber).padStart(4, "0")}.pdf`;
}

export async function createQuotePdf(
  order: ServiceOrderDetails,
  options: QuotePdfOptions = {},
) {
  const generatedAt = options.generatedAt ?? new Date();
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let logo: PDFImage | undefined;

  if (options.logoBytes) {
    logo = await pdf.embedPng(new Uint8Array(options.logoBytes));
  }

  pdf.setTitle(`Orçamento - ${formatOrderNumber(order.number)}`);
  pdf.setAuthor("Mundo Ar Climatização");
  pdf.setSubject("Orçamento de serviços automotivos");
  pdf.setCreator("Sistema de Gestão da Oficina");
  pdf.setProducer("Mundo Ar Climatização");
  pdf.setCreationDate(generatedAt);

  const pages: PDFPage[] = [];
  let page = pdf.addPage(PageSizes.A4);
  let y = PAGE_HEIGHT - MARGIN;
  pages.push(page);

  const startContinuationPage = () => {
    page = pdf.addPage(PageSizes.A4);
    pages.push(page);
    page.drawRectangle({
      x: MARGIN,
      y: PAGE_HEIGHT - MARGIN - 4,
      width: CONTENT_WIDTH,
      height: 4,
      color: colors.action,
    });
    page.drawText("MUNDO AR CLIMATIZAÇÃO", {
      x: MARGIN,
      y: PAGE_HEIGHT - MARGIN - 24,
      font: bold,
      size: 10,
      color: colors.brand,
    });
    drawRightAlignedText(
      page,
      formatOrderNumber(order.number),
      MARGIN,
      PAGE_HEIGHT - MARGIN - 24,
      CONTENT_WIDTH,
      bold,
      10,
      colors.brand,
    );
    y = PAGE_HEIGHT - MARGIN - 48;
  };

  const ensureSpace = (height: number) => {
    if (y - height < FOOTER_Y + 28) startContinuationPage();
  };

  const drawSectionTitle = (title: string) => {
    ensureSpace(30);
    page.drawRectangle({
      x: MARGIN,
      y: y - 25,
      width: CONTENT_WIDTH,
      height: 25,
      color: colors.paleBlue,
      borderColor: colors.border,
      borderWidth: 0.7,
    });
    page.drawText(safeText(title), {
      x: MARGIN + 11,
      y: y - 17,
      font: bold,
      size: 10,
      color: colors.brand,
    });
    y -= 25;
  };

  const drawParagraphSection = (title: string, text: string) => {
    const lines = wrapText(text || "Não informado", regular, 9, CONTENT_WIDTH - 22);
    const bodyHeight = Math.max(34, lines.length * 12 + 16);
    ensureSpace(25 + bodyHeight + 12);
    drawSectionTitle(title);
    page.drawRectangle({
      x: MARGIN,
      y: y - bodyHeight,
      width: CONTENT_WIDTH,
      height: bodyHeight,
      color: colors.white,
      borderColor: colors.border,
      borderWidth: 0.7,
    });
    lines.forEach((line, index) => {
      page.drawText(line, {
        x: MARGIN + 11,
        y: y - 17 - index * 12,
        font: regular,
        size: 9,
        color: colors.ink,
      });
    });
    y -= bodyHeight + 12;
  };

  if (logo) {
    const scale = Math.min(88 / logo.width, 88 / logo.height);
    const width = logo.width * scale;
    const height = logo.height * scale;
    page.drawImage(logo, {
      x: MARGIN,
      y: PAGE_HEIGHT - MARGIN - height,
      width,
      height,
    });
  } else {
    page.drawText("MUNDO AR", {
      x: MARGIN,
      y: PAGE_HEIGHT - 75,
      font: bold,
      size: 18,
      color: colors.brand,
    });
    page.drawText("Climatização", {
      x: MARGIN,
      y: PAGE_HEIGHT - 92,
      font: regular,
      size: 10,
      color: colors.action,
    });
  }

  page.drawText("ORÇAMENTO", {
    x: PAGE_WIDTH - MARGIN - 180,
    y: PAGE_HEIGHT - 69,
    font: bold,
    size: 23,
    color: colors.brand,
  });
  page.drawLine({
    start: { x: PAGE_WIDTH - MARGIN - 180, y: PAGE_HEIGHT - 76 },
    end: { x: PAGE_WIDTH - MARGIN, y: PAGE_HEIGHT - 76 },
    thickness: 1.5,
    color: colors.action,
  });
  drawRightAlignedText(
    page,
    formatOrderNumber(order.number),
    PAGE_WIDTH - MARGIN - 180,
    PAGE_HEIGHT - 97,
    180,
    bold,
    13,
    colors.brand,
  );
  drawRightAlignedText(
    page,
    `Data: ${formatDate(generatedAt)}`,
    PAGE_WIDTH - MARGIN - 180,
    PAGE_HEIGHT - 114,
    180,
    regular,
    9,
    colors.muted,
  );
  y = PAGE_HEIGHT - 142;

  const boxGap = 12;
  const boxWidth = (CONTENT_WIDTH - boxGap) / 2;
  const boxHeight = 78;
  const drawInfoBox = (
    x: number,
    title: string,
    values: Array<[string, string]>,
  ) => {
    page.drawRectangle({
      x,
      y: y - boxHeight,
      width: boxWidth,
      height: boxHeight,
      borderColor: colors.border,
      borderWidth: 0.7,
      color: colors.white,
    });
    page.drawRectangle({
      x,
      y: y - 23,
      width: boxWidth,
      height: 23,
      color: colors.paleBlue,
    });
    page.drawText(title, {
      x: x + 10,
      y: y - 16,
      font: bold,
      size: 9,
      color: colors.brand,
    });
    values.forEach(([label, value], index) => {
      page.drawText(`${label}:`, {
        x: x + 10,
        y: y - 39 - index * 14,
        font: bold,
        size: 8.5,
        color: colors.ink,
      });
      const labelWidth = bold.widthOfTextAtSize(`${label}: `, 8.5);
      const available = boxWidth - 20 - labelWidth;
      const displayValue = wrapText(value, regular, 8.5, available)[0] ?? "";
      page.drawText(displayValue, {
        x: x + 10 + labelWidth,
        y: y - 39 - index * 14,
        font: regular,
        size: 8.5,
        color: colors.ink,
      });
    });
  };

  drawInfoBox(MARGIN, "DADOS DO CLIENTE", [
    ["Cliente", order.clientName],
    ["CPF", formatCpf(order.clientCpf)],
    ["Telefone", formatPhone(order.clientPhone)],
  ]);
  drawInfoBox(MARGIN + boxWidth + boxGap, "VEÍCULO", [
    ["Modelo", `${order.vehicleBrand} ${order.vehicleModel}`],
    ["Placa", formatPlate(order.vehiclePlate)],
    [
      "Ano",
      formatVehicleYear(order.vehicleManufactureYear, order.vehicleModelYear),
    ],
  ]);
  y -= boxHeight + 12;

  drawParagraphSection("RELATO DO CLIENTE", order.customerComplaint);
  drawParagraphSection(
    "DIAGNÓSTICO TÉCNICO",
    order.diagnoses[0]?.description ?? "Diagnóstico ainda não registrado.",
  );

  const activeItems = order.items.filter((item) => !item.removedAt);
  const descriptionWidth = 255;
  const quantityWidth = 58;
  const unitWidth = 96;
  const subtotalWidth = CONTENT_WIDTH - descriptionWidth - quantityWidth - unitWidth;

  const drawTableHeader = (continued = false) => {
    drawSectionTitle(
      continued
        ? "SERVIÇOS E MATERIAIS - CONTINUAÇÃO"
        : "SERVIÇOS E MATERIAIS",
    );
    const labels = ["Descrição", "Qtd.", "Valor unit.", "Subtotal"];
    const widths = [descriptionWidth, quantityWidth, unitWidth, subtotalWidth];
    let x = MARGIN;
    widths.forEach((width, index) => {
      page.drawRectangle({
        x,
        y: y - 23,
        width,
        height: 23,
        color: colors.brand,
        borderColor: colors.white,
        borderWidth: 0.25,
      });
      const label = labels[index];
      const textWidth = bold.widthOfTextAtSize(label, 8.5);
      page.drawText(label, {
        x: index === 0 ? x + 8 : x + (width - textWidth) / 2,
        y: y - 16,
        font: bold,
        size: 8.5,
        color: colors.white,
      });
      x += width;
    });
    y -= 23;
  };

  ensureSpace(72);
  drawTableHeader();

  activeItems.forEach((item) => {
    const descriptionLines = wrapText(item.description, regular, 8.5, descriptionWidth - 16);
    const rowHeight = Math.max(29, descriptionLines.length * 11 + 12);
    if (y - rowHeight < FOOTER_Y + 32) {
      startContinuationPage();
      drawTableHeader(true);
    }

    const widths = [descriptionWidth, quantityWidth, unitWidth, subtotalWidth];
    let x = MARGIN;
    widths.forEach((width) => {
      page.drawRectangle({
        x,
        y: y - rowHeight,
        width,
        height: rowHeight,
        color: colors.white,
        borderColor: colors.border,
        borderWidth: 0.5,
      });
      x += width;
    });
    descriptionLines.forEach((line, index) => {
      page.drawText(line, {
        x: MARGIN + 8,
        y: y - 18 - index * 11,
        font: regular,
        size: 8.5,
        color: colors.ink,
      });
    });
    const baseline = y - rowHeight / 2 - 3;
    drawRightAlignedText(
      page,
      formatOrderQuantity(item.quantity),
      MARGIN + descriptionWidth,
      baseline,
      quantityWidth - 8,
      regular,
      8.5,
    );
    drawRightAlignedText(
      page,
      formatOrderMoney(item.unitPrice),
      MARGIN + descriptionWidth + quantityWidth,
      baseline,
      unitWidth - 8,
      regular,
      8.5,
    );
    drawRightAlignedText(
      page,
      formatOrderMoney(item.subtotal),
      MARGIN + descriptionWidth + quantityWidth + unitWidth,
      baseline,
      subtotalWidth - 8,
      bold,
      8.5,
    );
    y -= rowHeight;
  });
  y -= 14;

  ensureSpace(126);
  const totalsX = MARGIN + 205;
  const totalsWidth = CONTENT_WIDTH - 205;
  const totalRows: Array<[string, string, boolean]> = [
    ["Serviços", formatOrderMoney(order.servicesSubtotal), false],
    ["Materiais", formatOrderMoney(order.materialsSubtotal), false],
    ["Desconto", formatOrderMoney(order.discount), false],
    ["TOTAL ORÇADO", formatOrderMoney(order.quotedTotal), true],
  ];
  totalRows.forEach(([label, value, strong]) => {
    const height = strong ? 28 : 22;
    if (strong) {
      page.drawRectangle({
        x: totalsX,
        y: y - height,
        width: totalsWidth,
        height,
        color: colors.action,
      });
    } else {
      page.drawLine({
        start: { x: totalsX, y: y - height },
        end: { x: totalsX + totalsWidth, y: y - height },
        thickness: 0.5,
        color: colors.border,
      });
    }
    page.drawText(label, {
      x: totalsX + 8,
      y: y - height + (strong ? 9 : 7),
      font: bold,
      size: strong ? 10.5 : 8.5,
      color: strong ? colors.white : colors.ink,
    });
    drawRightAlignedText(
      page,
      value,
      totalsX,
      y - height + (strong ? 9 : 7),
      totalsWidth - 8,
      bold,
      strong ? 10.5 : 8.5,
      strong ? colors.white : colors.ink,
    );
    y -= height;
  });
  y -= 14;

  ensureSpace(58);
  page.drawRectangle({
    x: MARGIN,
    y: y - 48,
    width: CONTENT_WIDTH,
    height: 48,
    color: colors.paleTeal,
    borderColor: colors.actionDark,
    borderWidth: 0.7,
  });
  page.drawText("OBSERVAÇÃO", {
    x: MARGIN + 11,
    y: y - 17,
    font: bold,
    size: 9,
    color: colors.actionDark,
  });
  page.drawText("A execução dos serviços depende da aprovação do cliente.", {
    x: MARGIN + 11,
    y: y - 35,
    font: regular,
    size: 8.5,
    color: colors.ink,
  });

  pages.forEach((currentPage, index) => {
    currentPage.drawLine({
      start: { x: MARGIN, y: FOOTER_Y + 13 },
      end: { x: PAGE_WIDTH - MARGIN, y: FOOTER_Y + 13 },
      thickness: 0.6,
      color: colors.actionDark,
    });
    currentPage.drawText("Documento gerado pelo Sistema de Gestão da Oficina", {
      x: MARGIN,
      y: FOOTER_Y,
      font: regular,
      size: 7.5,
      color: colors.muted,
    });
    drawRightAlignedText(
      currentPage,
      `Página ${index + 1} de ${pages.length}`,
      MARGIN,
      FOOTER_Y,
      CONTENT_WIDTH,
      regular,
      7.5,
      colors.muted,
    );
  });

  return pdf.save();
}
