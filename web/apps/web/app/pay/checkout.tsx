"use client";

import { useState } from "react";

const ENABLED = process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === "true";

const PLANS = [
  { id: "monthly", label: "Monthly", price: process.env.NEXT_PUBLIC_PRICE_MONTHLY ?? "—", per: "/ month", note: "Cancel any time." },
  { id: "yearly", label: "Yearly", price: process.env.NEXT_PUBLIC_PRICE_YEARLY ?? "—", per: "/ year", note: "Two months free." },
] as const;

const INCLUDED = ["Health profile", "Same-shelf alternatives", "Trends over time", "Everything in Free, forever"];

export function Checkout() {
  const [plan, setPlan] = useState<(typeof PLANS)[number]["id"]>("yearly");

  return (
    <div className="mt-14 grid gap-10 lg:grid-cols-12 lg:gap-8">
      <div className="lg:col-span-7">
        <div role="radiogroup" aria-label="Billing period" className="grid gap-3 sm:grid-cols-2">
          {PLANS.map((p) => (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={plan === p.id}
              onClick={() => setPlan(p.id)}
              className={`border p-6 text-left transition-colors ${plan === p.id ? "border-fg" : "border-line hover:border-muted"}`}
            >
              <span className="flex items-baseline justify-between">
                <span className="text-sm">{p.label}</span>
                <span className="font-mono text-[11px] text-muted">{p.note}</span>
              </span>
              <span className="mt-4 block text-3xl font-medium tracking-tight tabular-nums">
                ₹{p.price} <span className="font-mono text-sm font-normal text-muted">{p.per}</span>
              </span>
            </button>
          ))}
        </div>

        <ul className="mt-8 border-t border-line">
          {INCLUDED.map((f) => (
            <li key={f} className="flex items-center gap-3 border-b border-line py-3 text-sm">
              <span className="h-1 w-1 rounded-full bg-accent" />
              {f}
            </li>
          ))}
        </ul>
      </div>

      <form
        className="lg:col-span-5"
        onSubmit={(e) => {
          e.preventDefault();
          // ponytail: provider handoff (Razorpay/Stripe checkout session) lands here when payments go live.
        }}
      >
        <label htmlFor="pay-email" className="text-sm">
          Email for the receipt
        </label>
        <input
          id="pay-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          disabled={!ENABLED}
          placeholder="you@example.in"
          className="mt-2 h-12 w-full border-b border-line bg-transparent text-sm placeholder:text-muted focus:border-fg focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!ENABLED}
          className="mt-6 flex h-12 w-full items-center justify-center bg-fg text-sm font-medium text-bg transition-colors hover:bg-accent hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          {ENABLED ? `Continue to payment · ${plan}` : "Checkout opens with the first release"}
        </button>
        {!ENABLED && (
          <p className="mt-3 font-mono text-[11px] leading-relaxed text-muted">
            Premium isn't on sale yet. Prices above are placeholders until they are.
          </p>
        )}
      </form>
    </div>
  );
}
