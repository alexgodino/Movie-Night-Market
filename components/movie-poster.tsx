"use client";

import { useState } from "react";
import clsx from "clsx";

type Props = {
  title: string;
  posterUrl?: string | null;
  className?: string;
};

export function MoviePoster({ title, posterUrl, className }: Props) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(posterUrl?.trim()) && !failed;
  const wrapperClass = clsx(
    "relative block min-h-[12rem] overflow-hidden rounded-[1.4rem] border border-[var(--line)] shadow-sm",
    className,
  );

  if (showImage) {
    return (
      <div className={clsx(wrapperClass, "bg-[var(--surface-2)]")}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={posterUrl?.trim()}
          alt={`${title} poster`}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="block h-auto w-full object-contain"
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
