"use client";

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";

// R3F does not restart the loop by itself when frameloop flips back from "never".
export function Resume({ active }: { active: boolean }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    if (active) invalidate();
  }, [active, invalidate]);
  return null;
}
