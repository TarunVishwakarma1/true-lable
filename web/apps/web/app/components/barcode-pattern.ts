const SEED = "TRUELABEL·SCANVERIFYKNOW·2026";

export function barcodePattern(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const code = SEED.charCodeAt(i % SEED.length);
    return { width: (code % 4) + 1, delay: i * 12 };
  });
}
