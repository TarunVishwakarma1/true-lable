// A packet's back-of-pack label, the way it's actually printed in India: tiny, dense,
// and legally complete. Rendered in DOM so it stays crisp and selectable.
export function LabelCard({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-[#f4efe2] p-5 text-[#2a2620] ring-1 ring-black/10 ${className}`} data-cursor="scan">
      <div className="flex items-start justify-between gap-4 border-b border-black/20 pb-2">
        <div>
          <p className="font-mono text-[10px] font-semibold tracking-[0.12em] uppercase">Nutrition information</p>
          <p className="font-mono text-[8px] text-[#6b6357]">Per 100 g · Approx. values*</p>
        </div>
        <span className="flex items-center gap-1 font-mono text-[8px]">
          <span className="flex h-3 w-3 items-center justify-center border border-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-600" />
          </span>
          शुद्ध शाकाहारी
        </span>
      </div>
      <table className="mt-2 w-full font-mono text-[9px]">
        <tbody>
          {[
            ["Energy", "459 kcal"],
            ["Protein", "9.8 g"],
            ["Carbohydrate", "61.0 g"],
            ["of which sugars", "2.1 g"],
            ["Total fat", "19.0 g"],
            ["Saturated fat", "9.3 g"],
            ["Trans fat", "0.1 g"],
            ["Sodium", "1457 mg"],
          ].map(([k, v]) => (
            <tr key={k} className="border-b border-dotted border-black/20">
              <td className={`py-[3px] ${k?.startsWith("of") ? "pl-3 text-[#6b6357]" : ""}`}>{k}</td>
              <td className="py-[3px] text-right tabular-nums">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 font-mono text-[7px] leading-[1.6] text-[#6b6357] uppercase">
        Ingredients: Refined wheat flour (maida), palm oil, iodised salt, sugar, spices & condiments, acidity
        regulators (INS 330, INS 501(i)), flavour enhancers (INS 627, INS 631), thickener (INS 508), colour (INS
        150d). Contains wheat, soy, milk solids. May contain traces of peanut and tree nuts.
      </p>
      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-black/20 pt-2 font-mono text-[8px]">
        <span>Net Qty: 70 g</span>
        <span>MRP ₹14.00 (incl. of all taxes)</span>
        <span>Best before 9 months from packaging</span>
        <span className="text-[#6b6357]">*Serving size 70 g</span>
      </div>
    </div>
  );
}
