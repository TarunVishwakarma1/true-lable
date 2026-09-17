export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-fg/[0.07] ${className}`} />;
}

const WIDTH_CLASSES = [
  "w-3/4 max-w-[140px]",
  "w-1/2 max-w-[100px]",
  "w-2/3 max-w-[120px]",
  "w-4/5 max-w-[160px]",
  "w-1/3 max-w-[80px]",
];

export function SkeletonRows({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <table className="w-full text-sm">
      <tbody>
        {Array.from({ length: rows }).map((_, i) => (
          <tr key={i} className="border-b border-line last:border-0">
            {Array.from({ length: cols }).map((_, j) => {
              const widthClass = WIDTH_CLASSES[(i + j) % WIDTH_CLASSES.length];
              return (
                <td key={j} className="px-4 py-3.5">
                  <Skeleton className={`h-3.5 ${widthClass}`} />
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

