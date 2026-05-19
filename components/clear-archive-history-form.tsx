"use client";

type Props = {
  action: () => void | Promise<void>;
  disabled?: boolean;
};

export function ClearArchiveHistoryForm({ action, disabled = false }: Props) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (disabled) {
          event.preventDefault();
          return;
        }

        if (!window.confirm("Clear all archived movie night history?")) {
          event.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        disabled={disabled}
        className="tap-button inline-flex w-full items-center justify-center gap-2 border border-rose-200 bg-white text-[var(--market-down)]"
      >
        Clear archived history
      </button>
    </form>
  );
}
