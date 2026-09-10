import { Marquee } from "@repo/ui/marquee";
import { SHELF } from "./lib/site";
import { Hero } from "./components/hero";
import { Statement } from "./components/statement";
import { DataField } from "./components/data-field";
import { Problem } from "./components/problem";
import { Journey } from "./components/journey";
import { Features } from "./components/features";
import { Community } from "./components/community";
import { FinalCta } from "./components/final-cta";
import { Footer } from "./components/footer";

export default function Home() {
  return (
    <>
      <main id="main" className="overflow-x-clip">
        <Hero />
        <Statement />
        <Marquee items={SHELF} label="Built for everyday Indian packaged foods:" />
        <DataField />
        <Problem />
        <Journey />
        <Features />
        <Community />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
