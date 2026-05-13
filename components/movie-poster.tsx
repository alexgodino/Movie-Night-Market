"use client";

import { useState } from "react";
import clsx from "clsx";

type Props = {
  title: string;
  posterUrl?: string | null;
  compact?: boolean;
};

export function MoviePoster({ title, posterUrl, compact = false }: Props) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(posterUrl?.trim()) && !failed;
  const wrapperClass = clsx(
    "relative w-full overflow-hidden rounded-[1.4rem] border border-[var(--line)] shadow-sm",
    "aspect-[2/3] bg-[var(--surface-2)]",
    compact && "max-w-28",
  );

  if (showImage) {
    return (
      <div className={clsx(wrapperClass, "p-1.5")}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={posterUrl?.trim()}
          alt={`${title} poster`}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="h-full w-full rounded-[1.05rem] object-contain"
        />
      </div>
    );
  }

  return (
    <div
      className={clsx(
        wrapperClass,
        "flex flex-col justify-between border-none bg-[linear-gradient(180deg,#294b49,#1d3130)] p-3 text-white",
      )}
    >
      <span className="text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-white/80">
        Movie Night
      </span>
      <div className="min-w-0">
        <div className="headline max-h-16 overflow-hidden text-base leading-tight text-white">
          {title}
        </div>
      </div>
      <div className="text-[0.65rem] text-white/70">Manual pick</div>
    </div>
  );
}
