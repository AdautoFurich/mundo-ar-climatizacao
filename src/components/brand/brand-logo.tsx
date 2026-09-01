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
    <div className={cn("relative", className)}>
      <Image
        alt="Mundo Ar Climatização"
        className={cn("h-auto w-full object-contain", imageClassName)}
        height={1254}
        loading="eager"
        sizes="(min-width: 1024px) 136px, 104px"
        src="/brand/mundo-ar-logo-white.png"
        width={1254}
      />
    </div>
  );
}