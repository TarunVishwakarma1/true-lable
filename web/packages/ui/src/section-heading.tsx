import { Reveal } from "./reveal";

export function SectionHeading({
  index,
  label,
  title,
  body,
}: {
  index: string;
  label: string;
  title: string;
  body?: string;
}) {
  return (
    <Reveal className="grid gap-6 border-t border-line pt-6 md:grid-cols-12 md:gap-8">
      <p className="font-mono text-xs text-muted md:col-span-3">
        <span className="tabular-nums">{index}</span>
        <span className="mx-2">/</span>
        {label}
      </p>
      <div className="md:col-span-9">
        <h2 className="max-w-4xl text-4xl font-medium tracking-[-0.03em] text-balance sm:text-5xl lg:text-[3.75rem] lg:leading-[1.02]">
          {title}
        </h2>
        {body && <p className="mt-6 max-w-2xl text-lg leading-relaxed text-pretty text-muted">{body}</p>}
      </div>
    </Reveal>
  );
}
