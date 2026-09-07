import { ArrowLeft, RefreshCw, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { ApprovalPanel } from "@/features/ordens-servico/components/approval-panel";
import { OrderDetail } from "@/features/ordens-servico/components/order-detail";
import { DiagnosisForm } from "@/features/ordens-servico/components/diagnosis-form";
import { OrderSummary } from "@/features/ordens-servico/components/order-summary";
import { OrderStatusAction } from "@/features/ordens-servico/components/status-action";
import { OrderTimeline } from "@/features/ordens-servico/components/timeline";
import { QuoteEditor } from "@/features/ordens-servico/components/quote-editor";
import {
  getServiceOrderById,
  listActiveOrderServices,
} from "@/features/ordens-servico/queries";
import { requirePermission } from "@/lib/auth/guards";

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function ServiceOrderDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePermission("ordens:consultar");
  const [{ id }, messages] = await Promise.all([params, searchParams]);
  const order = await getServiceOrderById(id);
  if (!order) notFound();
  const canEditQuote =
    order.status === "em_diagnostico" ||
    order.status === "aguardando_aprovacao";
  const services = canEditQuote ? await listActiveOrderServices() : [];

  return (
    <AppShell
      currentPath={`/ordens-servico/${id}`}
      description="Consulte todas as etapas e registros do atendimento"
      title="Detalhes da ordem de serviço"
      user={user}
    >
      <div className="min-h-[calc(100dvh-5.35rem)] px-3 py-3 sm:px-5 lg:px-6">
        <div className="mx-auto max-w-[100rem]">
          {firstValue(messages.criada) && (
            <p className="mb-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-[var(--success)]" role="status">
              Ordem de serviço aberta com sucesso.
            </p>
          )}
          {firstValue(messages.situacao) === "em_diagnostico" && (
            <p className="mb-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-[var(--success)]" role="status">
              Diagnóstico iniciado. Registre agora a análise técnica do veículo.
            </p>
          )}
          {firstValue(messages.situacao) === "aguardando_aprovacao" && (
            <p className="mb-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-[var(--success)]" role="status">
              Orçamento enviado. Registre a resposta do cliente para cada item.
            </p>
          )}
          {firstValue(messages.diagnostico) === "salvo" && (
            <p className="mb-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-[var(--success)]" role="status">
              Diagnóstico técnico salvo e histórico atualizado.
            </p>
          )}
          {firstValue(messages.orcamento) && (
            <p className="mb-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-[var(--success)]" role="status">
              {firstValue(messages.orcamento) === "item-adicionado" && "Item adicionado ao orçamento."}
              {firstValue(messages.orcamento) === "item-atualizado" && "Item do orçamento atualizado."}
              {firstValue(messages.orcamento) === "item-removido" && "Item removido do orçamento."}
              {firstValue(messages.orcamento) === "desconto-aplicado" && "Desconto do orçamento atualizado."}
            </p>
          )}
          {firstValue(messages.aprovacao) === "registrada" && (
            <p className="mb-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-[var(--success)]" role="status">
              Resposta do cliente registrada e totais atualizados.
            </p>
          )}
          {firstValue(messages.conflito) && (
            <div className="mb-3 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-950" role="alert">
              <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
              <div>
                <p className="text-sm font-semibold">Esta ordem foi alterada por outro usuário.</p>
                <p className="mt-0.5 text-xs">Recarregue os dados antes de tentar novamente.</p>
              </div>
              <Link className="ml-auto inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg border border-amber-300 bg-white px-3 text-sm font-semibold hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]" href={`/ordens-servico/${id}`}>
                <RefreshCw aria-hidden="true" className="size-4" /> Recarregar
              </Link>
            </div>
          )}

          <OrderSummary
            action={
              order.status === "aberta" || order.status === "em_diagnostico" ? (
                <OrderStatusAction
                  orderId={order.id}
                  status={order.status}
                  version={order.version}
                />
              ) : undefined
            }
            order={order}
          />

          <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,1.7fr)_minmax(19rem,0.7fr)]">
            <OrderDetail
              approvalPanel={
                order.status === "aguardando_aprovacao" ? (
                  <ApprovalPanel
                    items={order.items}
                    orderId={order.id}
                    respondedAtDefault={new Date().toISOString()}
                    version={order.version}
                  />
                ) : undefined
              }
              diagnosisForm={
                order.status === "em_diagnostico" ? (
                  <DiagnosisForm
                    expectedCompletionAt={order.expectedCompletionAt}
                    orderId={order.id}
                    version={order.version}
                  />
                ) : undefined
              }
              order={order}
              quoteEditor={
                canEditQuote ? (
                  <QuoteEditor
                    discount={order.discount}
                    hasDiagnosis={order.diagnoses.length > 0}
                    items={order.items}
                    materialsSubtotal={order.materialsSubtotal}
                    orderId={order.id}
                    quotedTotal={order.quotedTotal}
                    services={services}
                    servicesSubtotal={order.servicesSubtotal}
                    status={order.status}
                    userRole={user.role}
                    version={order.version}
                  />
                ) : undefined
              }
            />
            <OrderTimeline events={order.history} />
          </div>

          <Link className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-[var(--brand)] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]" href="/ordens-servico">
            <ArrowLeft aria-hidden="true" className="size-4" /> Voltar para ordens de serviço
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
