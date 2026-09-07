import {
  BadgeCheck,
  CarFront,
  ClipboardCheck,
  FileSearch,
  KeyRound,
  PackageCheck,
  ReceiptText,
  Wrench,
} from "lucide-react";

import { formatCpf, formatPhone } from "@/features/clientes/formatters";
import { formatPlate, formatVehicleYear } from "@/features/veiculos/formatters";
import { cn } from "@/lib/utils";
import {
  formatApprovalStatus,
  formatFuelLevel,
  formatMileage,
  formatOrderDate,
  formatOrderMoney,
  formatOrderQuantity,
  formatPaymentMethod,
} from "../formatters";
import type {
  ApprovalStatus,
  ServiceOrderDetails,
  ServiceOrderItem,
} from "../types";

function Section({
  children,
  description,
  icon: Icon,
  title,
}: {
  children: React.ReactNode;
  description?: string;
  icon: typeof CarFront;
  title: string;
}) {
  return (
    <section className="overflow-hidden rounded-xl border bg-white shadow-[0_2px_8px_rgba(16,45,63,0.04)]">
      <div className="flex items-start gap-3 border-b px-4 py-3.5 sm:px-5">
        <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-lg bg-teal-50 text-[var(--action)]">
          <Icon className="size-4.5" />
        </span>
        <div>
          <h2 className="font-display text-lg font-bold text-[var(--brand)]">{title}</h2>
          {description && <p className="text-xs text-[var(--ink-muted)]">{description}</p>}
        </div>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function DetailItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-2xs font-bold uppercase tracking-[0.06em] text-[var(--ink-faint)]">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium text-[var(--ink)]">{value || "Não informado"}</dd>
    </div>
  );
}

function TextBlock({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-[0.05em] text-[var(--ink-faint)]">{label}</h3>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[var(--ink)]">{value || "Não informado"}</p>
    </div>
  );
}

const approvalClasses: Record<ApprovalStatus, string> = {
  pendente: "bg-amber-50 text-[var(--warning)] ring-amber-700/15",
  aprovado: "bg-green-50 text-[var(--success)] ring-green-700/15",
  recusado: "bg-red-50 text-[var(--danger)] ring-red-700/15",
};

function ItemStatus({ status }: { status: ApprovalStatus }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset", approvalClasses[status])}>
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {formatApprovalStatus(status)}
    </span>
  );
}

function BudgetItem({ item }: { item: ServiceOrderItem }) {
  return (
    <li className="grid gap-3 border-b px-3 py-3 last:border-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-[var(--ink)]">{item.description}</p>
          <span className="rounded bg-[var(--surface-subtle)] px-2 py-0.5 text-2xs font-bold uppercase tracking-[0.05em] text-[var(--ink-muted)]">
            {item.type === "servico" ? "Serviço" : "Material"}
          </span>
          {item.executedAt && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--success)]">
              <BadgeCheck aria-hidden="true" className="size-3.5" /> Executado
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-[var(--ink-muted)]">
          {formatOrderQuantity(item.quantity)} × {formatOrderMoney(item.unitPrice)}
        </p>
      </div>
      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <ItemStatus status={item.approvalStatus} />
        <p className="min-w-24 text-right font-display text-base font-bold tabular-nums text-[var(--brand)]">{formatOrderMoney(item.subtotal)}</p>
      </div>
    </li>
  );
}

export function OrderDetail({
  diagnosisForm,
  order,
}: {
  diagnosisForm?: React.ReactNode;
  order: ServiceOrderDetails;
}) {
  const items = order.items.filter((item) => !item.removedAt);
  const approvedItems = items.filter((item) => item.approvalStatus === "aprovado");
  const executedItems = approvedItems.filter((item) => item.executedAt);
  const pendingExecution = approvedItems.length - executedItems.length;

  return (
    <div className="space-y-3">
      <Section description="Conferência registrada no recebimento" icon={CarFront} title="Entrada do veículo">
        <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DetailItem label="Cliente" value={order.clientName} />
          <DetailItem label="CPF" value={formatCpf(order.clientCpf)} />
          <DetailItem label="Telefone" value={formatPhone(order.clientPhone)} />
          <DetailItem label="Veículo" value={`${order.vehicleBrand} ${order.vehicleModel}`} />
          <DetailItem label="Placa" value={formatPlate(order.vehiclePlate)} />
          <DetailItem label="Ano fabricação/modelo" value={formatVehicleYear(order.vehicleManufactureYear, order.vehicleModelYear)} />
          <DetailItem label="Quilometragem" value={formatMileage(order.mileage)} />
          <DetailItem label="Combustível" value={formatFuelLevel(order.fuelLevel)} />
        </dl>
        <div className="mt-5 grid gap-4 border-t pt-4 lg:grid-cols-2">
          <TextBlock label="Relato do cliente" value={order.customerComplaint} />
          <TextBlock label="Observações internas" value={order.intakeNotes} />
          <TextBlock label="Acessórios deixados" value={order.accessories} />
          <TextBlock label="Avarias visíveis" value={order.visibleDamage} />
        </div>
      </Section>

      <Section description="Análises técnicas registradas pela equipe" icon={FileSearch} title="Diagnóstico">
        {diagnosisForm}
        {order.diagnoses.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-[var(--surface-subtle)] px-4 py-7 text-center">
            <p className="text-sm font-semibold text-[var(--brand)]">Diagnóstico ainda não registrado.</p>
            <p className="mt-1 text-xs text-[var(--ink-muted)]">A análise técnica será incluída na próxima etapa do atendimento.</p>
          </div>
        ) : (
          <ol className="space-y-3">
            {order.diagnoses.map((diagnosis, index) => (
              <li className="rounded-lg border p-3.5" key={diagnosis.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-bold uppercase tracking-[0.05em] text-[var(--action)]">{index === 0 ? "Diagnóstico atual" : "Diagnóstico anterior"}</p>
                  <p className="text-xs text-[var(--ink-muted)]">Por {diagnosis.authorName} · {formatOrderDate(diagnosis.createdAt)}</p>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--ink)]">{diagnosis.description}</p>
                {diagnosis.notes && <p className="mt-2 rounded-md bg-[var(--surface-subtle)] px-3 py-2 text-sm leading-6 text-[var(--ink-muted)]">{diagnosis.notes}</p>}
              </li>
            ))}
          </ol>
        )}
      </Section>

      <Section description="Serviços, materiais e decisões do cliente" icon={ReceiptText} title="Orçamento e autorizações">
        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-[var(--surface-subtle)] px-4 py-7 text-center">
            <p className="text-sm font-semibold text-[var(--brand)]">Orçamento ainda não iniciado.</p>
            <p className="mt-1 text-xs text-[var(--ink-muted)]">Serviços e materiais serão adicionados após o diagnóstico.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <ul>{items.map((item) => <BudgetItem item={item} key={item.id} />)}</ul>
          </div>
        )}
        <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg bg-[var(--surface-subtle)] px-3 py-3"><DetailItem label="Serviços" value={formatOrderMoney(order.servicesSubtotal)} /></div>
          <div className="rounded-lg bg-[var(--surface-subtle)] px-3 py-3"><DetailItem label="Materiais" value={formatOrderMoney(order.materialsSubtotal)} /></div>
          <div className="rounded-lg bg-[var(--surface-subtle)] px-3 py-3"><DetailItem label="Total orçado" value={formatOrderMoney(order.quotedTotal)} /></div>
          <div className="rounded-lg border border-teal-100 bg-teal-50 px-3 py-3"><DetailItem label="Total autorizado" value={formatOrderMoney(order.authorizedTotal)} /></div>
        </dl>
        {order.discount > 0 && <p className="mt-3 text-right text-sm text-[var(--ink-muted)]">Desconto aplicado: <strong className="text-[var(--ink)]">{formatOrderMoney(order.discount)}</strong></p>}
      </Section>

      <Section description="Acompanhamento dos itens autorizados" icon={Wrench} title="Execução">
        {approvedItems.length === 0 ? (
          <p className="rounded-lg border border-dashed bg-[var(--surface-subtle)] px-4 py-6 text-center text-sm font-semibold text-[var(--brand)]">Nenhum item autorizado para execução.</p>
        ) : pendingExecution > 0 ? (
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950">
            <Wrench aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">{pendingExecution} {pendingExecution === 1 ? "item autorizado aguardando execução." : "itens autorizados aguardando execução."}</p>
              <p className="mt-0.5 text-xs">{executedItems.length} de {approvedItems.length} concluído{approvedItems.length === 1 ? "" : "s"}.</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-[var(--success)]">
            <PackageCheck aria-hidden="true" className="size-5 shrink-0" />
            <p className="text-sm font-semibold">Todos os itens autorizados foram executados.</p>
          </div>
        )}
      </Section>

      <Section description="Encerramento e forma de pagamento" icon={KeyRound} title="Entrega">
        {!order.delivery ? (
          <p className="rounded-lg border border-dashed bg-[var(--surface-subtle)] px-4 py-6 text-center text-sm font-semibold text-[var(--brand)]">Entrega ainda não registrada.</p>
        ) : (
          <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <DetailItem label="Entregue em" value={formatOrderDate(order.delivery.deliveredAt)} />
            <DetailItem label="Forma de pagamento" value={formatPaymentMethod(order.delivery.paymentMethod)} />
            <DetailItem label="Registrado por" value={order.delivery.authorName} />
            <div className="sm:col-span-2 xl:col-span-3"><DetailItem label="Observações" value={order.delivery.notes} /></div>
          </dl>
        )}
      </Section>

      <section className="rounded-xl border bg-white px-4 py-3 text-xs text-[var(--ink-muted)]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p><ClipboardCheck aria-hidden="true" className="mr-1.5 inline size-4 text-[var(--action)]" />Criada por {order.createdByName} em {formatOrderDate(order.createdAt)}</p>
          <p>Última alteração por {order.updatedByName} · versão {order.version}</p>
        </div>
      </section>
    </div>
  );
}
