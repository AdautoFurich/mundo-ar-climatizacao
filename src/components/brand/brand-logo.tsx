import Image from "next/image";

import { cn } from "@/lib/utils";

export function BrandLogo({
  className,
  imageClassName,
}: {
  className?: string;
  imageClassName?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-white/30 bg-white p-2 shadow-[0_12px_30px_rgba(4,24,38,0.18)]",
        className,
      )}
    >
      <Image
        alt="Mundo Ar Climatização"
        className={cn("h-auto w-full object-contain", imageClassName)}
        height={1254}
        sizes="(min-width: 1024px) 144px, 88px"
        src="/brand/mundo-ar-logo.png"
        width={1254}
      />
    </div>
  );
}
