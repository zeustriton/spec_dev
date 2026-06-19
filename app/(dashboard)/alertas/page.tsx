"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

interface Alerta {
  id: string;
  tipo: string;
  estadoEnvio: string;
  creadoEn: string;
  destinatarios: string[];
  obligacion: {
    tipo: string;
    periodo: string;
    fechaVencimiento: string;
    sujeto: { dni: string; nombres: string; apellidos: string };
  };
}

const tipoLabel: Record<string, string> = {
  PREVENTIVA_30: "Preventiva 30d",
  PREVENTIVA_15: "Preventiva 15d",
  PREVENTIVA_5: "Preventiva 5d",
  INCUMPLIMIENTO: "Incumplimiento",
};

async function fetchAlertas(params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`/api/alertas?${qs}`);
  if (!res.ok) throw new Error("Error al cargar alertas");
  return res.json() as Promise<{ data: Alerta[]; total: number; page: number; limit: number }>;
}

export default function AlertasPage() {
  const [tipo, setTipo] = useState("");
  const [estadoEnvio, setEstadoEnvio] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["alertas", { tipo, estadoEnvio, page }],
    queryFn: () =>
      fetchAlertas({
        ...(tipo ? { tipo } : {}),
        ...(estadoEnvio ? { estadoEnvio } : {}),
        page: String(page),
        limit: "20",
      }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Historial de Alertas</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Registro completo de alertas enviadas por el sistema
        </p>
      </div>

      <div className="flex gap-2">
        <Select value={tipo} onChange={(e) => { setTipo(e.target.value); setPage(1); }} className="w-44">
          <option value="">Todos los tipos</option>
          <option value="PREVENTIVA_30">Preventiva 30 días</option>
          <option value="PREVENTIVA_15">Preventiva 15 días</option>
          <option value="PREVENTIVA_5">Preventiva 5 días</option>
          <option value="INCUMPLIMIENTO">Incumplimiento</option>
        </Select>
        <Select value={estadoEnvio} onChange={(e) => { setEstadoEnvio(e.target.value); setPage(1); }} className="w-36">
          <option value="">Todos los estados</option>
          <option value="ENVIADO">Enviado</option>
          <option value="ERROR">Error</option>
        </Select>
      </div>

      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Sujeto</th>
              <th className="text-left px-4 py-3 font-medium">Obligación</th>
              <th className="text-left px-4 py-3 font-medium">Tipo Alerta</th>
              <th className="text-left px-4 py-3 font-medium">Destinatarios</th>
              <th className="text-left px-4 py-3 font-medium">Estado</th>
              <th className="text-left px-4 py-3 font-medium">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Cargando...</td>
              </tr>
            )}
            {!isLoading && data?.data.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No hay alertas</td>
              </tr>
            )}
            {data?.data.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="px-4 py-3">
                  <div className="font-medium">{a.obligacion.sujeto.apellidos}, {a.obligacion.sujeto.nombres}</div>
                  <div className="text-xs text-muted-foreground font-mono">{a.obligacion.sujeto.dni}</div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {a.obligacion.tipo} {a.obligacion.periodo}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={a.tipo === "INCUMPLIMIENTO" ? "destructive" : "warning"}>
                    {tipoLabel[a.tipo] ?? a.tipo}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {a.destinatarios?.join(", ")}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={a.estadoEnvio === "ENVIADO" ? "success" : "destructive"}>
                    {a.estadoEnvio}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {new Date(a.creadoEn).toLocaleString("es-PE")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.total > data.limit && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Total: {data.total} alertas</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setPage(p => p - 1)} disabled={page === 1}>Anterior</Button>
            <Button size="sm" variant="outline" onClick={() => setPage(p => p + 1)} disabled={page * data.limit >= data.total}>Siguiente</Button>
          </div>
        </div>
      )}
    </div>
  );
}
