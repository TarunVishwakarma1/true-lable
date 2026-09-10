import { REPO_URL } from "../lib/site";
import { Button, TextLink } from "@repo/ui/button";
import { Container } from "@repo/ui/container";
import { BarcodeCanvas } from "@repo/ui/barcode-canvas";
import { Reveal } from "@repo/ui/reveal";

export function FinalCta() {
  return (
    <section className="border-t border-line py-24 md:py-40">
      <Container>
        <Reveal className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          <h2 className="text-[clamp(3rem,9vw,8.5rem)] leading-[0.92] font-medium tracking-[-0.045em] text-balance lg:col-span-8">
            Start knowing what you eat.
          </h2>
          <div className="flex flex-col justify-end lg:col-span-4">
            <p className="max-w-sm text-lg leading-relaxed text-pretty text-muted">
              The iOS app is in early access on GitHub. Star the repo to follow the first release, or open an
              issue with the product you wish it knew about.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3">
              <Button href={REPO_URL} target="_blank" rel="noreferrer" >
                Get early access
              </Button>
              <TextLink href={`${REPO_URL}/issues/new`} target="_blank" rel="noreferrer">
                Suggest a product
              </TextLink>
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.15} className="mt-20 md:mt-28">
          <BarcodeCanvas />
          <p className="mt-4 font-mono text-[11px] tracking-[0.12em] text-muted uppercase">
            Move across the barcode
          </p>
        </Reveal>
      </Container>
    </section>
  );
}
