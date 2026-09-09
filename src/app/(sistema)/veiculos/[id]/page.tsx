import {
  ArrowLeft,
  ArrowRightLeft,
  CalendarClock,
  CarFront,
  FileText,
  Fuel,
  Pencil,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { VehicleStatusAction } from "@/features/veiculos/components/vehicle-status-action";
import { VehicleTransferForm } from "@/features/veiculos/components/vehicle-transfer-form";
import {
  formatFuel,
  formatPlate,
  formatVehicleDate,
  formatVehicleYear,
} from "@/features/veiculos/formatters";
import {
  getVehicleById,
  listActiveClientOptions,
  listVehicleOwnerHistory,
} from "@/features/veiculos/queries";
import { requirePermission } from "@/lib/auth/guards";

function DetailItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-[0.05em] text-[var(--ink-faint)]">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-medium text-[var(--ink)]">
        {value || "Não informado"}
      </dd>
    </div>
  );
}

function Section({
  children,
  icon: Icon,
  title,
}: {
  children: React.ReactNode;
  icon: typeof CarFront;
  title: string;
}) {
  return (
    <section className="overflow-hidden rounded-xl border bg-white shadow-[0_2px_8px_rgba(16,45,63,0.04)]">
      <div className="flex items-center gap-3 border-b px-4 py-3.5">
        <Icon aria-hidden="true" className="size-5 text-[var(--action)]" />
        <h2 className="font-display text-lg font-bold text-[var(--brand)]">
          {title}
        </h2>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function VehicleDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePermission("veiculos:consultar");
  const [{ id }, messages] = await Promise.all([params, searchParams]);
  const vehicle = await getVehicleById(id);
  if (!vehicle) notFound();

  const [history, clients] = await Promise.all([
    listVehicleOwnerHistory(id),
    listActiveClientOptions(),
  ]);
  const successMessage = firstValue(messages.criado)
    ? "Veículo cadastrado com sucesso."
    : firstValue(messages.atualizado)
      ? "Dados do veículo atualizados com sucesso."
      : firstValue(messages.transferido)
        ? "Proprietário transferido e histórico registrado com sucesso."
        : firstValue(messages.situacao) === "inativado"
          ? "Veículo inativado. O histórico foi preservado."
          : firstValue(messages.situacao) === "reativado"
            ? "Veículo reativado com sucesso."
            : null;

  return (
    <AppShell
      currentPath={`/veiculos/${id}`}
      description="Consulte os dados e o histórico de proprietários"
      title="Detalhes do veículo"
      user={user}
    >
      <div className="min-h-[calc(100dvh-5.35rem)] px-3 py-3 sm:px-5 lg:px-6">
        <div className="mx-auto max-w-6xl">
          {successMessage && (
            <p
              className="mb-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-[var(--success)]"
              role="status"
            >
              {successMessage}
            </p>
          )}
          {firstValue(messages.erro) && (
            <p
              className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-[var(--danger)]"
              role="alert"
            >
              Não foi possível alterar a situação do veículo.
            </p>
          )}

          <section className="mb-3 flex flex-col gap-4 rounded-xl border bg-white p-4 shadow-[0_2px_8px_rgba(16,45,63,0.04)] sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span
                aria-hidden="true"
                className="grid size-12 shrink-0 place-items-center rounded-full bg-teal-50 text-[var(--action)]"
              >
                <CarFront className="size-5" />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-2xl font-bold tracking-[0.04em] text-[var(--brand)]">
                    {formatPlate(vehicle.plate)}
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                      vehicle.active
                        ? "bg-green-50 text-[var(--success)]"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className="size-1.5 rounded-full bg-current"
                    />
                    {vehicle.active ? "Ativo" : "Inativo"}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-[var(--ink-muted)]">
                  {vehicle.brand} {vehicle.model} ·{" "}
                  {formatVehicleYear(
                    vehicle.manufactureYear,
                    vehicle.modelYear,
                  )}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border bg-white px-4 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
                href={`/veiculos/${vehicle.id}/editar`}
              >
                <Pencil aria-hidden="true" className="size-4" /> Editar
              </Link>
              <VehicleStatusAction
                currentActive={vehicle.active}
                vehicleId={vehicle.id}
              />
            </div>
          </section>

          <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)]">
            <div className="space-y-3">
              <Section icon={CarFront} title="Dados do veículo">
                <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <DetailItem label="Placa" value={formatPlate(vehicle.plate)} />
                  <DetailItem label="Marca" value={vehicle.brand} />
                  <DetailItem label="Modelo" value={vehicle.model} />
                  <DetailItem
                    label="Ano fabricação/modelo"
                    value={formatVehicleYear(
                      vehicle.manufactureYear,
                      vehicle.modelYear,
                    )}
                  />
                  <DetailItem label="Cor" value={vehicle.color} />
                  <DetailItem label="Combustível" value={formatFuel(vehicle.fuel)} />
                </dl>
              </Section>

              <Section icon={UserRound} title="Proprietário atual">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-[var(--ink)]">
                      {vehicle.ownerName}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
                      Vínculo atual do veículo
                    </p>
                  </div>
                  <Link
                    className="inline-flex min-h-11 items-center justify-center rounded-lg border px-4 text-sm font-semibold text-[var(--brand)] hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
                    href={`/clientes/${vehicle.ownerId}`}
                  >
                    Ver cliente
                  </Link>
                </div>
              </Section>

              <Section icon={FileText} title="Observações">
                <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--ink)]">
                  {vehicle.notes || "Nenhuma observação registrada."}
                </p>
              </Section>

              <Section icon={CalendarClock} title="Registro">
                <dl className="grid gap-4 sm:grid-cols-2">
                  <DetailItem
                    label="Cadastrado em"
                    value={formatVehicleDate(vehicle.createdAt)}
                  />
                  <DetailItem
                    label="Atualizado em"
                    value={formatVehicleDate(vehicle.updatedAt)}
                  />
                </dl>
              </Section>
            </div>

            <div className="space-y-3">
              <Section icon={ArrowRightLeft} title="Transferir proprietário">
                <p className="mb-3 text-sm leading-6 text-[var(--ink-muted)]">
                  A transferência preserva os atendimentos anteriores e registra
                  quem realizou a alteração.
                </p>
                <VehicleTransferForm
                  clients={clients}
                  currentOwnerId={vehicle.ownerId}
                  vehicleId={vehicle.id}
                />
              </Section>

              <Section icon={UserRound} title="Histórico de proprietários">
                {history.length === 0 ? (
                  <div className="rounded-lg border border-dashed bg-[var(--surface-subtle)] px-4 py-6 text-center">
                    <p className="text-sm font-semibold text-[var(--brand)]">
                      Nenhuma transferência registrada
                    </p>
                    <p className="mt-1 text-xs text-[var(--ink-muted)]">
                      O proprietário inicial consta no cadastro do veículo.
                    </p>
                  </div>
                ) : (
                  <ol className="space-y-3">
                    {history.map((entry) => (
                      <li className="rounded-lg border p-3" key={entry.id}>
                        <div className="flex gap-2">
                          <ArrowRightLeft
                            aria-hidden="true"
                            className="mt-0.5 size-4 shrink-0 text-[var(--action)]"
                          />
                          <div className="min-w-0 text-sm">
                            <p className="font-semibold text-[var(--ink)]">
                              {entry.previousOwnerName} → {entry.newOwnerName}
                            </p>
                            <p className="mt-1 text-xs leading-5 text-[var(--ink-muted)]">
                              Por {entry.changedByName} em{" "}
                              {formatVehicleDate(entry.transferredAt)}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </Section>

              <section className="rounded-xl border border-dashed bg-white p-4 text-sm text-[var(--ink-muted)]">
                <div className="flex gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-sky-50 text-sky-700">
                    <Fuel aria-hidden="true" className="size-4" />
                  </span>
                  <div>
                    <h2 className="font-semibold text-[var(--brand)]">
                      Histórico de manutenção
                    </h2>
                    <p className="mt-1 leading-5">
                      Quilometragens e serviços aparecerão aqui quando as ordens
                      de serviço forem implementadas.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </div>

          <Link
            className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-[var(--brand)] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
            href="/veiculos"
          >
            <ArrowLeft aria-hidden="true" className="size-4" /> Voltar para
            veículos
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
