"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { VerifiedBadge } from "../../components/badges";
import { SkeletonRows } from "../../components/skeleton";
import { api, type Product } from "../../../lib/api";
import { useAuth } from "../../../lib/auth-context";

const PAGE_SIZE = 20;

export default function ProductsPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [verified, setVerified] = useState<"" | "true" | "false">("");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setOffset(0);
      setDebouncedQ(q);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError(null);
    api.products
      .list(token, {
        q: debouncedQ || undefined,
        verified: verified === "" ? undefined : verified === "true",
        limit: PAGE_SIZE,
        offset,
      })
      .then((page) => {
        setItems(page.items);
        setTotal(page.total);
      })
      .catch(() => setError("Couldn't load products."))
      .finally(() => setLoading(false));
  }, [token, verified, debouncedQ, offset]);

  return (
    <main className="mx-auto max-w-5xl px-8 py-10">
      <div>
        <h1 className="text-xl font-medium text-fg">Products</h1>
        <p className="mt-1 text-sm text-muted">{total} total</p>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search size={13} className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, brand, barcode…"
            className="h-8 w-64 rounded-md border border-line bg-surface pr-2.5 pl-7 text-xs text-fg outline-none placeholder:text-muted/60 focus:border-accent"
          />
        </div>
        <select
          value={verified}
          onChange={(e) => {
            setOffset(0);
            setVerified(e.target.value as "" | "true" | "false");
          }}
          aria-label="Verified"
          className="h-8 rounded-md border border-line bg-surface px-2.5 text-xs text-fg outline-none focus:border-accent"
        >
          <option value="">All products</option>
          <option value="true">Verified only</option>
          <option value="false">Unverified only</option>
        </select>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-line">
        {loading ? (
          <SkeletonRows rows={8} cols={5} />
        ) : error ? (
          <p className="p-6 text-sm text-red-400">{error}</p>
        ) : items.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted">No products match these filters.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-muted">
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium">Brand</th>
                <th className="px-4 py-2.5 font-medium">Barcode</th>
                <th className="px-4 py-2.5 font-medium">Country</th>
                <th className="px-4 py-2.5 font-medium">Verified</th>
              </tr>
            </thead>
            <tbody>
              {items.map((product) => (
                <tr
                  key={product.id}
                  onClick={() => router.push(`/dashboard/products/${product.id}`)}
                  className="cursor-pointer border-b border-line last:border-0 hover:bg-fg/[0.03]"
                >
                  <td className="max-w-xs truncate px-4 py-3 text-fg">{product.product_name}</td>
                  <td className="max-w-[160px] truncate px-4 py-3 text-muted">{product.brand ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-muted">{product.barcode}</span>
                  </td>
                  <td className="px-4 py-3 text-muted uppercase">{product.country}</td>
                  <td className="px-4 py-3">
                    <VerifiedBadge verified={product.verified} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <button
          onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
          disabled={offset === 0}
          className="text-muted transition-colors hover:text-fg disabled:opacity-30"
        >
          ← Previous
        </button>
        <span className="text-xs text-muted">
          {total === 0 ? 0 : offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total}
        </span>
        <button
          onClick={() => setOffset(offset + PAGE_SIZE)}
          disabled={offset + PAGE_SIZE >= total}
          className="text-muted transition-colors hover:text-fg disabled:opacity-30"
        >
          Next →
        </button>
      </div>
    </main>
  );
}
