"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Copy, ExternalLink, Globe2, Loader2, Sparkles } from "lucide-react";
import { VerifiedBadge } from "../../../components/badges";
import { Skeleton } from "../../../components/skeleton";
import { ApiError, api, type AdminUpdateProductInput, type Product } from "../../../../lib/api";
import { useAuth } from "../../../../lib/auth-context";

interface FormState {
  product_name: string;
  brand: string;
  category: string;
  ingredients: string;
  allergens: string;
  image_url: string;
  quantity: string;
  nova_group: string;
  nutriscore_grade: string;
  is_vegan: string;
  is_vegetarian: string;
  is_palm_oil_free: string;
  nutrition_facts: string;
  additives: string;
}

function toForm(p: Product): FormState {
  return {
    product_name: p.product_name,
    brand: p.brand ?? "",
    category: p.category ?? "",
    ingredients: p.ingredients ?? "",
    allergens: (p.allergens_tags ?? []).join(", "),
    image_url: p.image_url ?? "",
    quantity: p.quantity ?? "",
    nova_group: p.nova_group?.toString() ?? "",
    nutriscore_grade: p.nutriscore_grade ?? "",
    is_vegan: p.is_vegan === null ? "unknown" : String(p.is_vegan),
    is_vegetarian: p.is_vegetarian === null ? "unknown" : String(p.is_vegetarian),
    is_palm_oil_free: p.is_palm_oil_free === null ? "unknown" : String(p.is_palm_oil_free),
    nutrition_facts: JSON.stringify(p.nutrition_facts, null, 2),
    additives: JSON.stringify(p.additives ?? [], null, 2),
  };
}

function buildPatch(original: Product, form: FormState): AdminUpdateProductInput {
  const patch: AdminUpdateProductInput = {};
  if (form.product_name !== original.product_name) patch.product_name = form.product_name;
  if (form.brand !== (original.brand ?? "")) patch.brand = form.brand;
  if (form.category !== (original.category ?? "")) patch.category = form.category;
  if (form.ingredients !== (original.ingredients ?? "")) patch.ingredients = form.ingredients;
  if (form.image_url !== (original.image_url ?? "")) patch.image_url = form.image_url;
  if (form.quantity !== (original.quantity ?? "")) patch.quantity = form.quantity;

  const originalAllergens = (original.allergens_tags ?? []).join(", ");
  if (form.allergens !== originalAllergens) {
    patch.allergens = form.allergens
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  }

  const originalNova = original.nova_group?.toString() ?? "";
  if (form.nova_group !== originalNova && form.nova_group !== "") patch.nova_group = Number(form.nova_group);

  if (form.nutriscore_grade !== (original.nutriscore_grade ?? "") && form.nutriscore_grade !== "")
    patch.nutriscore_grade = form.nutriscore_grade;

  const originalVegan = original.is_vegan === null ? "unknown" : String(original.is_vegan);
  if (form.is_vegan !== originalVegan && form.is_vegan !== "unknown") patch.is_vegan = form.is_vegan === "true";

  const originalVegetarian = original.is_vegetarian === null ? "unknown" : String(original.is_vegetarian);
  if (form.is_vegetarian !== originalVegetarian && form.is_vegetarian !== "unknown")
    patch.is_vegetarian = form.is_vegetarian === "true";

  const originalPalmOilFree = original.is_palm_oil_free === null ? "unknown" : String(original.is_palm_oil_free);
  if (form.is_palm_oil_free !== originalPalmOilFree && form.is_palm_oil_free !== "unknown")
    patch.is_palm_oil_free = form.is_palm_oil_free === "true";

  const originalNutritionFacts = JSON.stringify(original.nutrition_facts, null, 2);
  if (form.nutrition_facts !== originalNutritionFacts) {
    patch.nutrition_facts = JSON.parse(form.nutrition_facts);
  }

  const originalAdditives = JSON.stringify(original.additives ?? [], null, 2);
  if (form.additives !== originalAdditives) {
    patch.additives = JSON.parse(form.additives);
  }

  return patch;
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token, profile } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [copiedBarcode, setCopiedBarcode] = useState(false);

  const canEdit = profile?.role === "admin" || profile?.can_edit_products === true;
  const canVerify = profile?.role === "admin";

  useEffect(() => {
    if (!token) return;
    api.products
      .get(token, id)
      .then((p) => {
        setProduct(p);
        setForm(toForm(p));
      })
      .catch(() => setError("Couldn't load this product."))
      .finally(() => setLoading(false));
  }, [token, id]);

  async function save() {
    if (!token || !product || !form) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const patch = buildPatch(product, form);
      const updated = await api.products.update(token, id, patch);
      setProduct(updated);
      setForm(toForm(updated));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(
        err instanceof SyntaxError
          ? "Nutrition facts / additives must be valid JSON."
          : err instanceof ApiError
            ? err.message
            : "Couldn't save these changes.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleVerified() {
    if (!token || !product) return;
    setVerifying(true);
    try {
      const updated = await api.products.verify(token, id, !product.verified);
      setProduct(updated);
    } catch {
      setSaveError("Couldn't change verification status.");
    } finally {
      setVerifying(false);
    }
  }

  function copyBarcode() {
    if (!product?.barcode) return;
    navigator.clipboard.writeText(product.barcode);
    setCopiedBarcode(true);
    setTimeout(() => setCopiedBarcode(false), 2000);
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Skeleton className="h-4 w-32" />
        <div className="mt-6 flex flex-col gap-8 lg:flex-row">
          <div className="min-w-0 flex-1 space-y-4">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
          <aside className="w-full shrink-0 lg:w-72">
            <div className="rounded-xl border border-line bg-surface p-5 space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-3 border-b border-line pb-3 last:border-0 last:pb-0">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
            </div>
          </aside>
        </div>
      </main>
    );
  }

  if (error || !product || !form) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-6 text-sm text-rose-500">
          {error ?? "Product not found."}
        </div>
        <div className="mt-4">
          <BackLink />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="flex items-center justify-between">
        <BackLink />
        <div className="flex items-center gap-2">
          {canVerify && (
            <button
              onClick={toggleVerified}
              disabled={verifying || saving}
              aria-busy={verifying ? "true" : undefined}
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full border border-line bg-surface px-3.5 text-xs font-medium text-fg transition-all hover:border-fg/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {verifying ? (
                <Loader2 size={12} className="animate-spin text-muted" />
              ) : (
                <Sparkles size={12} className={product.verified ? "text-amber-500" : "text-muted"} />
              )}
              <span>{verifying ? "Updating…" : product.verified ? "Revoke Verification" : "Verify Product"}</span>
            </button>
          )}
          {canEdit && (
            <button
              onClick={save}
              disabled={saving || verifying}
              aria-busy={saving ? "true" : undefined}
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full bg-fg px-4 text-xs font-medium text-bg transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
            >
              {saving ? (
                <Loader2 size={12} className="animate-spin text-bg" />
              ) : saveSuccess ? (
                <Check size={12} className="text-emerald-500" />
              ) : null}
              <span>{saving ? "Saving…" : saveSuccess ? "Saved!" : "Save Changes"}</span>
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-8 lg:flex-row">
        {/* Main Content Area */}
        <div className="min-w-0 flex-1 space-y-6">
          {/* Header Title Card */}
          <div className="rounded-xl border border-line bg-surface p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-semibold tracking-tight text-fg">{product.product_name}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <button
                    onClick={copyBarcode}
                    className="inline-flex items-center gap-1.5 rounded-md border border-line bg-fg/[0.03] px-2 py-0.5 font-mono text-[11px] text-fg transition-colors hover:border-fg/20"
                  >
                    <span>-o- {product.barcode}</span>
                    {copiedBarcode ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} className="text-muted" />}
                  </button>
                  <span className="inline-flex items-center gap-1 rounded-md border border-line bg-fg/[0.03] px-2 py-0.5 uppercase tracking-wider text-[10px] text-muted">
                    <Globe2 size={10} className="text-muted" />
                    {product.country}
                  </span>
                  <span className="rounded-md border border-line bg-fg/[0.03] px-2 py-0.5 text-[11px] text-muted">
                    {product.source}
                  </span>
                </div>
              </div>
              {product.image_url && (
                <a
                  href={product.image_url}
                  target="_blank"
                  rel="noreferrer"
                  className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-line bg-bg"
                >
                  <img
                    src={product.image_url}
                    alt={product.product_name}
                    className="h-full w-full object-contain p-1 transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                    <ExternalLink size={12} className="text-white" />
                  </div>
                </a>
              )}
            </div>
          </div>

          {/* Core Specifications */}
          <div className="rounded-xl border border-line bg-surface p-6 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">Core Attributes</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Product Name">
                <input
                  value={form.product_name}
                  disabled={!canEdit || saving}
                  onChange={(e) => setForm({ ...form, product_name: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Brand">
                <input
                  value={form.brand}
                  disabled={!canEdit || saving}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  className={inputClass}
                  placeholder="e.g. Nestlé, Oatly"
                />
              </Field>
              <Field label="Category">
                <input
                  value={form.category}
                  disabled={!canEdit || saving}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className={inputClass}
                  placeholder="e.g. Beverages, Snacks"
                />
              </Field>
              <Field label="Net Quantity">
                <input
                  value={form.quantity}
                  disabled={!canEdit || saving}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  className={inputClass}
                  placeholder="e.g. 250 ml / 500 g"
                />
              </Field>
              <Field label="Image URL" span2>
                <input
                  value={form.image_url}
                  disabled={!canEdit || saving}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  className={inputClass}
                  placeholder="https://images.openfoodfacts.org/..."
                />
              </Field>
            </div>

            <div className="pt-2">
              <Field label="Ingredients List">
                <textarea
                  value={form.ingredients}
                  disabled={!canEdit || saving}
                  onChange={(e) => setForm({ ...form, ingredients: e.target.value })}
                  rows={3}
                  className={`${inputClass} h-auto resize-y py-2.5 leading-relaxed`}
                  placeholder="Water, oats (10%), rapeseed oil, dipotassium phosphate..."
                />
              </Field>
            </div>

            <div>
              <Field label="Allergens (comma-separated tags)">
                <input
                  value={form.allergens}
                  disabled={!canEdit || saving}
                  onChange={(e) => setForm({ ...form, allergens: e.target.value })}
                  className={inputClass}
                  placeholder="milk, soybeans, gluten"
                />
              </Field>
            </div>
          </div>

          {/* Structured Nutrition Payload */}
          <div className="rounded-xl border border-line bg-surface p-6 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">Structured Nutritional Payload</h2>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-fg">Nutrition facts (JSON, per 100g)</span>
                <span className="font-mono text-[10px] text-muted">application/json</span>
              </div>
              <textarea
                value={form.nutrition_facts}
                disabled={!canEdit || saving}
                onChange={(e) => setForm({ ...form, nutrition_facts: e.target.value })}
                rows={8}
                className="w-full resize-y rounded-lg border border-line bg-bg p-3 font-mono text-xs text-fg outline-none transition-colors focus:border-accent disabled:opacity-50"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-fg">Additives (JSON array)</span>
                <span className="font-mono text-[10px] text-muted">string[]</span>
              </div>
              <textarea
                value={form.additives}
                disabled={!canEdit || saving}
                onChange={(e) => setForm({ ...form, additives: e.target.value })}
                rows={3}
                className="w-full resize-y rounded-lg border border-line bg-bg p-3 font-mono text-xs text-fg outline-none transition-colors focus:border-accent disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Sidebar Specifications */}
        <aside className="w-full shrink-0 lg:w-80 space-y-4">
          <div className="rounded-xl border border-line bg-surface p-5">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted">Classification</h2>
            <div className="divide-y divide-line">
              <Property label="Verification">
                <VerifiedBadge verified={product.verified} />
              </Property>

              <Property label="NOVA Group">
                <select
                  value={form.nova_group}
                  disabled={!canEdit || saving}
                  onChange={(e) => setForm({ ...form, nova_group: e.target.value })}
                  className="h-7 rounded-md border border-line bg-surface px-2 text-xs text-fg outline-none focus:border-accent disabled:opacity-50"
                >
                  <option value="">Unrated</option>
                  <option value="1">1 (Unprocessed)</option>
                  <option value="2">2 (Processed culinary)</option>
                  <option value="3">3 (Processed)</option>
                  <option value="4">4 (Ultra-processed)</option>
                </select>
              </Property>

              <Property label="Nutri-Score">
                <select
                  value={form.nutriscore_grade}
                  disabled={!canEdit || saving}
                  onChange={(e) => setForm({ ...form, nutriscore_grade: e.target.value })}
                  className="h-7 rounded-md border border-line bg-surface px-2 text-xs uppercase text-fg outline-none focus:border-accent disabled:opacity-50"
                >
                  <option value="">—</option>
                  {["a", "b", "c", "d", "e"].map((g) => (
                    <option key={g} value={g}>
                      Grade {g.toUpperCase()}
                    </option>
                  ))}
                </select>
              </Property>

              <TriStateProperty
                label="Vegan"
                value={form.is_vegan}
                disabled={!canEdit || saving}
                onChange={(v) => setForm({ ...form, is_vegan: v })}
              />
              <TriStateProperty
                label="Vegetarian"
                value={form.is_vegetarian}
                disabled={!canEdit || saving}
                onChange={(v) => setForm({ ...form, is_vegetarian: v })}
              />
              <TriStateProperty
                label="Palm Oil Free"
                value={form.is_palm_oil_free}
                disabled={!canEdit || saving}
                onChange={(v) => setForm({ ...form, is_palm_oil_free: v })}
              />
              <Property label="Crowd Lookups">
                <span className="font-mono text-xs text-fg">{product.verification_count}</span>
              </Property>
              <Property label="Last Updated">
                <span className="text-xs text-muted">{new Date(product.updated_at).toLocaleDateString()}</span>
              </Property>
            </div>
          </div>

          {saveError && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-xs text-rose-500 leading-relaxed">
              {saveError}
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}

const inputClass =
  "h-9 w-full rounded-lg border border-line bg-surface px-3 text-xs text-fg outline-none transition-colors placeholder:text-muted/60 focus:border-accent disabled:opacity-50";

function BackLink() {
  return (
    <Link
      href="/dashboard/products"
      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-muted transition-colors hover:border-fg/20 hover:text-fg"
    >
      <ArrowLeft size={12} />
      <span>Back to Products</span>
    </Link>
  );
}

function Field({ label, children, span2 }: { label: string; children: React.ReactNode; span2?: boolean }) {
  return (
    <label className={`block ${span2 ? "sm:col-span-2" : ""}`}>
      <span className="mb-1.5 block text-xs font-medium text-fg">{label}</span>
      {children}
    </label>
  );
}

function Property({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 text-xs">
      <span className="shrink-0 text-muted">{label}</span>
      <div className="min-w-0 text-right">{children}</div>
    </div>
  );
}

function TriStateProperty({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  disabled: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <Property label={label}>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 rounded-md border border-line bg-surface px-2 text-xs text-fg outline-none focus:border-accent disabled:opacity-50"
      >
        <option value="unknown">Unknown</option>
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
    </Property>
  );
}
