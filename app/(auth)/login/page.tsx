"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    await signIn("email", { email, callbackUrl: "/", redirect: false });
    setEnviado(true);
    setCargando(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 rounded-lg border bg-card shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-foreground">
            Sistema de Alertas DJI
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Declaraciones Juradas de Intereses — Ley N.° 31227
          </p>
        </div>

        {enviado ? (
          <div className="text-center p-4 bg-muted rounded-md">
            <p className="text-sm text-foreground">
              Revisa tu correo institucional. Te enviamos un enlace de acceso.
            </p>
          </div>
        ) : (
          <form onSubmit={handleMagicLink} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">
                Correo institucional
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@entidad.gob.pe"
                required
                className="w-full px-3 py-2 border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button
              type="submit"
              disabled={cargando}
              className="w-full py-2 px-4 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 disabled:opacity-50"
            >
              {cargando ? "Enviando..." : "Ingresar con correo institucional"}
            </button>
          </form>
        )}

        <div className="mt-4 space-y-2">
          {process.env.NEXT_PUBLIC_AZURE_AD_ENABLED === "true" && (
            <button
              onClick={() => signIn("azure-ad", { callbackUrl: "/" })}
              className="w-full py-2 px-4 border text-sm font-medium rounded-md hover:bg-muted"
            >
              Ingresar con Microsoft (Azure AD)
            </button>
          )}
          {process.env.NEXT_PUBLIC_GOOGLE_ENABLED === "true" && (
            <button
              onClick={() => signIn("google", { callbackUrl: "/" })}
              className="w-full py-2 px-4 border text-sm font-medium rounded-md hover:bg-muted"
            >
              Ingresar con Google Workspace
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
