"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";

const REPO_URL = "https://github.com/TarunVishwakarma1/true-lable";
const DOCS_URL = process.env.NEXT_PUBLIC_DOCS_URL ?? "http://localhost:3001";

const GROUPS: { title: string; links: { label: string; href: string; description: string }[] }[] = [
  {
    title: "Newcomers",
    links: [
      { label: "Getting Started", href: `${DOCS_URL}/docs/getting-started`, description: "Run the backend, iOS app, and web apps locally" },
      { label: "Architecture", href: `${DOCS_URL}/docs/architecture`, description: "How the three apps fit together" },
    ],
  },
  {
    title: "Contributors",
    links: [
      { label: "Contributing guide", href: `${DOCS_URL}/docs/contributing`, description: "Branch strategy and pre-PR checklists" },
      { label: "API Reference", href: `${DOCS_URL}/docs/backend/api-reference/products`, description: "The full backend contract" },
      { label: "Open an issue", href: `${REPO_URL}/issues/new/choose`, description: "Bug, feature, or chore templates" },
    ],
  },
  {
    title: "Staff",
    links: [
      { label: "Team", href: "/dashboard/team", description: "Who has dashboard access" },
      { label: "Deployment", href: `${DOCS_URL}/docs/deployment`, description: "How production is actually run" },
    ],
  },
  {
    title: "Everyone",
    links: [
      { label: "GitHub repository", href: REPO_URL, description: "Source, issues, and pull requests" },
      { label: "Developer docs", href: DOCS_URL, description: "The full documentation site" },
    ],
  },
];

export default function ResourcesPage() {
  return (
    <main className="mx-auto max-w-3xl px-8 py-10">
      <h1 className="text-xl font-medium text-fg">Resources</h1>
      <p className="mt-1 text-sm text-muted">Where to go next, by what you're trying to do.</p>

      <div className="mt-8 flex flex-col gap-8">
        {GROUPS.map((group) => (
          <div key={group.title}>
            <p className="text-xs font-medium tracking-wide text-muted uppercase">{group.title}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {group.links.map((link) => {
                const external = link.href.startsWith("http");
                const Wrapper = external ? "a" : Link;
                return (
                  <Wrapper
                    key={link.href}
                    href={link.href}
                    {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
                    className="flex items-start justify-between gap-2 rounded-lg border border-line p-3.5 transition-colors hover:border-fg/20"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-fg">{link.label}</p>
                      <p className="mt-0.5 text-xs text-muted">{link.description}</p>
                    </div>
                    {external && <ExternalLink size={13} className="mt-0.5 shrink-0 text-muted" />}
                  </Wrapper>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
