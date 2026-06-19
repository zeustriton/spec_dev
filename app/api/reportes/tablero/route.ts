import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const authResult = await requireRole(["ADMIN", "OPERADOR", "ALTA_DIRECCION"]);
  if (authResult.error) return authResult.error;

  const { searchParams } = new URL(request.url);
  const periodo = searchParams.get("periodo") ?? String(new Date().getFullYear());
  const unidadId = searchParams.get("unidadId") ?? undefined;
  const organo = searchParams.get("organo") ?? undefined;

  const obligaciones = await prisma.obligacionDJI.findMany({
    where: {
      periodo,
      sujeto: {
        estado: "ACTIVO",
        ...(unidadId ? { unidadOrganicaId: unidadId } : {}),
        ...(organo ? { unidadOrganica: { organo } } : {}),
      },
    },
    include: {
      sujeto: { include: { unidadOrganica: true } },
    },
  });

  const alertasCount = await prisma.alerta.count({
    where: {
      obligacion: { periodo },
    },
  });

  // Calcular resumen global
  const totalSujetos = new Set(obligaciones.map((o) => o.sujetoId)).size;
  let presentadosEnPlazo = 0;
  let presentadosConRetraso = 0;
  let omisos = 0;
  let pendientes = 0;
  let sumaRetraso = 0;
  let countRetraso = 0;

  for (const o of obligaciones) {
    if (o.estado === "PRESENTADO_EN_PLAZO") presentadosEnPlazo++;
    else if (o.estado === "PRESENTADO_CON_RETRASO") {
      presentadosConRetraso++;
      if (o.fechaPresentacion) {
        const dias = Math.round(
          (o.fechaPresentacion.getTime() - o.fechaVencimiento.getTime()) / (1000 * 60 * 60 * 24)
        );
        sumaRetraso += dias;
        countRetraso++;
      }
    } else if (o.estado === "OMISO") omisos++;
    else pendientes++;
  }

  const total = obligaciones.length;
  const cumplidos = presentadosEnPlazo + presentadosConRetraso;
  const porcentajeCumplimiento = total > 0 ? Math.round((cumplidos / total) * 1000) / 10 : 0;

  // Por unidad orgánica
  const unidadMap = new Map<
    string,
    { id: string; nombre: string; organo: string; total: number; presentados: number; pendientes: number; omisos: number }
  >();

  for (const o of obligaciones) {
    const u = o.sujeto.unidadOrganica;
    if (!unidadMap.has(u.id)) {
      unidadMap.set(u.id, { id: u.id, nombre: u.nombre, organo: u.organo, total: 0, presentados: 0, pendientes: 0, omisos: 0 });
    }
    const entry = unidadMap.get(u.id)!;
    entry.total++;
    if (o.estado === "PRESENTADO_EN_PLAZO" || o.estado === "PRESENTADO_CON_RETRASO") entry.presentados++;
    else if (o.estado === "OMISO") entry.omisos++;
    else entry.pendientes++;
  }

  const porUnidad = Array.from(unidadMap.values()).map((u) => ({
    unidadId: u.id,
    unidadNombre: u.nombre,
    organo: u.organo,
    total: u.total,
    presentados: u.presentados,
    pendientes: u.pendientes,
    omisos: u.omisos,
    porcentaje: u.total > 0 ? Math.round((u.presentados / u.total) * 1000) / 10 : 0,
  }));

  return NextResponse.json({
    periodo,
    resumen: {
      totalSujetos,
      presentadosEnPlazo,
      presentadosConRetraso,
      omisos,
      pendientes,
      porcentajeCumplimiento,
      alertasEmitidas: alertasCount,
      tiempoPromedioRegularizacionDias: countRetraso > 0 ? Math.round((sumaRetraso / countRetraso) * 10) / 10 : 0,
    },
    porUnidad,
    actualizadoEn: new Date().toISOString(),
  });
}
