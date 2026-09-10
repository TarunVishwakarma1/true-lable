import Image from "next/image";
import { REPO, REPO_URL } from "../lib/site";
import { TextLink } from "@repo/ui/button";
import { Container } from "@repo/ui/container";
import { Reveal } from "@repo/ui/reveal";
import { SectionHeading } from "@repo/ui/section-heading";
import { VerificationFeed } from "./verification-feed";

type Contributor = { login: string; avatar_url: string; html_url: string };

async function github() {
  const init: RequestInit & { next: { revalidate: number } } = {
    headers: { Accept: "application/vnd.github+json", "User-Agent": "truelabel-web" },
    next: { revalidate: 3600 },
  };
  try {
    const [repo, contributors] = await Promise.all([
      fetch(`https://api.github.com/repos/${REPO}`, init).then((r) => (r.ok ? r.json() : null)),
      fetch(`https://api.github.com/repos/${REPO}/contributors?per_page=8`, init).then((r) =>
        r.ok ? (r.json() as Promise<Contributor[]>) : [],
      ),
    ]);
    return {
      stars: repo?.stargazers_count as number | undefined,
      forks: repo?.forks_count as number | undefined,
      issues: repo?.open_issues_count as number | undefined,
      pushedAt: repo?.pushed_at as string | undefined,
      contributors: Array.isArray(contributors) ? contributors : [],
    };
  } catch {
    return null;
  }
}

function ago(iso?: string) {
  if (!iso) return "—";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

const PROMISES = [
  "Sell your scans, or anything else about you.",
  "Put an ad between you and a label.",
  "Hide how a number is calculated.",
  "Lock the database behind a paywall.",
  "Quietly change the licence.",
];

export async function Community() {
  const gh = await github();
  const stats = [
    { label: "GitHub stars", value: gh?.stars ?? "—" },
    { label: "Forks", value: gh?.forks ?? "—" },
    { label: "Open issues", value: gh?.issues ?? "—" },
    { label: "Last commit", value: ago(gh?.pushedAt) },
  ];

  return (
    <section id="community" className="scroll-mt-16 py-24 md:py-32">
      <Container>
        <SectionHeading
          index="04"
          label="Built in the open"
          title="We're early. These are the real numbers."
          body="No invented testimonials, no “trusted by 10,000 users”. Everything below comes straight from GitHub, and the repo is the product. Read it before you trust it."
        />

        <Reveal>
          <dl className="mt-20 grid grid-cols-2 border-t border-line md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="border-b border-line py-8 md:border-r md:pr-8 md:last:border-r-0">
                <dt className="font-mono text-[11px] tracking-[0.12em] text-muted uppercase">{s.label}</dt>
                <dd className="mt-3 text-5xl font-medium tracking-[-0.04em] tabular-nums md:text-6xl">{s.value}</dd>
              </div>
            ))}
          </dl>
        </Reveal>

        <div className="mt-16 grid gap-14 md:grid-cols-3 md:gap-8">
          <Reveal>
            <div className="flex items-baseline justify-between border-b border-line pb-4">
              <p className="text-sm">Contributors</p>
              <span className="font-mono text-[11px] text-muted tabular-nums">{gh?.contributors.length ?? 0}</span>
            </div>
            <div className="mt-5 flex items-center">
              {gh?.contributors.length ? (
                gh.contributors.map((c, i) => (
                  <a
                    key={c.login}
                    href={c.html_url}
                    target="_blank"
                    rel="noreferrer"
                    title={c.login}
                    className="relative rounded-full ring-2 ring-bg transition-transform hover:z-10 hover:scale-110"
                    style={{ marginLeft: i ? -8 : 0 }}
                  >
                    <Image src={c.avatar_url} alt={c.login} width={36} height={36} className="rounded-full" />
                  </a>
                ))
              ) : (
                <span className="text-sm text-muted">Could not reach GitHub right now.</span>
              )}
            </div>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted">
              One person so far. The database only works if it isn't. Add a product, fix a number, or read the
              scoring code and tell us where it's wrong.
            </p>
            <div className="mt-2 flex flex-wrap gap-x-8">
              <TextLink href={REPO_URL} target="_blank" rel="noreferrer">
                Star the repo
              </TextLink>
              <TextLink href={`${REPO_URL}/issues`} target="_blank" rel="noreferrer">
                Open issues
              </TextLink>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="border-b border-line pb-4">
              <p className="text-sm">Things TrueLabel will not do</p>
            </div>
            <ul>
              {PROMISES.map((p, i) => (
                <li key={p} className="flex gap-4 border-b border-line py-3 text-sm">
                  <span className="font-mono text-[11px] text-muted tabular-nums">0{i + 1}</span>
                  <span className="text-pretty">{p}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 font-mono text-[11px] leading-relaxed text-muted">
              Written into the licence and the code, not just this page. If we ever break one, the fork is one
              click away. That is the point of Apache-2.0.
            </p>
          </Reveal>

          <Reveal delay={0.2}>
            <VerificationFeed />
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
