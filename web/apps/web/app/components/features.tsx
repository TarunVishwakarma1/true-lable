import { Container } from "@repo/ui/container";
import { Reveal } from "@repo/ui/reveal";
import { SectionHeading } from "@repo/ui/section-heading";

const ROWS: [string, string, boolean, boolean][] = [
  ["Unlimited scans", "No account. Point, scan, read.", true, true],
  ["The whole database", "Every product, every verified label.", true, true],
  ["Plain-language nutrition", "Teaspoons, share of your day, additives explained.", true, true],
  ["Community verification", "Confirm labels, dispute mistakes, add products.", true, true],
  ["Source code, Apache-2.0", "Read how a number is calculated. Fork it if you disagree.", true, true],
  ["Health profile", "Tell it what you're watching; those flags come first.", false, true],
  ["Recommendations", "Alternatives on the same shelf that fit you better.", false, true],
  ["Trends over time", "What you actually scan and buy, month over month.", false, true],
  ["White-label", "The scanner under a clinic's, gym's or brand's name.", false, true],
];

function Cell({ on, muted = false }: { on: boolean; muted?: boolean }) {
  if (!on) return <span className="text-muted/60">—</span>;
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      aria-hidden
      className={`inline-block ${muted ? "text-muted" : "text-accent"}`}
    >
      <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Features() {
  return (
    <section id="features" className="scroll-mt-16 py-24 md:py-32">
      <Container>
        <SectionHeading
          index="03"
          label="Free & Premium"
          title="Free is the product. Premium keeps it that way."
          body="Everything you need to read a label is free, forever, in the open. Premium is for people who want the app to remember them, and it's what pays for the free tier."
        />

        <div className="mt-20 grid gap-12 lg:grid-cols-12 lg:gap-8">
          <Reveal className="lg:col-span-4">
            <dl className="border-t border-line">
              <div className="flex items-baseline justify-between border-b border-line py-5">
                <dt className="text-sm">Free</dt>
                <dd className="font-mono text-sm tabular-nums">
                  ₹0 <span className="text-muted">/ always</span>
                </dd>
              </div>
              <div className="flex items-baseline justify-between border-b border-line py-5">
                <dt className="text-sm">Premium</dt>
                <dd className="font-mono text-sm text-muted">optional, price not set</dd>
              </div>
            </dl>
            <p className="mt-6 max-w-sm font-mono text-[11px] leading-relaxed text-muted">
              Premium is designed so you never need it to read a label. It exists so the free tier never has to
              show you an ad or sell a scan.
            </p>
          </Reveal>

          <Reveal delay={0.1} className="overflow-x-auto lg:col-span-8">
            <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
              <caption className="sr-only">What's included in Free and Premium</caption>
              <thead>
                <tr className="border-t border-b border-line font-mono text-[11px] tracking-[0.12em] text-muted uppercase">
                  <th scope="col" className="py-4 font-normal">
                    Included
                  </th>
                  <th scope="col" className="w-24 py-4 text-center font-normal text-accent">
                    Free
                  </th>
                  <th scope="col" className="w-24 py-4 text-center font-normal">
                    Premium
                  </th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map(([title, body, free, premium]) => (
                  <tr key={title} className="border-b border-line transition-colors hover:bg-fg/[0.03]">
                    <th scope="row" className="py-4 pr-6 align-top font-normal">
                      <span className="block">{title}</span>
                      <span className="mt-0.5 block text-muted">{body}</span>
                    </th>
                    <td className="py-4 text-center align-top">
                      <Cell on={free} />
                    </td>
                    <td className="py-4 text-center align-top">
                      <Cell on={premium} muted />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
