"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SujetoForm } from "@/components/sujetos/SujetoForm";
import { RegistrarPresentacionForm } from "@/components/sujetos/RegistrarPresentacionForm";

interface ObligacionDJI {
  id: string;
  tipo: string;
  periodo: string;
  fechaVencimiento: string;
  estado: string;
  alertas: { id: string; tipo: string; estadoEnvio: string; creadoEn: string }[];
}

interface SujetoDetalle {
  id: string;
  dni: string;
  nombres: string;
  apellidos: string;
  cargo: string;
  nivelJerarquico: string;
  correo: string;
  jefeNombre?: string;
  jefeCorreo?: string;
  estado: string;
  unidadOrganica: { nombre: string; organo: string };
  obligaciones: ObligacionDJI[];
}

async function fetchSujeto(id: string): Promise<SujetoDetalle> {
  const res = await fetch(`/api/sujetos/${id}`);
  if (!res.ok) throw new Error("Sujeto no encontrado");
  return res.json();
}

const estadoBadgeVariant = (estado: string) => {
  if (estado === "PRESENTADO_EN_PLAZO") return "success";
  if (estado === "PENDIENTE") return "warning";
  if (estado === "OMISO" || estado === "PRESENTADO_CON_RETRASO") return "destructive";
  return "secondary";
};

const formatFecha = (fecha: string) =>
  new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(fecha));

export default function SujetoDetallePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [modoEdicion, setModoEdicion] = useState(false);
  const [obligacionSeleccionada, setObligacionSeleccionada] = useState<string | null>(null);

  const esAdmin = session?.user?.rol === "ADMIN";

  const { data: sujeto, isLoading } = useQuery({
    queryKey: ["sujeto", id],
    queryFn: () => fetchSujeto(id),
  });

  if (isLoading) return <div className="p-6 text-muted-foreground">Cargando...</div>;
  if (!sujeto) return <div className="p-6 text-destructive">Sujeto no encontrado</div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>← Volver</Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{sujeto.apellidos}, {sujeto.nombres}</h1>
          <p className="text-sm text-muted-foreground">{sujeto.cargo} · {sujeto.unidadOrganica.nombre}</p>
        </div>
        <Badge variant={sujeto.estado === "ACTIVO" ? "success" : "secondary"}>{sujeto.estado}</Badge>
        {esAdmin && !modoEdicion && (
          <Button variant="outline" size="sm" onClick={() => setModoEdicion(true)}>Editar</Button>
        )}
      </div>

      {modoEdicion ? (
        <Card>
          <CardHeader><CardTitle>Editar datos</CardTitle></CardHeader>
          <CardContent>
            <SujetoForm
              sujetoId={id}
              defaultValues={{
                dni: sujeto.dni,
                nombres: sujeto.nombres,
                apellidos: sujeto.apellidos,
                cargo: sujeto.cargo,
                nivelJerarquico: sujeto.nivelJerarquico,
                correo: sujeto.correo,
                jefeNombre: sujeto.jefeNombre,
                jefeCorreo: sujeto.jefeCorreo,
                unidadOrganicaId: sujeto.unidadOrganica.nombre,
              }}
              onSuccess={() => {
                setModoEdicion(false);
                queryClient.invalidateQueries({ queryKey: ["sujeto", id] });
              }}
              onCancel={() => setModoEdicion(false)}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>Datos del servidor</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div><dt className="text-muted-foreground">DNI</dt><dd className="font-mono">{sujeto.dni}</dd></div>
              <div><dt className="text-muted-foreground">Correo</dt><dd>{sujeto.correo}</dd></div>
              <div><dt className="text-muted-foreground">Nivel jerárquico</dt><dd>{sujeto.nivelJerarquico}</dd></div>
              <div><dt className="text-muted-foreground">Órgano</dt><dd>{sujeto.unidadOrganica.organo}</dd></div>
              {sujeto.jefeNombre && (
                <div className="col-span-2">
                  <dt className="text-muted-foreground">Jefe inmediato</dt>
                  <dd>{sujeto.jefeNombre} — {sujeto.jefeCorreo}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Obligaciones DJI</h2>
        {sujeto.obligaciones.length === 0 && (
          <p className="text-sm text-muted-foreground">No hay obligaciones registradas.</p>
        )}
        {sujeto.obligaciones.map((ob) => (
          <Card key={ob.id}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{ob.tipo}</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">{ob.periodo}</span>
                    <Badge variant={estadoBadgeVariant(ob.estado)}>{ob.estado}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Vencimiento: {formatFecha(ob.fechaVencimiento)}
                  </p>
                  {ob.alertas.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {ob.alertas.length} alerta(s) enviada(s)
                    </p>
                  )}
                </div>
                {esAdmin && (ob.estado === "PENDIENTE" || ob.estado === "OMISO") && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setObligacionSeleccionada(ob.id)}
                  >
                    Registrar presentación
                  </Button>
                )}
              </div>

              {obligacionSeleccionada === ob.id && (
                <div className="mt-4 border-t pt-4">
                  <RegistrarPresentacionForm
                    obligacionId={ob.id}
                    fechaVencimiento={ob.fechaVencimiento}
                    onSuccess={() => {
                      setObligacionSeleccionada(null);
                      queryClient.invalidateQueries({ queryKey: ["sujeto", id] });
                    }}
                    onCancel={() => setObligacionSeleccionada(null)}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
