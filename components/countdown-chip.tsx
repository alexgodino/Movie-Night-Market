import { TimerReset } from "lucide-react";

type Props = {
  copy: string | null;
};

export function CountdownChip({ copy }: Props) {
  if (!copy) {
    return null;
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white/70 px-4 py-2 text-sm font-semibold text-[var(--ink-1)]">
      <TimerReset className="size-4 text-[var(--accent)]" />
      {copy}
    </div>
  );
}
