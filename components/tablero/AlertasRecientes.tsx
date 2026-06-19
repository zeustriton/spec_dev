"use client";

import { Badge } from "@/components/ui/badge";

interface AlertaReciente {
  id: string;
  tipo: string;
  estadoEnvio: string;
  creadoEn: string;
  obligacion: {
    tipo: string;
    periodo: string;
    sujeto: { nombres: string; apellidos: string };
  };
}

interface Props {
  alertas: AlertaReciente[];
}

const tipoLabel: Record<string, string> = {
  PREVENTIVA_30: "30 días",
  PREVENTIVA_15: "15 días",
  PREVENTIVA_5: "5 días",
  INCUMPLIMIENTO: "Incumplimiento",
};

export function AlertasRecientes({ alertas }: Props) {
  if (alertas.length === 0) {
    return <p className="text-sm text-muted-foreground py-2">Sin alertas recientes.</p>;
  }

  return (
    <div className="space-y-2">
      {alertas.map((a) => (
        <div key={a.id} className="flex items-center justify-between py-2 border-b last:border-0">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">
              {a.obligacion.sujeto.apellidos}, {a.obligacion.sujeto.nombres}
            </p>
            <p className="text-xs text-muted-foreground">
              {tipoLabel[a.tipo] ?? a.tipo} · {a.obligacion.tipo} {a.obligacion.periodo}
            </p>
          </div>
          <div className="ml-4 shrink-0 flex flex-col items-end gap-1">
            <Badge variant={a.estadoEnvio === "ENVIADO" ? "success" : a.estadoEnvio === "ERROR" ? "destructive" : "secondary"}>
              {a.estadoEnvio}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {new Date(a.creadoEn).toLocaleDateString("es-PE")}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
