import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ExportarSchema } from "@/lib/validaciones/schemas";
import { generarReporteXLSX } from "@/lib/reportes/xlsx";
import { generarReportePDF } from "@/lib/reportes/pdf";

export async function POST(request: NextRequest) {
  const authResult = await requireRole(["ADMIN", "ALTA_DIRECCION"]);
  if (authResult.error) return authResult.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 });
  }

  const parsed = ExportarSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", detalle: parsed.error.flatten() }, { status: 400 });
  }

  const { formato, tipo, periodo, unidadId, organo } = parsed.data;
  const periodoEfectivo = periodo ?? String(new Date().getFullYear());

  const obligaciones = await prisma.obligacionDJI.findMany({
    where: {
      periodo: periodoEfectivo,
      sujeto: {
        estado: "ACTIVO",
        ...(unidadId ? { unidadOrganicaId: unidadId } : {}),
        ...(organo ? { unidadOrganica: { organo } } : {}),
        ...(tipo === "omisos" ? {} : {}),
      },
      ...(tipo === "omisos" ? { estado: "OMISO" } : {}),
    },
    include: {
      sujeto: { include: { unidadOrganica: true } },
      alertas: true,
    },
    orderBy: { sujeto: { apellidos: "asc" } },
  });

  const alertasCount = await prisma.alerta.count({ where: { obligacion: { periodo: periodoEfectivo } } });

  let presentadosEnPlazo = 0;
  let presentadosConRetraso = 0;
  let omisos = 0;
  let pendientes = 0;

  for (const o of obligaciones) {
    if (o.estado === "PRESENTADO_EN_PLAZO") presentadosEnPlazo++;
    else if (o.estado === "PRESENTADO_CON_RETRASO") presentadosConRetraso++;
    else if (o.estado === "OMISO") omisos++;
    else pendientes++;
  }

  const resumen = {
    totalSujetos: new Set(obligaciones.map((o) => o.sujetoId)).size,
    presentadosEnPlazo,
    presentadosConRetraso,
    omisos,
    pendientes,
    porcentajeCumplimiento:
      obligaciones.length > 0
        ? Math.round(((presentadosEnPlazo + presentadosConRetraso) / obligaciones.length) * 1000) / 10
        : 0,
    alertasEmitidas: alertasCount,
  };

  const registros = obligaciones.map((o) => ({
    DNI: o.sujeto.dni,
    Nombres: o.sujeto.nombres,
    Apellidos: o.sujeto.apellidos,
    Cargo: o.sujeto.cargo,
    Unidad: o.sujeto.unidadOrganica.nombre,
    "Tipo Obligación": o.tipo,
    Período: o.periodo,
    "Fecha Vencimiento": o.fechaVencimiento.toISOString().slice(0, 10),
    Estado: o.estado,
    "Alertas Enviadas": o.alertas.length,
  }));

  const filename = `reporte-${tipo}-${periodoEfectivo}`;

  if (formato === "xlsx") {
    const buffer = generarReporteXLSX({ tipo, periodo: periodoEfectivo, resumen, registros });
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
      },
    });
  }

  const columnas = ["DNI", "Nombres", "Apellidos", "Cargo", "Unidad", "Tipo", "Período", "Vencimiento", "Estado"];
  const filas = obligaciones.map((o) => [
    o.sujeto.dni,
    o.sujeto.nombres,
    o.sujeto.apellidos,
    o.sujeto.cargo,
    o.sujeto.unidadOrganica.nombre,
    o.tipo,
    o.periodo,
    o.fechaVencimiento.toISOString().slice(0, 10),
    o.estado,
  ]);

  const buffer = generarReportePDF({ tipo, periodo: periodoEfectivo, resumen, columnas, filas });
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}.pdf"`,
    },
  });
}
