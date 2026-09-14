export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-fg/[0.06] ${className}`} />;
}

export function SkeletonRows({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <table className="w-full text-sm">
      <tbody>
        {Array.from({ length: rows }).map((_, i) => (
          <tr key={i} className="border-b border-line last:border-0">
            {Array.from({ length: cols }).map((_, j) => (
              <td key={j} className="px-4 py-3">
                <Skeleton className="h-4 w-full max-w-[160px]" />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
