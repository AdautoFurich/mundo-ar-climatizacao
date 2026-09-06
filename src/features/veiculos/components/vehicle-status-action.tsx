"use client";

import { LoaderCircle, Power, RotateCcw } from "lucide-react";
import { useFormStatus } from "react-dom";

import { changeVehicleStatusAction } from "../actions";

function SubmitButton({ active }: { active: boolean }) {
  const { pending } = useFormStatus();
  const Icon = active ? RotateCcw : Power;

  return (
    <button
      className={`inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] disabled:opacity-60 ${
        active
          ? "border-teal-200 bg-teal-50 text-[var(--action)] hover:bg-teal-100"
          : "border-red-200 bg-red-50 text-[var(--danger)] hover:bg-red-100"
      }`}
      disabled={pending}
      type="submit"
    >
      {pending ? (
        <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
      ) : (
        <Icon aria-hidden="true" className="size-4" />
      )}
      {pending
        ? "Atualizando..."
        : active
          ? "Reativar veículo"
          : "Inativar veículo"}
    </button>
  );
}

export function VehicleStatusAction({
  vehicleId,
  currentActive,
}: {
  vehicleId: string;
  currentActive: boolean;
}) {
  const nextActive = !currentActive;
  return (
    <form
      action={changeVehicleStatusAction}
      onSubmit={(event) => {
        const message = nextActive
          ? "Deseja reativar este veículo?"
          : "Deseja inativar este veículo? O histórico será preservado.";
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      <input name="vehicleId" type="hidden" value={vehicleId} />
      <input name="active" type="hidden" value={String(nextActive)} />
      <SubmitButton active={nextActive} />
    </form>
  );
}
