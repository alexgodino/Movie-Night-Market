"use client";

import { useActionState } from "react";
import type { FormState } from "@/lib/actions";
import { loginAdminAction } from "@/lib/actions";

const initialState: FormState = {};

export function AdminLoginForm() {
  const [state, action, pending] = useActionState(loginAdminAction, initialState);

  return (
    <form action={action} className="glass-panel rounded-[2rem] p-6">
      <h1 className="headline text-4xl">Admin access</h1>
      <p className="mt-3 text-base leading-7 text-[var(--ink-2)]">
        Enter the local passcode to manage tonight&apos;s lineup.
      </p>
      <label htmlFor="passcode" className="mt-5 block text-sm font-semibold text-[var(--ink-1)]">
        Passcode
      </label>
      <input
        id="passcode"
        type="password"
        name="passcode"
        className="mt-2 w-full rounded-[1.4rem] border border-[var(--line)] bg-white px-4 py-4 text-lg"
      />
      {state.error ? (
        <p className="mt-4 rounded-2xl bg-[var(--accent-soft)] px-4 py-3 text-sm font-semibold text-[var(--accent-strong)]">
          {state.error}
        </p>
      ) : null}
      <button className="tap-button mt-5 w-full bg-[var(--surface-4)] text-lg text-white">
        {pending ? "Opening..." : "Open admin dashboard"}
      </button>
    </form>
  );
}
