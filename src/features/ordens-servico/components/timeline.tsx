import { Clock3, History } from "lucide-react";

import { formatOrderDate, formatOrderStatus } from "../formatters";
import type { OrderHistoryEvent } from "../types";

export function OrderTimeline({ events }: { events: OrderHistoryEvent[] }) {
  return (
    <section className="overflow-hidden rounded-xl border bg-white shadow-[0_2px_8px_rgba(16,45,63,0.04)]" aria-labelledby="history-title">
      <div className="flex items-center gap-3 border-b px-4 py-3.5">
        <History aria-hidden="true" className="size-5 text-[var(--action)]" />
        <div>
          <h2 className="font-display text-lg font-bold text-[var(--brand)]" id="history-title">Histórico</h2>
          <p className="text-xs text-[var(--ink-muted)]">Eventos e responsáveis pela ordem</p>
        </div>
      </div>
      <div className="p-4 sm:p-5">
        {events.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-[var(--surface-subtle)] px-4 py-7 text-center">
            <p className="text-sm font-semibold text-[var(--brand)]">Nenhum evento registrado.</p>
            <p className="mt-1 text-xs text-[var(--ink-muted)]">As alterações da ordem aparecerão aqui.</p>
          </div>
        ) : (
          <ol className="space-y-0">
            {events.map((event, index) => (
              <li className="relative grid grid-cols-[1.25rem_minmax(0,1fr)] gap-3 pb-5 last:pb-0" key={event.id}>
                {index < events.length - 1 && <span aria-hidden="true" className="absolute bottom-0 left-[0.59375rem] top-5 w-px bg-[var(--border)]" />}
                <span aria-hidden="true" className="relative z-10 mt-1 grid size-5 place-items-center rounded-full border-4 border-white bg-[var(--action)]" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--ink)]">{event.summary}</p>
                  {event.previousStatus && event.nextStatus && (
                    <p className="mt-1 text-xs font-semibold text-[var(--action)]">
                      {formatOrderStatus(event.previousStatus)} → {formatOrderStatus(event.nextStatus)}
                    </p>
                  )}
                  {event.justification && <p className="mt-2 rounded-md bg-amber-50 px-2.5 py-2 text-xs leading-5 text-amber-950">Justificativa: {event.justification}</p>}
                  <p className="mt-1.5 flex items-center gap-1 text-xs text-[var(--ink-muted)]">
                    <Clock3 aria-hidden="true" className="size-3.5" />
                    Por {event.authorName} · <time dateTime={event.createdAt}>{formatOrderDate(event.createdAt)}</time>
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
