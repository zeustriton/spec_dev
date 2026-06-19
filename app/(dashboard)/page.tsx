"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { IndicadoresPanel } from "@/components/tablero/IndicadoresPanel";
import { CumplimientoChart } from "@/components/tablero/CumplimientoChart";
import { AlertasRecientes } from "@/components/tablero/AlertasRecientes";
import { ExportButton } from "@/components/shared/ExportButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";

async function fetchTablero(params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`/api/reportes/tablero?${qs}`);
  if (!res.ok) throw new Error("Error al cargar tablero");
  return res.json();
}

async function fetchAlertas() {
  const res = await fetch("/api/alertas?limit=10");
  if (!res.ok) throw new Error("Error al cargar alertas");
  return res.json();
}

export default function TabléroPrincipalPage() {
  const { data: session } = useSession();
  const añoActual = String(new Date().getFullYear());
  const [periodo, setPeriodo] = useState(añoActual);

  const { data: tablero, isLoading } = useQuery({
    queryKey: ["tablero", { periodo }],
    queryFn: () => fetchTablero({ periodo }),
  });

  const { data: alertasData } = useQuery({
    queryKey: ["alertas-recientes"],
    queryFn: fetchAlertas,
  });

  const puedeExportar = session?.user?.rol === "ADMIN" || session?.user?.rol === "ALTA_DIRECCION";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tablero de Control</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Estado de cumplimiento DJI — Ley N.° 31227
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="w-28"
          >
            {[añoActual, String(Number(añoActual) - 1), String(Number(añoActual) - 2)].map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </Select>
          {puedeExportar && <ExportButton tipo="cumplimiento" periodo={periodo} />}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-lg border bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : tablero ? (
        <IndicadoresPanel resumen={tablero.resumen} />
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cumplimiento por Unidad Orgánica</CardTitle>
          </CardHeader>
          <CardContent>
            {tablero ? (
              <CumplimientoChart datos={tablero.porUnidad} />
            ) : (
              <div className="h-40 bg-muted/30 animate-pulse rounded" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Últimas Alertas Emitidas</CardTitle>
          </CardHeader>
          <CardContent>
            <AlertasRecientes alertas={alertasData?.data ?? []} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
