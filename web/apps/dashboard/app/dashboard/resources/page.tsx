"use client";

import Link from "next/link";
import { ArrowUpRight, BookOpen, Code2, ExternalLink, FileText, FolderGit2, Shield, Sparkles, Terminal } from "lucide-react";

const REPO_URL = "https://github.com/TarunVishwakarma1/true-lable";
const DOCS_URL = process.env.NEXT_PUBLIC_DOCS_URL ?? "http://localhost:3001";

interface ResourceLink {
  label: string;
  href: string;
  description: string;
  icon?: any;
}

const GROUPS: { title: string; links: ResourceLink[] }[] = [
  {
    title: "Newcomers",
    links: [
      {
        label: "Getting Started",
        href: `${DOCS_URL}/docs/getting-started`,
        description: "Run the backend, iOS app, and web apps locally",
        icon: Terminal,
      },
      {
        label: "Architecture",
        href: `${DOCS_URL}/docs/architecture`,
        description: "How the three apps fit together",
        icon: Code2,
      },
    ],
  },
  {
    title: "Contributors",
    links: [
      {
        label: "Contributing guide",
        href: `${DOCS_URL}/docs/contributing`,
        description: "Branch strategy and pre-PR checklists",
        icon: BookOpen,
      },
      {
        label: "API Reference",
        href: `${DOCS_URL}/docs/backend/api-reference/products`,
        description: "The full backend contract",
        icon: FileText,
      },
      {
        label: "Open an issue",
        href: `${REPO_URL}/issues/new/choose`,
        description: "Bug, feature, or chore templates",
        icon: FolderGit2,
      },
    ],
  },
  {
    title: "Staff",
    links: [
      {
        label: "Team",
        href: "/dashboard/team",
        description: "Who has dashboard access",
        icon: Shield,
      },
      {
        label: "Deployment",
        href: `${DOCS_URL}/docs/deployment`,
        description: "How production is actually run",
        icon: Sparkles,
      },
    ],
  },
  {
    title: "Everyone",
    links: [
      {
        label: "GitHub repository",
        href: REPO_URL,
        description: "Source, issues, and pull requests",
        icon: FolderGit2,
      },
      {
        label: "Developer docs",
        href: DOCS_URL,
        description: "The full documentation site",
        icon: BookOpen,
      },
    ],
  },
];

export default function ResourcesPage() {
  return (
    <main className="mx-auto max-w-6xl px-8 py-8">
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-fg">Resources</h1>
        <p className="mt-1 text-xs text-muted">
          Where to go next, by what you're trying to do.
        </p>
      </div>

      {/* Resource Sections */}
      <div className="mt-8 space-y-8">
        {GROUPS.map((group) => (
          <div key={group.title}>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
              {group.title}
            </h2>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {group.links.map((link) => {
                const external = link.href.startsWith("http");
                const Wrapper = external ? "a" : Link;
                const IconComponent = link.icon ?? BookOpen;

                return (
                  <Wrapper
                    key={link.href}
                    href={link.href}
                    {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
                    className="group flex items-start justify-between gap-3 rounded-xl border border-line bg-surface p-4 transition-all hover:border-fg/20 hover:bg-fg/[0.02]"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-fg/[0.03] text-muted transition-colors group-hover:border-fg/20 group-hover:text-fg">
                        <IconComponent size={15} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-fg transition-colors group-hover:text-fg">
                          {link.label}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-muted">{link.description}</p>
                      </div>
                    </div>
                    {external ? (
                      <ArrowUpRight size={14} className="mt-0.5 shrink-0 text-muted transition-colors group-hover:text-fg" />
                    ) : (
                      <ExternalLink size={13} className="mt-0.5 shrink-0 text-muted transition-colors group-hover:text-fg" />
                    )}
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
