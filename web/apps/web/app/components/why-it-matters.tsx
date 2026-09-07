import { Reveal } from "./reveal";

const PROBLEMS = [
  {
    title: "Food Labels Are Designed to Hide",
    problem:
      "Manufacturers bury nutrition facts in tiny print and confusing terms. You don't actually know what you're eating.",
    pains: [
      "Small fonts on labels (hard to read in store)",
      'Misleading claims ("natural", "healthy" mean nothing)',
      "Ingredients listed but unexplained (what IS sodium benzoate?)",
      "Different nutrition in India vs US (same product, different values)",
    ],
    stat: "70%+ consumers can't interpret nutrition labels correctly",
    solution:
      "Every product decoded. Ingredients explained. Community verifies accuracy. You know exactly what you're buying.",
  },
  {
    title: "Nutrition Apps Don't Know YOU",
    problem:
      "Generic nutrition scores don't account for your health. A product \"healthy\" for one person could be dangerous for another.",
    pains: [
      "Diabetics see sugar, non-diabetics don't care",
      "Keto dieters need carb info, not calorie counts",
      "Lactose-intolerant users need to avoid dairy (apps don't flag it)",
      "High BP patients need sodium tracking",
    ],
    stat: '40%+ people with dietary restrictions feel no app "gets" their needs',
    solution:
      "Personalized scoring based on YOUR health. If you're diabetic, high sugar is red. If you're keto, carbs matter most.",
  },
  {
    title: "No Single Source of Truth (Especially India)",
    problem:
      "Nutrition data is fragmented. MyFitnessPal has Coca-Cola but not your favorite Indian brand. No centralized, open, verified database exists.",
    pains: [
      "MyFitnessPal has poor Indian product coverage",
      "Different apps have different data (conflicting info)",
      "Offline access impossible (need internet to scan)",
      "Paid apps lock data behind subscriptions",
    ],
    stat: "80%+ Indian brands NOT in global nutrition databases",
    solution:
      "Open-source, community-owned database. India-first. Free forever. Offline-ready. No corporate lock-in.",
  },
];

export function WhyItMatters() {
  return (
    <section id="why-it-matters" className="mx-auto max-w-6xl px-6 py-24">
      <Reveal>
        <h2 className="text-center text-3xl font-bold tracking-tighter sm:text-4xl">
          Why It Matters
        </h2>
      </Reveal>

      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {PROBLEMS.map((p, i) => (
          <Reveal
            key={p.title}
            delay={i * 0.1}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/10 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <span className="pointer-events-none absolute -top-4 right-4 text-7xl font-black text-neutral-900/5 select-none dark:text-white/5">
              {String(i + 1).padStart(2, "0")}
            </span>

            <h3 className="relative text-lg font-semibold">{p.title}</h3>

            <blockquote className="mt-3 border-l-2 border-neutral-300 pl-3 text-sm text-neutral-600 italic dark:border-neutral-700 dark:text-neutral-400">
              {p.problem}
            </blockquote>

            <ul className="mt-4 space-y-1.5 text-sm text-neutral-600 dark:text-neutral-400">
              {p.pains.map((pain) => (
                <li key={pain} className="flex gap-2">
                  <span className="text-neutral-400 dark:text-neutral-600">
                    –
                  </span>
                  <span>{pain}</span>
                </li>
              ))}
            </ul>

            <p className="mt-4 inline-block w-fit rounded-full bg-neutral-200 px-3 py-1 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
              {p.stat}
            </p>

            <div className="mt-auto pt-5">
              <p className="rounded-xl bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300">
                {p.solution}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
