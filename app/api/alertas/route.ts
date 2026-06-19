import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const authResult = await requireRole(["ADMIN", "OPERADOR"]);
  if (authResult.error) return authResult.error;

  const { searchParams } = new URL(request.url);
  const sujetoId = searchParams.get("sujetoId") ?? undefined;
  const tipo = searchParams.get("tipo") ?? undefined;
  const estadoEnvio = searchParams.get("estadoEnvio") ?? undefined;
  const desde = searchParams.get("desde") ?? undefined;
  const hasta = searchParams.get("hasta") ?? undefined;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 50)));
  const skip = (page - 1) * limit;

  const where = {
    ...(tipo ? { tipo: tipo as "PREVENTIVA_30" | "PREVENTIVA_15" | "PREVENTIVA_5" | "INCUMPLIMIENTO" } : {}),
    ...(estadoEnvio ? { estadoEnvio: estadoEnvio as "PENDIENTE" | "ENVIADO" | "ERROR" } : {}),
    ...(sujetoId ? { obligacion: { sujetoId } } : {}),
    ...(desde || hasta
      ? {
          creadoEn: {
            ...(desde ? { gte: new Date(desde) } : {}),
            ...(hasta ? { lte: new Date(hasta) } : {}),
          },
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.alerta.findMany({
      where,
      include: {
        obligacion: {
          include: {
            sujeto: { select: { dni: true, nombres: true, apellidos: true } },
          },
        },
      },
      orderBy: { creadoEn: "desc" },
      skip,
      take: limit,
    }),
    prisma.alerta.count({ where }),
  ]);

  const formatted = data.map((a) => ({
    id: a.id,
    tipo: a.tipo,
    canal: a.canal,
    destinatarios: JSON.parse(a.destinatarios as string),
    estadoEnvio: a.estadoEnvio,
    enviadoEn: a.enviadoEn,
    creadoEn: a.creadoEn,
    obligacion: {
      id: a.obligacion.id,
      tipo: a.obligacion.tipo,
      periodo: a.obligacion.periodo,
      fechaVencimiento: a.obligacion.fechaVencimiento,
      sujeto: a.obligacion.sujeto,
    },
  }));

  return NextResponse.json({ data: formatted, total, page, limit });
}
