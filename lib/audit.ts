import { prisma } from "@/lib/prisma";
import type { TipoEvento } from "@prisma/client";

interface RegistrarEventoParams {
  tipo: TipoEvento;
  userId?: string | null;
  entidad: string;
  entidadId?: string | null;
  detalle: string;
  obligacionId?: string | null;
}

export async function registrarEvento(params: RegistrarEventoParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        tipo: params.tipo,
        userId: params.userId ?? null,
        entidad: params.entidad,
        entidadId: params.entidadId ?? null,
        detalle: params.detalle,
        obligacionId: params.obligacionId ?? null,
      },
    });
  } catch (err) {
    // El log de auditoría no debe interrumpir el flujo principal
    console.error("[AuditLog] Error al registrar evento:", err);
  }
}
