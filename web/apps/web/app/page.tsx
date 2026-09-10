import { Marquee } from "@repo/ui/marquee";
import { SHELF } from "./lib/site";
import { Hero } from "./components/hero";
import { Statement } from "./components/statement";
import { Problem } from "./components/problem";
import { Journey } from "./components/journey";
import { Features } from "./components/features";
import { Community } from "./components/community";
import { FinalCta } from "./components/final-cta";
import { Footer } from "./components/footer";

export default function Home() {
  return (
    <>
      <main id="main">
        <Hero />
        <Statement />
        <Marquee items={SHELF} label="Built for everyday Indian packaged foods:" />
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
