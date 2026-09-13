import type { ReactNode } from "react";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { source } from "@/lib/source";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.pageTree}
      nav={{
        title: (
          <span className="font-semibold tracking-tight">
            True<span className="text-fd-primary">Label</span> <span className="text-fd-muted-foreground font-normal">docs</span>
          </span>
        ),
        url: "/docs",
      }}
      links={[
        {
          text: "GitHub",
          url: "https://github.com/TarunVishwakarma1/true-lable",
          external: true,
        },
      ]}
    >
      {children}
    </DocsLayout>
  );
}
