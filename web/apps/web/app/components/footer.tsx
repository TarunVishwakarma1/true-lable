import { NAV, REPO_URL } from "../lib/site";
import { Container } from "@repo/ui/container";
import { NewsletterForm } from "./newsletter-form";

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

export function Footer() {
  return (
    <footer className="border-t border-line pt-16 pb-8">
      <Container>
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-8">
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
          <p>This site stores one thing in your browser: your theme.</p>
        </div>
      </Container>
    </footer>
  );
}
