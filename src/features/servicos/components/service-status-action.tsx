"use client";

import { LoaderCircle, Power, RotateCcw } from "lucide-react";
import { useFormStatus } from "react-dom";

import { changeServiceStatusAction } from "../actions";

function SubmitButton({ nextActive }: { nextActive: boolean }) {
  const { pending } = useFormStatus();
  const Icon = nextActive ? RotateCcw : Power;

  return (
    <button
      className={`inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] disabled:cursor-not-allowed disabled:opacity-60 ${
        nextActive
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
        : nextActive
          ? "Reativar serviço"
          : "Inativar serviço"}
    </button>
  );
}

export function ServiceStatusAction({
  currentActive,
  serviceId,
}: {
  currentActive: boolean;
  serviceId: string;
}) {
  const nextActive = !currentActive;
  return (
    <form
      action={changeServiceStatusAction}
      onSubmit={(event) => {
        const message = nextActive
          ? "Deseja reativar este serviço?"
          : "Deseja inativar este serviço? Ele deixará de ser oferecido em novas ordens.";
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      <input name="serviceId" type="hidden" value={serviceId} />
      <input name="active" type="hidden" value={String(nextActive)} />
      <SubmitButton nextActive={nextActive} />
    </form>
  );
}
