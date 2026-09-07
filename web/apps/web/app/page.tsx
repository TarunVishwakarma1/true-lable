import { Hero } from "./components/hero";
import { WhyItMatters } from "./components/why-it-matters";
import { Marquee } from "./components/marquee";
import { HowItWorks } from "./components/how-it-works";
import { Footer } from "./components/footer";

export default function Home() {
  return (
    <main>
      <Hero />
      <WhyItMatters />
      <Marquee />
      <HowItWorks />
      <Footer />
    </main>
  );
}
