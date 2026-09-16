import type { Metadata } from "next";
import { PreviewShowcase } from "../components/preview-showcase";
import { Footer } from "../components/footer";

export const metadata: Metadata = {
  title: "App Preview — TrueLabel iOS & Android",
  description:
    "Preview the upcoming TrueLabel native mobile application. Clean editorial design, 120Hz gesture physics, zero tracking servers, and scientifically accurate TrueLabel Nutri-Score.",
};

export default function PreviewPage() {
  return (
    <main id="main" className="min-h-screen pt-24 pb-20">
      <PreviewShowcase />
      <Footer />
    </main>
  );
}
