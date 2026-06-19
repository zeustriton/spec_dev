"use client";

interface UnidadData {
  unidadNombre: string;
  porcentaje: number;
  total: number;
  presentados: number;
  omisos: number;
}

interface Props {
  datos: UnidadData[];
}

export function CumplimientoChart({ datos }: Props) {
  if (datos.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">Sin datos para mostrar.</p>;
  }

  return (
    <div className="space-y-3">
      {datos.map((d) => (
        <div key={d.unidadNombre}>
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium truncate max-w-[200px]" title={d.unidadNombre}>
              {d.unidadNombre}
            </span>
            <span className="text-muted-foreground ml-2 shrink-0">
              {d.presentados}/{d.total} — {d.porcentaje}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                d.porcentaje >= 80 ? "bg-green-500" : d.porcentaje >= 50 ? "bg-yellow-500" : "bg-red-500"
              }`}
              style={{ width: `${d.porcentaje}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
