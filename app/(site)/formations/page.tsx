import { Suspense } from "react";
import type { Metadata } from "next";
import FormationsClient from "./FormationsClient";

export const metadata: Metadata = { title: "Formations" };

export default function FormationsPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-content px-6 py-16">Chargement…</div>}>
      <FormationsClient />
    </Suspense>
  );
}
