"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
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

/// Builds a patch with only the fields that actually differ from the
/// original — matches the backend's COALESCE-partial-update shape, and
/// keeps the audit log entry limited to what really changed.
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
  const [saveError, setSaveError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

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
    try {
      const patch = buildPatch(product, form);
      const updated = await api.products.update(token, id, patch);
      setProduct(updated);
      setForm(toForm(updated));
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

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-8 py-10">
        <Skeleton className="h-4 w-32" />
        <div className="mt-4 flex flex-col gap-8 sm:flex-row">
          <div className="min-w-0 flex-1 space-y-3">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
          <aside className="w-full shrink-0 sm:w-56">
            <div className="rounded-xl border border-line p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-3 border-b border-line py-2.5 last:border-0">
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
      <main className="mx-auto max-w-4xl px-8 py-10">
        <p className="text-sm text-red-400">{error ?? "Not found."}</p>
        <BackLink />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-8 py-10">
      <BackLink />

      <div className="mt-4 flex flex-col gap-8 sm:flex-row">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-medium text-fg">{product.product_name}</h1>
          <p className="mt-1 font-mono text-xs text-muted">
            {product.barcode} · {product.country.toUpperCase()} · {product.source}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <Field label="Name">
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
              />
            </Field>
            <Field label="Category">
              <input
                value={form.category}
                disabled={!canEdit || saving}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Quantity">
              <input
                value={form.quantity}
                disabled={!canEdit || saving}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className={inputClass}
                placeholder="e.g. 200 g"
              />
            </Field>
            <Field label="Image URL" span2>
              <input
                value={form.image_url}
                disabled={!canEdit || saving}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                className={inputClass}
              />
            </Field>
          </div>

          <div className="mt-4">
            <Field label="Ingredients">
              <textarea
                value={form.ingredients}
                disabled={!canEdit || saving}
                onChange={(e) => setForm({ ...form, ingredients: e.target.value })}
                rows={3}
                className={`${inputClass} h-auto resize-y py-2`}
              />
            </Field>
          </div>

          <div className="mt-4">
            <Field label="Allergens (comma-separated)">
              <input
                value={form.allergens}
                disabled={!canEdit || saving}
                onChange={(e) => setForm({ ...form, allergens: e.target.value })}
                className={inputClass}
                placeholder="milk, soybeans"
              />
            </Field>
          </div>

          <div className="mt-6">
            <p className="mb-2 text-xs font-medium text-muted">Nutrition facts (JSON, per 100g)</p>
            <textarea
              value={form.nutrition_facts}
              disabled={!canEdit || saving}
              onChange={(e) => setForm({ ...form, nutrition_facts: e.target.value })}
              rows={10}
              className="w-full resize-y rounded-lg border border-line bg-surface p-3 font-mono text-xs text-fg outline-none focus:border-accent disabled:opacity-60"
            />
          </div>

          <div className="mt-4">
            <p className="mb-2 text-xs font-medium text-muted">Additives (JSON array)</p>
            <textarea
              value={form.additives}
              disabled={!canEdit || saving}
              onChange={(e) => setForm({ ...form, additives: e.target.value })}
              rows={3}
              className="w-full resize-y rounded-lg border border-line bg-surface p-3 font-mono text-xs text-fg outline-none focus:border-accent disabled:opacity-60"
            />
          </div>
        </div>

        <aside className="w-full shrink-0 sm:w-64">
          <div className="rounded-xl border border-line p-4">
            <Property label="Verified">
              <div className="flex items-center gap-2">
                <VerifiedBadge verified={product.verified} />
              </div>
            </Property>
            <Property label="NOVA group">
              <select
                value={form.nova_group}
                disabled={!canEdit || saving}
                onChange={(e) => setForm({ ...form, nova_group: e.target.value })}
                className="h-7 rounded-md border border-line bg-surface px-1.5 text-xs text-fg outline-none focus:border-accent disabled:opacity-60"
              >
                <option value="">—</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
              </select>
            </Property>
            <Property label="Nutri-Score">
              <select
                value={form.nutriscore_grade}
                disabled={!canEdit || saving}
                onChange={(e) => setForm({ ...form, nutriscore_grade: e.target.value })}
                className="h-7 rounded-md border border-line bg-surface px-1.5 text-xs text-fg uppercase outline-none focus:border-accent disabled:opacity-60"
              >
                <option value="">—</option>
                {["a", "b", "c", "d", "e"].map((g) => (
                  <option key={g} value={g}>
                    {g}
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
              label="Palm oil free"
              value={form.is_palm_oil_free}
              disabled={!canEdit || saving}
              onChange={(v) => setForm({ ...form, is_palm_oil_free: v })}
            />
            <Property label="Lookups">{product.verification_count} crowd verifications</Property>
            <Property label="Updated">{new Date(product.updated_at).toLocaleDateString()}</Property>
          </div>

          <div className="mt-3 flex flex-col gap-2">
            {canEdit ? (
              <button
                onClick={save}
                disabled={saving || verifying}
                aria-busy={saving ? "true" : undefined}
                className="flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-fg text-sm font-medium text-bg transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving && <Loader2 size={14} className="animate-spin shrink-0" />}
                <span>{saving ? "Saving changes…" : "Save changes"}</span>
              </button>
            ) : (
              <p className="text-xs text-muted">You don't have permission to edit products.</p>
            )}
            {canVerify && (
              <button
                onClick={toggleVerified}
                disabled={verifying || saving}
                aria-busy={verifying ? "true" : undefined}
                className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-line text-sm text-fg transition-all hover:border-fg/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {verifying && <Loader2 size={14} className="animate-spin shrink-0" />}
                <span>{verifying ? "Updating…" : product.verified ? "Mark unverified" : "Mark verified"}</span>
              </button>
            )}
            {saveError && <p className="text-xs text-red-400">{saveError}</p>}
          </div>
        </aside>
      </div>
    </main>
  );
}

const inputClass =
  "h-9 w-full rounded-md border border-line bg-surface px-2.5 text-sm text-fg outline-none focus:border-accent disabled:opacity-60";

function BackLink() {
  return (
    <Link
      href="/dashboard/products"
      className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-fg"
    >
      <ArrowLeft size={14} />
      Products
    </Link>
  );
}

function Field({ label, children, span2 }: { label: string; children: React.ReactNode; span2?: boolean }) {
  return (
    <label className={`block ${span2 ? "col-span-2" : ""}`}>
      <span className="mb-1 block text-xs text-muted">{label}</span>
      {children}
    </label>
  );
}

function Property({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line py-2.5 text-sm last:border-0">
      <span className="shrink-0 text-xs text-muted">{label}</span>
      <span className="min-w-0 truncate text-right text-fg">{children}</span>
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
        className="h-7 rounded-md border border-line bg-surface px-1.5 text-xs text-fg outline-none focus:border-accent disabled:opacity-60"
      >
        <option value="unknown">Unknown</option>
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
    </Property>
  );
}
