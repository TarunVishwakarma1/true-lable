import Image from "next/image";
import { NAV, REPO, REPO_URL } from "../lib/site";
import { Container } from "@repo/ui/container";
import { CountUp } from "@repo/ui/count-up";
import { NewsletterForm } from "./newsletter-form";

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

const COLUMNS = [
  { heading: "Product", links: NAV },
  {
    heading: "Community",
    links: [
      { label: "GitHub", href: REPO_URL },
      { label: "Issues", href: `${REPO_URL}/issues` },
      { label: "Discussions", href: `${REPO_URL}/discussions` },
      { label: "Contributors", href: `${REPO_URL}/graphs/contributors` },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Apache-2.0 licence", href: `${REPO_URL}/blob/main/License` },
      { label: "Source code", href: REPO_URL },
    ],
  },
];

export async function Footer() {
  const gh = await github();
  const stats: [string, number | string][] = [
    ["Stars", gh?.stars ?? "—"],
    ["Forks", gh?.forks ?? "—"],
    ["Open issues", gh?.issues ?? "—"],
    ["Last commit", ago(gh?.pushedAt)],
  ];

  return (
    <footer className="border-t border-line pt-16 pb-8">
      <Container>
        <div className="flex flex-wrap items-center justify-between gap-x-10 gap-y-4 border-b border-line pb-8">
          <dl className="flex flex-wrap gap-x-10 gap-y-3">
            {stats.map(([k, v]) => (
              <div key={k} className="flex items-baseline gap-2">
                <dd className="text-2xl font-medium tracking-tight tabular-nums">
                  <CountUp value={v} />
                </dd>
                <dt className="font-mono text-[11px] tracking-[0.12em] text-muted uppercase">{k}</dt>
              </div>
            ))}
          </dl>
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              {gh?.contributors.map((c, i) => (
                <a
                  key={c.login}
                  href={c.html_url}
                  target="_blank"
                  rel="noreferrer"
                  title={c.login}
                  className="relative rounded-full ring-2 ring-bg transition-transform hover:z-10 hover:scale-110"
                  style={{ marginLeft: i ? -8 : 0 }}
                >
                  <Image src={c.avatar_url} alt={c.login} width={28} height={28} className="rounded-full" />
                </a>
              ))}
            </div>
            <a href={`${REPO_URL}/graphs/contributors`} target="_blank" rel="noreferrer" className="font-mono text-[11px] tracking-[0.12em] text-muted uppercase transition-colors hover:text-accent">
              Live from GitHub · you, next?
            </a>
          </div>
        </div>

        <div className="mt-14 grid gap-14 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <a href="#top" className="text-[17px] font-medium tracking-tight">
              True<span className="text-accent">Label</span>
            </a>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              A free, open-source barcode scanner that reads the nutrition label back to you in plain language.
              Community-verified, India-first.
            </p>
            <div className="mt-10 max-w-sm">
              <p className="text-sm">Release notes, nothing else</p>
              <div className="mt-3">
                <NewsletterForm />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-7 lg:col-start-7">
            {COLUMNS.map((col) => (
              <div key={col.heading}>
                <h3 className="font-mono text-[11px] tracking-[0.12em] text-muted uppercase">{col.heading}</h3>
                <ul className="mt-4 space-y-2.5 text-sm">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        {...(link.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
                        className="transition-colors hover:text-accent"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-2 border-t border-line pt-6 font-mono text-[11px] text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} TrueLabel · Made in India, for Indian shelves.</p>
          <p>This site stores two things in your browser: your theme and whether sound is on.</p>
        </div>
      </Container>
    </footer>
  );
}
