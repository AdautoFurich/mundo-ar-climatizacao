import { CircleCheck, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

export function FormMessage({
  message,
  tone = "error",
}: {
  message?: string;
  tone?: "error" | "success";
}) {
  if (!message) return null;

  const Icon = tone === "success" ? CircleCheck : TriangleAlert;

  return (
    <div
      aria-live="polite"
      className={cn(
        "flex gap-3 rounded-lg border px-3 py-3 text-sm",
        tone === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border-amber-200 bg-amber-50 text-amber-950",
      )}
      role={tone === "error" ? "alert" : "status"}
    >
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
