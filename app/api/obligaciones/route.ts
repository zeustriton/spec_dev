import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { registrarEvento } from "@/lib/audit";
import { ObligacionSchema } from "@/lib/validaciones/schemas";

export async function POST(request: NextRequest) {
  const authResult = await requireRole(["ADMIN"]);
  if (authResult.error) return authResult.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 });
  }

  const parsed = ObligacionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", detalle: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.obligacionDJI.findUnique({
    where: {
      sujetoId_tipo_periodo: {
        sujetoId: parsed.data.sujetoId,
        tipo: parsed.data.tipo,
        periodo: parsed.data.periodo,
      },
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: `Ya existe una obligación del tipo ${parsed.data.tipo} para el periodo ${parsed.data.periodo}` },
      { status: 409 }
    );
  }

  const obligacion = await prisma.obligacionDJI.create({
    data: {
      sujetoId: parsed.data.sujetoId,
      tipo: parsed.data.tipo,
      periodo: parsed.data.periodo,
      fechaVencimiento: new Date(parsed.data.fechaVencimiento),
      observaciones: parsed.data.observaciones,
      estado: "PENDIENTE",
    },
  });

  await registrarEvento({
    tipo: "OBLIGACION_CREADA",
    userId: authResult.session.user.id,
    entidad: "ObligacionDJI",
    entidadId: obligacion.id,
    obligacionId: obligacion.id,
    detalle: `Obligación ${obligacion.tipo} ${obligacion.periodo} creada para sujeto ${obligacion.sujetoId}`,
  });

  return NextResponse.json(obligacion, { status: 201 });
}
