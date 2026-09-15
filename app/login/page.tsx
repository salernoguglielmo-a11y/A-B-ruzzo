import { Suspense } from "react";
import ModuloLogin from "./ModuloLogin";

export const metadata = { title: "Dossier ab[B]ruzzo" };

export default function PaginaLogin() {
  return (
    <div className="login">
      <Suspense fallback={null}>
        <ModuloLogin />
      </Suspense>
    </div>
  );
}
