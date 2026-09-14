"use client";

import { useEffect, useId, useState } from "react";
import { useTheme } from "next-themes";

/// Renders a ```mermaid fence as an actual diagram instead of a syntax-
/// highlighted code block — mdx-components.tsx's `pre` override routes
/// language-mermaid blocks here. Client-only: mermaid.render() builds an
/// SVG by walking the DOM, so this can't run at build/server time.
export function Mermaid({ chart }: { chart: string }) {
  const id = useId().replace(/:/g, "-");
  const { resolvedTheme } = useTheme();
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    import("mermaid").then(async ({ default: mermaid }) => {
      mermaid.initialize({
        startOnLoad: false,
        // Matches the docs site's own theme, not just a static choice —
        // RootProvider (app/layout.tsx) drives the same next-themes state.
        theme: resolvedTheme === "light" ? "default" : "dark",
        securityLevel: "strict",
      });
      try {
        const { svg: rendered } = await mermaid.render(`mermaid-${id}`, chart);
        if (!cancelled) setSvg(rendered);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "diagram failed to render");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [chart, id, resolvedTheme]);

  if (error) {
    // Fails loud rather than silently reverting to a plain code block —
    // a broken diagram should look broken, not quietly pass as "fine".
    return (
      <pre className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
        Mermaid render error: {error}
      </pre>
    );
  }

  if (!svg) {
    return <div className="my-4 h-32 animate-pulse rounded-lg bg-fd-muted" />;
  }

  return (
    // The chart source is this repo's own MDX content, never user input —
    // same trust boundary as the theme-boot inline scripts elsewhere in
    // this workspace (see apps/web/app/layout.tsx).
    // eslint-disable-next-line react/no-danger
    <div className="my-4 flex justify-center overflow-x-auto" dangerouslySetInnerHTML={{ __html: svg }} />
  );
}
