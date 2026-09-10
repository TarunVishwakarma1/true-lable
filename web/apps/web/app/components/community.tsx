import { REPO_URL } from "../lib/site";
import { TextLink } from "@repo/ui/button";
import { Container } from "@repo/ui/container";
import { LabelCard } from "@repo/ui/label-card";
import { Parallax } from "@repo/ui/parallax";
import { Reveal } from "@repo/ui/reveal";
import { SectionHeading } from "@repo/ui/section-heading";

const PROMISES = [
  "Sell your scans, or anything else about you.",
  "Put an ad between you and a label.",
  "Hide how a number is calculated.",
  "Lock the database behind a paywall.",
  "Quietly change the licence.",
];

const READ = [
  ["Sodium, per 70 g pack", "1,020 mg", "about half of a 2,000 mg day"],
  ["Saturated fat, per pack", "6.5 g", "a third of a 20 g day"],
  ["INS 627 + 631", "flavour enhancers", "the “umami” in the masala"],
  ["INS 150d", "caramel colour", "what makes it brown"],
];

export function Community() {
  return (
    <section id="community" className="scroll-mt-16 py-24 md:py-32">
      <Container>
        <SectionHeading
          index="04"
          label="Built in the open"
          title="One label, read properly."
          body="This is the back of a ₹14 instant noodle packet, set exactly as printed. On the right, what TrueLabel says about it. Every number on the left is public; every sentence on the right comes from code you can read."
        />

        <div className="mt-20 grid gap-12 lg:grid-cols-12 lg:gap-8">
          <Reveal variant="scale" className="lg:col-span-5">
            <Parallax speed={0.35} scale={0.05} rotate={1.5}>
              <LabelCard className="mx-auto max-w-md rotate-[-1.5deg] shadow-[0_40px_80px_-40px_rgba(0,0,0,0.6)]" />
            </Parallax>
          </Reveal>

          <div className="lg:col-span-6 lg:col-start-7">
            <Reveal delay={0.1}>
              <p className="font-mono text-[11px] tracking-[0.12em] text-accent uppercase">What the scan says</p>
              <dl className="mt-4 border-t border-line">
                {READ.map(([k, v, note]) => (
                  <div key={k} className="grid gap-1 border-b border-line py-4 sm:grid-cols-[1fr_auto] sm:items-baseline">
                    <dt className="text-sm text-muted">{k}</dt>
                    <dd className="text-right">
                      <span className="text-xl font-medium tracking-tight tabular-nums">{v}</span>
                      <span className="mt-0.5 block font-mono text-[11px] text-muted">{note}</span>
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 font-mono text-[11px] leading-relaxed text-muted">
                Illustrative packet. Values are in the normal range for the category; the real database shows the real
                photo beside them.
              </p>
            </Reveal>

            <Reveal delay={0.2} className="mt-14">
              <p className="text-sm">Why this exists</p>
              <p className="mt-4 max-w-lg text-lg leading-relaxed text-pretty">
                I started TrueLabel because the two apps on my phone could tell me about a Kansas granola bar and
                nothing about the bhujia in my hand. The label was right there. It just needed reading.
              </p>
              <p className="mt-4 max-w-lg leading-relaxed text-pretty text-muted">
                It's one person and a public repo right now. The database only works if it isn't. Add a packet, fix
                a number, or read the scoring code and tell me where it's wrong.
              </p>
              <div className="mt-6 flex flex-wrap gap-x-8">
                <TextLink href={REPO_URL} target="_blank" rel="noreferrer">
                  Read the source
                </TextLink>
                <TextLink href={`${REPO_URL}/issues/new`} target="_blank" rel="noreferrer">
                  Add a packet
                </TextLink>
              </div>
            </Reveal>
          </div>
        </div>

        <Reveal delay={0.1} className="mt-24 grid gap-8 border-t border-line pt-8 md:grid-cols-12">
          <p className="text-sm md:col-span-3">Things TrueLabel will not do</p>
          <ul className="md:col-span-9 md:grid md:grid-cols-2 md:gap-x-8">
            {PROMISES.map((p, i) => (
              <li key={p} className="flex gap-4 border-b border-line py-3 text-sm">
                <span className="font-mono text-[11px] text-muted tabular-nums">0{i + 1}</span>
                <span className="text-pretty">{p}</span>
              </li>
            ))}
            <li className="py-3 font-mono text-[11px] leading-relaxed text-muted">
              Written into the licence and the code, not just this page. If we ever break one, the fork is one click
              away. That is the point of Apache-2.0.
            </li>
          </ul>
        </Reveal>
      </Container>
    </section>
  );
}
