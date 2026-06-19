import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { registrarEvento } from "@/lib/audit";
import { RegistrarPresentacionSchema } from "@/lib/validaciones/schemas";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireRole(["ADMIN"]);
  if (authResult.error) return authResult.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 });
  }

  const parsed = RegistrarPresentacionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", detalle: parsed.error.flatten() }, { status: 400 });
  }

  const obligacion = await prisma.obligacionDJI.findUnique({ where: { id: params.id } });
  if (!obligacion) {
    return NextResponse.json({ error: "Obligación no encontrada" }, { status: 404 });
  }

  if (obligacion.estado === "PRESENTADO_EN_PLAZO" || obligacion.estado === "PRESENTADO_CON_RETRASO") {
    return NextResponse.json({ error: "Esta obligación ya tiene presentación registrada" }, { status: 409 });
  }

  const fechaPresentacion = new Date(parsed.data.fechaPresentacion);
  const esEnPlazo = fechaPresentacion <= obligacion.fechaVencimiento;
  const nuevoEstado = esEnPlazo ? "PRESENTADO_EN_PLAZO" : "PRESENTADO_CON_RETRASO";
  const tipoEvento = esEnPlazo ? "PRESENTACION_REGISTRADA" : "REGULARIZACION_REGISTRADA";

  const obligacionActualizada = await prisma.obligacionDJI.update({
    where: { id: params.id },
    data: {
      estado: nuevoEstado,
      fechaPresentacion,
      observaciones: parsed.data.observaciones,
    },
  });

  await registrarEvento({
    tipo: tipoEvento,
    userId: authResult.session.user.id,
    entidad: "ObligacionDJI",
    entidadId: obligacion.id,
    obligacionId: obligacion.id,
    detalle: `Presentación registrada el ${fechaPresentacion.toISOString()} — ${nuevoEstado}`,
  });

  return NextResponse.json({
    id: obligacionActualizada.id,
    estado: obligacionActualizada.estado,
    fechaPresentacion: obligacionActualizada.fechaPresentacion,
  });
}
