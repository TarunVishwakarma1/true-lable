"use client";

import { useState, type FormEvent } from "react";

type State = { status: "idle" | "sending" | "ok" | "error"; message?: string };

export function NewsletterForm() {
  const [state, setState] = useState<State>({ status: "idle" });

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = new FormData(e.currentTarget).get("email");
    setState({ status: "sending" });
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body = (await res.json()) as { message?: string; error?: string };
      setState(res.ok ? { status: "ok", message: body.message } : { status: "error", message: body.error });
    } catch {
      setState({ status: "error", message: "Couldn't reach the server. Try again in a bit." });
    }
  }

  if (state.status === "ok") {
    return <p className="text-sm text-accent">{state.message}</p>;
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap gap-y-2 border-b border-line focus-within:border-fg">
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <input
        id="newsletter-email"
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="you@example.in"
        className="h-11 min-w-0 flex-1 bg-transparent text-sm placeholder:text-muted focus:outline-none"
      />
      <button
        type="submit"
        disabled={state.status === "sending"}
        className="h-11 text-sm font-medium transition-colors hover:text-accent disabled:opacity-60"
      >
        {state.status === "sending" ? "Sending…" : "Subscribe →"}
      </button>
      {state.status === "error" && (
        <p role="alert" className="basis-full pb-2 text-sm text-warn">
          {state.message}
        </p>
      )}
    </form>
  );
}
