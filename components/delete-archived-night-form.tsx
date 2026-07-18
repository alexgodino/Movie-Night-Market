"use client";

import { Trash2 } from "lucide-react";

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  nightId: string;
  nightTitle: string;
};

export function DeleteArchivedNightForm({ action, nightId, nightTitle }: Props) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(`Remove "${nightTitle}" from archived history?`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="nightId" value={nightId} />
      <button
        type="submit"
        className="tap-button inline-flex w-full items-center justify-center gap-2 border border-rose-200 bg-white text-[var(--market-down)]"
      >
        <Trash2 className="size-4" />
        Delete this night
      </button>
    </form>
  );
}
