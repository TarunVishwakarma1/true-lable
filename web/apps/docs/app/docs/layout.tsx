import type { ReactNode } from "react";
import Image from "next/image";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { source } from "@/lib/source";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.pageTree}
      nav={{
        title: (
          <span className="flex items-center gap-2 font-semibold tracking-tight">
            <Image src="/brand/logo-light.png" alt="" width={128} height={128} className="h-6 w-6 rounded-md dark:hidden" />
            <Image src="/brand/logo-dark.png" alt="" width={128} height={128} className="hidden h-6 w-6 rounded-md dark:block" />
            <span className="text-fd-muted-foreground font-normal">docs</span>
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
