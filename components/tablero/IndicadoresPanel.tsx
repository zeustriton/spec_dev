"use client";

import { Card, CardContent } from "@/components/ui/card";

interface Resumen {
  totalSujetos: number;
  presentadosEnPlazo: number;
  presentadosConRetraso: number;
  omisos: number;
  pendientes: number;
  porcentajeCumplimiento: number;
  alertasEmitidas: number;
  tiempoPromedioRegularizacionDias: number;
}

interface Props {
  resumen: Resumen;
}

export function IndicadoresPanel({ resumen }: Props) {
  const indicadores = [
    {
      label: "Cumplimiento",
      valor: `${resumen.porcentajeCumplimiento}%`,
      sub: `${resumen.presentadosEnPlazo + resumen.presentadosConRetraso} de ${resumen.totalSujetos} sujetos`,
      color: resumen.porcentajeCumplimiento >= 80 ? "text-green-600" : resumen.porcentajeCumplimiento >= 50 ? "text-yellow-600" : "text-red-600",
    },
    {
      label: "Omisos",
      valor: String(resumen.omisos),
      sub: "Sin presentar DJI",
      color: resumen.omisos === 0 ? "text-green-600" : "text-red-600",
    },
    {
      label: "Pendientes",
      valor: String(resumen.pendientes),
      sub: "Con plazo vigente",
      color: resumen.pendientes > 0 ? "text-yellow-600" : "text-green-600",
    },
    {
      label: "Alertas emitidas",
      valor: String(resumen.alertasEmitidas),
      sub: "Total del período",
      color: "text-foreground",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {indicadores.map((ind) => (
        <Card key={ind.label}>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{ind.label}</p>
            <p className={`text-3xl font-bold mt-1 ${ind.color}`}>{ind.valor}</p>
            <p className="text-xs text-muted-foreground mt-1">{ind.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
