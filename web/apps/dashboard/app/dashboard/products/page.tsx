"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Globe2, Loader2, Package, Search } from "lucide-react";
import { VerifiedBadge } from "../../components/badges";
import { SkeletonRows } from "../../components/skeleton";
import { api, type Product } from "../../../lib/api";
import { useAuth } from "../../../lib/auth-context";

const PAGE_SIZE = 25;

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

  const isSearching = q !== debouncedQ;

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
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {/* Title Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-fg">Products</h1>
          <p className="mt-1 text-xs text-muted">
            {total} items in verified food catalog
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {/* Verification Status Pill Filter */}
        <div className="flex items-center gap-1 rounded-full border border-line bg-surface p-0.5">
          <button
            onClick={() => {
              setOffset(0);
              setVerified("");
            }}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
              verified === ""
                ? "bg-fg text-bg shadow-xs"
                : "text-muted hover:text-fg"
            }`}
          >
            All products
          </button>
          <button
            onClick={() => {
              setOffset(0);
              setVerified("true");
            }}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
              verified === "true"
                ? "bg-fg text-bg shadow-xs"
                : "text-muted hover:text-fg"
            }`}
          >
            Verified only
          </button>
          <button
            onClick={() => {
              setOffset(0);
              setVerified("false");
            }}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
              verified === "false"
                ? "bg-fg text-bg shadow-xs"
                : "text-muted hover:text-fg"
            }`}
          >
            Unverified
          </button>
        </div>

        {/* Search */}
        <div className="relative ml-auto">
          <Search size={12} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search barcode, product name, brand…"
            className="h-8 w-64 rounded-full border border-line bg-surface pr-8 pl-8 text-xs text-fg placeholder:text-muted/60 outline-none transition-colors focus:border-accent"
          />
          {(loading || isSearching) && (
            <Loader2 size={12} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 animate-spin text-muted" />
          )}
        </div>
      </div>

      {/* Catalog Table */}
      <div className="mt-4 overflow-hidden rounded-xl border border-line bg-surface">
        {loading ? (
          <SkeletonRows rows={8} cols={6} />
        ) : error ? (
          <p className="p-6 text-sm text-rose-500">{error}</p>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <Package size={24} className="mx-auto text-muted" />
            <p className="mt-2 text-sm text-muted">No products match these filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-xs">
            <thead>
              <tr className="border-b border-line bg-fg/[0.02] text-[11px] font-medium tracking-wider text-muted uppercase">
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">Brand</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Country</th>
                <th className="px-5 py-3">Verification</th>
                <th className="px-5 py-3">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.map((product) => (
                <tr
                  key={product.id}
                  onClick={() => router.push(`/dashboard/products/${product.id}`)}
                  className="cursor-pointer transition-colors hover:bg-fg/[0.03]"
                >
                  <td className="max-w-[260px] px-5 py-3.5">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-fg hover:underline">{product.product_name}</p>
                      <p className="mt-0.5 font-mono text-[11px] text-muted">-o- {product.barcode}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-muted">{product.brand ?? "—"}</td>
                  <td className="px-5 py-3.5 text-muted">{product.category ?? "—"}</td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1 rounded-md border border-line bg-fg/[0.03] px-2 py-0.5 text-[10px] uppercase tracking-wider text-fg">
                      <Globe2 size={10} className="text-muted" />
                      {product.country}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <VerifiedBadge verified={product.verified} />
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-muted text-[11px]">
                    {new Date(product.updated_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="mt-4 flex items-center justify-between text-xs text-muted">
        <button
          onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
          disabled={offset === 0 || loading}
          className="inline-flex items-center gap-1 rounded-md border border-line bg-surface px-3 py-1.5 font-medium text-fg transition-colors hover:border-fg/20 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={13} />
          <span>Previous</span>
        </button>
        <span className="text-[11px] text-muted font-mono">
          Showing {total === 0 ? 0 : offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total}
        </span>
        <button
          onClick={() => setOffset(offset + PAGE_SIZE)}
          disabled={offset + PAGE_SIZE >= total || loading}
          className="inline-flex items-center gap-1 rounded-md border border-line bg-surface px-3 py-1.5 font-medium text-fg transition-colors hover:border-fg/20 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <span>Next</span>
          <ChevronRight size={13} />
        </button>
      </div>
    </main>
  );
}
