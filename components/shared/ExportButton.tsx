"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  tipo: "cumplimiento" | "omisos" | "alertas";
  periodo?: string;
  unidadId?: string;
}

export function ExportButton({ tipo, periodo, unidadId }: Props) {
  const [cargando, setCargando] = useState<"xlsx" | "pdf" | null>(null);

  async function exportar(formato: "xlsx" | "pdf") {
    setCargando(formato);
    try {
      const res = await fetch("/api/reportes/exportar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formato, tipo, ...(periodo ? { periodo } : {}), ...(unidadId ? { unidadId } : {}) }),
      });

      if (!res.ok) throw new Error("Error al generar reporte");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reporte-${tipo}-${periodo ?? new Date().getFullYear()}.${formato}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al exportar");
    } finally {
      setCargando(null);
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={cargando !== null}
        onClick={() => exportar("xlsx")}
      >
        {cargando === "xlsx" ? "Generando..." : "Exportar XLSX"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={cargando !== null}
        onClick={() => exportar("pdf")}
      >
        {cargando === "pdf" ? "Generando..." : "Exportar PDF"}
      </Button>
    </div>
  );
}
