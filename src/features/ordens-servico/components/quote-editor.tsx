"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ChevronDown,
  LoaderCircle,
  PackagePlus,
  Pencil,
  Plus,
  ReceiptText,
  Save,
  Send,
  Tag,
  Trash2,
  Wrench,
} from "lucide-react";
import { startTransition, useActionState, useEffect, useId, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";

import { FormMessage } from "@/components/shared/form-message";
import { Button } from "@/components/ui/button";
import type { UserRole } from "@/features/auth/types";
import { formatServiceCategory } from "@/features/servicos/formatters";
import {
  addOrderItemAction,
  applyOrderDiscountAction,
  removeOrderItemAction,
  updateOrderItemAction,
} from "../actions/items";
import { sendQuoteForApprovalAction } from "../actions/workflow";
import {
  formatApprovalStatus,
  formatOrderMoney,
  formatOrderQuantity,
} from "../formatters";
import {
  orderItemSchema,
  type OrderItemData,
  type OrderItemInput,
} from "../schemas";
import {
  INITIAL_ORDER_ACTION_STATE,
  type OrderServiceOption,
  type OrderStatus,
  type ServiceOrderItem,
} from "../types";

const inputClassName =
  "mt-1.5 min-h-11 w-full rounded-lg border bg-white px-3.5 text-base text-[var(--ink)] outline-none placeholder:text-slate-400 focus:border-[var(--focus)] focus:ring-2 focus:ring-[var(--focus)]/20 aria-[invalid=true]:border-[var(--danger)] aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-red-100";

function moneyInputFromCents(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
}

function moneyInputFromReais(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function quantityInput(value: number) {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 }).format(value);
}

function ErrorText({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-sm text-[var(--danger)]" id={id} role="alert">{message}</p>;
}

function OrderItemForm({
  item,
  orderId,
  services,
  version,
}: {
  item?: ServiceOrderItem;
  orderId: string;
  services: OrderServiceOption[];
  version: number;
}) {
  const prefix = useId().replace(/:/g, "");
  const action = useMemo(
    () =>
      item
        ? updateOrderItemAction.bind(null, orderId, item.id, version)
        : addOrderItemAction.bind(null, orderId, version),
    [item, orderId, version],
  );
  const [state, dispatch, pending] = useActionState(action, INITIAL_ORDER_ACTION_STATE);
  const form = useForm<OrderItemInput, unknown, OrderItemData>({
    resolver: zodResolver(orderItemSchema),
    defaultValues: {
      type: item?.type ?? "servico",
      serviceId: item?.serviceId ?? "",
      description: item?.description ?? "",
      quantity: item ? quantityInput(item.quantity) : "1",
      unitPrice: item ? moneyInputFromCents(item.unitPrice) : "",
    },
    shouldFocusError: true,
  });
  const type = useWatch({ control: form.control, name: "type" });

  useEffect(() => {
    const firstField = Object.keys(state.fieldErrors ?? {})[0];
    if (firstField) form.setFocus(firstField as keyof OrderItemInput);
  }, [form, state.fieldErrors]);

  const errorFor = (field: keyof OrderItemInput) =>
    form.formState.errors[field]?.message?.toString() ?? state.fieldErrors?.[field]?.[0];

  const submit = form.handleSubmit((values) => {
    const data = new FormData();
    data.set("type", values.type);
    data.set("serviceId", values.serviceId ?? "");
    data.set("description", values.description);
    data.set("quantity", quantityInput(values.quantityThousandths / 1000));
    data.set("unitPrice", moneyInputFromCents(values.unitPriceCents));
    startTransition(() => dispatch(data));
  });

  return (
    <form className="grid gap-4" noValidate onSubmit={submit}>
      <FormMessage message={state.message} tone="error" />
      <div className="grid gap-4 lg:grid-cols-2">
        <label className="text-sm font-semibold" htmlFor={`${prefix}-type`}>
          Tipo do item
          <select
            {...form.register("type")}
            className={inputClassName}
            id={`${prefix}-type`}
            onChange={(event) => {
              form.setValue("type", event.target.value as "servico" | "material", {
                shouldValidate: true,
              });
              form.setValue("serviceId", "", { shouldValidate: false });
              if (event.target.value === "material") {
                form.setValue("description", "");
                form.setValue("unitPrice", "");
              }
            }}
          >
            <option value="servico">Serviço do catálogo</option>
            <option value="material">Peça ou material</option>
          </select>
        </label>

        {type === "servico" ? (
          <label className="text-sm font-semibold" htmlFor={`${prefix}-service`}>
            Serviço do catálogo <span className="text-[var(--danger)]">*</span>
            <select
              {...form.register("serviceId")}
              aria-describedby={errorFor("serviceId") ? `${prefix}-service-error` : undefined}
              aria-invalid={Boolean(errorFor("serviceId"))}
              className={inputClassName}
              id={`${prefix}-service`}
              onChange={(event) => {
                const selected = services.find((service) => service.id === event.target.value);
                form.setValue("serviceId", event.target.value, { shouldValidate: true });
                if (selected) {
                  form.setValue("description", selected.name, { shouldValidate: true });
                  form.setValue(
                    "unitPrice",
                    selected.basePrice === null ? "" : moneyInputFromReais(selected.basePrice),
                    { shouldValidate: selected.basePrice !== null },
                  );
                }
              }}
            >
              <option value="">Selecione um serviço</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} · {formatServiceCategory(service.category)}
                  {service.basePrice === null ? " · valor a definir" : ` · ${moneyInputFromReais(service.basePrice)}`}
                </option>
              ))}
            </select>
            <ErrorText id={`${prefix}-service-error`} message={errorFor("serviceId")} />
          </label>
        ) : (
          <div className="rounded-lg border border-dashed bg-white/70 px-3.5 py-3 text-sm text-[var(--ink-muted)]">
            Informe a peça ou o material diretamente. Não haverá controle de estoque nesta versão.
          </div>
        )}

        <label className="text-sm font-semibold lg:col-span-2" htmlFor={`${prefix}-description`}>
          Descrição do item <span className="text-[var(--danger)]">*</span>
          <input
            {...form.register("description")}
            aria-describedby={errorFor("description") ? `${prefix}-description-error` : undefined}
            aria-invalid={Boolean(errorFor("description"))}
            className={inputClassName}
            id={`${prefix}-description`}
            maxLength={200}
            placeholder={type === "servico" ? "Descrição copiada do serviço" : "Ex.: filtro de cabine"}
          />
          <ErrorText id={`${prefix}-description-error`} message={errorFor("description")} />
        </label>

        <label className="text-sm font-semibold" htmlFor={`${prefix}-quantity`}>
          Quantidade <span className="text-[var(--danger)]">*</span>
          <input
            {...form.register("quantity")}
            aria-describedby={errorFor("quantity") ? `${prefix}-quantity-error` : undefined}
            aria-invalid={Boolean(errorFor("quantity"))}
            className={inputClassName}
            id={`${prefix}-quantity`}
            inputMode="decimal"
            placeholder="1"
          />
          <ErrorText id={`${prefix}-quantity-error`} message={errorFor("quantity")} />
        </label>

        <label className="text-sm font-semibold" htmlFor={`${prefix}-price`}>
          Valor unitário <span className="text-[var(--danger)]">*</span>
          <div className="relative">
            <span aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 mt-0.75 -translate-y-1/2 text-sm text-[var(--ink-muted)]">R$</span>
            <input
              {...form.register("unitPrice")}
              aria-describedby={errorFor("unitPrice") ? `${prefix}-price-error` : undefined}
              aria-invalid={Boolean(errorFor("unitPrice"))}
              className={`${inputClassName} pl-10`}
              id={`${prefix}-price`}
              inputMode="decimal"
              placeholder="0,00"
            />
          </div>
          <ErrorText id={`${prefix}-price-error`} message={errorFor("unitPrice")} />
        </label>
      </div>

      <div className="flex justify-end">
        <Button disabled={pending} type="submit">
          {pending ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : item ? <Save aria-hidden="true" className="size-4" /> : <Plus aria-hidden="true" className="size-4" />}
          {pending ? "Salvando item..." : item ? "Salvar alterações" : "Adicionar ao orçamento"}
        </Button>
      </div>
    </form>
  );
}

function RemoveItemButton({ itemId, orderId, version }: { itemId: string; orderId: string; version: number }) {
  const action = useMemo(
    () => removeOrderItemAction.bind(null, orderId, itemId, version),
    [itemId, orderId, version],
  );
  const [state, dispatch, pending] = useActionState(action, INITIAL_ORDER_ACTION_STATE);
  return (
    <form
      action={dispatch}
      onSubmit={(event) => {
        if (!window.confirm("Deseja remover este item do orçamento?")) event.preventDefault();
      }}
    >
      <FormMessage message={state.message} tone="error" />
      <Button aria-label="Remover item" disabled={pending} size="compact" type="submit" variant="ghost">
        {pending ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Trash2 aria-hidden="true" className="size-4" />}
        Remover
      </Button>
    </form>
  );
}

function DiscountForm({ discount, orderId, version }: { discount: number; orderId: string; version: number }) {
  const action = useMemo(() => applyOrderDiscountAction.bind(null, orderId), [orderId]);
  const [state, dispatch, pending] = useActionState(action, INITIAL_ORDER_ACTION_STATE);
  return (
    <form action={dispatch} className="rounded-lg border border-teal-100 bg-teal-50/50 p-4">
      <div className="flex items-center gap-2">
        <Tag aria-hidden="true" className="size-4 text-[var(--action)]" />
        <h3 className="font-display text-base font-bold text-[var(--brand)]">Aplicar desconto</h3>
      </div>
      <p className="mt-1 text-xs text-[var(--ink-muted)]">Alteração exclusiva do administrador.</p>
      <FormMessage message={state.message} tone="error" />
      <input name="expectedVersion" type="hidden" value={version} />
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="min-w-0 flex-1 text-sm font-semibold" htmlFor="order-discount">
          Desconto
          <div className="relative">
            <span aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 mt-0.75 -translate-y-1/2 text-sm text-[var(--ink-muted)]">R$</span>
            <input className={`${inputClassName} pl-10`} defaultValue={moneyInputFromCents(discount)} id="order-discount" inputMode="decimal" name="discount" />
          </div>
        </label>
        <Button disabled={pending} type="submit" variant="secondary">
          {pending ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Save aria-hidden="true" className="size-4" />}
          {pending ? "Aplicando..." : "Aplicar desconto"}
        </Button>
      </div>
    </form>
  );
}

function Total({ label, value, strong = false }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className={strong ? "rounded-lg border border-teal-200 bg-teal-50 px-3 py-3" : "rounded-lg bg-[var(--surface-subtle)] px-3 py-3"}>
      <dt className="text-2xs font-bold uppercase tracking-[0.06em] text-[var(--ink-faint)]">{label}</dt>
      <dd className="mt-1 font-display text-lg font-bold tabular-nums text-[var(--brand)]">{formatOrderMoney(value)}</dd>
    </div>
  );
}

function SendForApproval({
  disabled,
  orderId,
  version,
}: {
  disabled: boolean;
  orderId: string;
  version: number;
}) {
  const action = useMemo(
    () => sendQuoteForApprovalAction.bind(null, orderId, version),
    [orderId, version],
  );
  const [state, dispatch, pending] = useActionState(action, INITIAL_ORDER_ACTION_STATE);
  return (
    <div className="rounded-lg border border-[var(--border)] bg-white p-4">
      <FormMessage message={state.message} tone="error" />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--brand)]">Orçamento pronto?</p>
          <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
            {disabled
              ? "Adicione ao menos um item antes de enviar."
              : "Após o envio, registre a resposta do cliente para cada item."}
          </p>
        </div>
        <form
          action={dispatch}
          onSubmit={(event) => {
            if (!window.confirm("Deseja enviar este orçamento para aprovação do cliente?")) {
              event.preventDefault();
            }
          }}
        >
          <Button disabled={disabled || pending} type="submit">
            {pending ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Send aria-hidden="true" className="size-4" />}
            {pending ? "Enviando..." : "Enviar para aprovação"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export function QuoteEditor({
  discount,
  hasDiagnosis,
  items,
  materialsSubtotal,
  orderId,
  quotedTotal,
  services,
  servicesSubtotal,
  status,
  userRole,
  version,
}: {
  discount: number;
  hasDiagnosis: boolean;
  items: ServiceOrderItem[];
  materialsSubtotal: number;
  orderId: string;
  quotedTotal: number;
  services: OrderServiceOption[];
  servicesSubtotal: number;
  status: OrderStatus;
  userRole: UserRole;
  version: number;
}) {
  const activeItems = items.filter((item) => !item.removedAt);
  return (
    <div className="space-y-4" id="orcamento">
      {status === "aguardando_aprovacao" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950" role="status">
          Alterar um item nesta etapa fará com que ele volte a aguardar a decisão do cliente.
        </div>
      )}

      <section className="rounded-lg border border-teal-100 bg-teal-50/40 p-4">
        <div className="mb-4 flex items-start gap-3">
          <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-[var(--action)] shadow-sm"><PackagePlus className="size-4.5" /></span>
          <div>
            <h3 className="font-display text-lg font-bold text-[var(--brand)]">Adicionar item</h3>
            <p className="text-xs text-[var(--ink-muted)]">Use o catálogo para serviços ou informe peças e materiais manualmente.</p>
          </div>
        </div>
        <OrderItemForm orderId={orderId} services={services} version={version} />
      </section>

      {activeItems.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-[var(--surface-subtle)] px-4 py-7 text-center">
          <ReceiptText aria-hidden="true" className="mx-auto size-6 text-[var(--ink-faint)]" />
          <p className="mt-2 text-sm font-semibold text-[var(--brand)]">Nenhum item adicionado.</p>
          <p className="mt-1 text-xs text-[var(--ink-muted)]">Inclua ao menos um item para formar o orçamento.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {activeItems.map((item) => (
            <li className="overflow-hidden rounded-lg border bg-white" key={item.id}>
              <div className="grid gap-3 px-3.5 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {item.type === "servico" ? <Wrench aria-hidden="true" className="size-4 text-[var(--action)]" /> : <PackagePlus aria-hidden="true" className="size-4 text-[var(--action)]" />}
                    <p className="font-semibold text-[var(--ink)]">{item.description}</p>
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-2xs font-bold text-[var(--warning)] ring-1 ring-inset ring-amber-700/15">{formatApprovalStatus(item.approvalStatus)}</span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--ink-muted)]">{formatOrderQuantity(item.quantity)} × {formatOrderMoney(item.unitPrice)}</p>
                </div>
                <div className="flex items-center justify-between gap-2 sm:justify-end">
                  <p className="min-w-24 text-right font-display text-base font-bold tabular-nums text-[var(--brand)]">{formatOrderMoney(item.subtotal)}</p>
                  <RemoveItemButton itemId={item.id} orderId={orderId} version={version} />
                </div>
              </div>
              <details className="group border-t bg-[var(--surface-subtle)]/60">
                <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-3.5 text-sm font-semibold text-[var(--ink-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--focus)]">
                  <Pencil aria-hidden="true" className="size-4" /> Editar item
                  <ChevronDown aria-hidden="true" className="ml-auto size-4 transition-transform group-open:rotate-180 motion-reduce:transition-none" />
                </summary>
                <div className="border-t p-4"><OrderItemForm item={item} orderId={orderId} services={services} version={version} /></div>
              </details>
            </li>
          ))}
        </ul>
      )}

      <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Total label="Serviços" value={servicesSubtotal} />
        <Total label="Materiais" value={materialsSubtotal} />
        <Total label="Desconto" value={discount} />
        <Total label="Total orçado" strong value={quotedTotal} />
      </dl>

      {userRole === "administrador" && <DiscountForm discount={discount} orderId={orderId} version={version} />}
      {status === "em_diagnostico" && (
        <SendForApproval
          disabled={!hasDiagnosis || activeItems.length === 0}
          orderId={orderId}
          version={version}
        />
      )}
    </div>
  );
}
