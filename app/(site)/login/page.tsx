import { Suspense } from "react";
import LoginClient from "./LoginClient";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="max-w-content mx-auto px-6 py-16">Chargement…</div>}>
      <LoginClient />
    </Suspense>
  );
}
