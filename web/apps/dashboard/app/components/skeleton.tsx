export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`shimmer rounded-[6px] ${className}`} />;
}

// Uneven widths on purpose: a loading table of identical bars reads as a
// pattern, not as rows of text about to arrive.
const WIDTH_CLASSES = [
  "w-3/4 max-w-[140px]",
  "w-1/2 max-w-[100px]",
  "w-2/3 max-w-[120px]",
  "w-4/5 max-w-[160px]",
  "w-1/3 max-w-[80px]",
];

export function SkeletonRows({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <table className="w-full">
      <tbody>
        {Array.from({ length: rows }).map((_, i) => (
          <tr key={i} className="border-b border-line-subtle last:border-0">
            {Array.from({ length: cols }).map((_, j) => {
              const widthClass = WIDTH_CLASSES[(i + j) % WIDTH_CLASSES.length];
              return (
                <td key={j} className="px-5 py-4">
                  <Skeleton className={`h-3 ${widthClass}`} />
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
