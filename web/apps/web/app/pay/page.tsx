import type { Metadata } from "next";
import { Container } from "@repo/ui/container";
import { REPO_URL } from "../lib/site";
import { Checkout } from "./checkout";

export const metadata: Metadata = {
  title: "Premium",
  robots: { index: false, follow: false },
};

// Not linked from anywhere yet. Becomes the checkout when Premium ships.
export default function PayPage() {
  return (
    <main id="main" className="min-h-svh pt-32 pb-24">
      <Container>
        <p className="font-mono text-xs text-muted">
          <span className="tabular-nums">00</span>
          <span className="mx-2">/</span>Premium
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-medium tracking-[-0.03em] text-balance sm:text-5xl lg:text-6xl">
          The app that remembers you.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-pretty text-muted">
          Reading a label is free forever. Premium is the profile on top: your flags first, same-shelf
          alternatives, and your month in scans. It pays for the free tier and it never touches the label.
        </p>
        <Checkout />
        <p className="mt-10 max-w-xl font-mono text-[11px] leading-relaxed text-muted">
          Payments are processed by a PCI-compliant provider when Premium launches. TrueLabel never sees or
          stores card details. Everything about how the free tier stays free is in{" "}
          <a href={REPO_URL} className="underline underline-offset-4 hover:text-accent" target="_blank" rel="noreferrer">
            the repository
          </a>
          .
        </p>
      </Container>
    </main>
  );
}
