"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type Tipo = "cumplimiento" | "omisos" | "alertas";
type Formato = "xlsx" | "pdf";

export default function ReportesPage() {
  const añoActual = String(new Date().getFullYear());
  const [tipo, setTipo] = useState<Tipo>("cumplimiento");
  const [formato, setFormato] = useState<Formato>("xlsx");
  const [periodo, setPeriodo] = useState(añoActual);
  const [cargando, setCargando] = useState(false);

  async function handleExportar() {
    setCargando(true);
    try {
      const res = await fetch("/api/reportes/exportar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, formato, periodo }),
      });

      if (!res.ok) throw new Error("Error al generar reporte");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reporte-${tipo}-${periodo}.${formato}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al exportar");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reportes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generación de reportes de cumplimiento DJI
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Exportar reporte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label>Tipo de reporte</Label>
              <Select value={tipo} onChange={(e) => setTipo(e.target.value as Tipo)}>
                <option value="cumplimiento">Cumplimiento general</option>
                <option value="omisos">Sujetos omisos</option>
                <option value="alertas">Historial de alertas</option>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Período</Label>
              <Select value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
                {[añoActual, String(Number(añoActual) - 1), String(Number(añoActual) - 2)].map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Formato</Label>
              <Select value={formato} onChange={(e) => setFormato(e.target.value as Formato)}>
                <option value="xlsx">Excel (.xlsx)</option>
                <option value="pdf">PDF</option>
              </Select>
            </div>
          </div>

          <Button onClick={handleExportar} disabled={cargando}>
            {cargando ? "Generando..." : "Descargar reporte"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
