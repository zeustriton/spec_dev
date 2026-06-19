import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { z } from "zod";
import type { Rol } from "@prisma/client";

const UpdateSchema = z.object({
  rol: z.enum(["ADMIN", "OPERADOR", "ALTA_DIRECCION"]).optional(),
  activo: z.boolean().optional(),
});

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireRole(["ADMIN"]);
  if (authResult.error) return authResult.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 });
  }

  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", detalle: parsed.error.flatten() }, { status: 400 });
  }

  const usuario = await prisma.user.update({
    where: { id: params.id },
    data: parsed.data as { rol?: Rol; activo?: boolean },
    select: { id: true, email: true, name: true, rol: true, activo: true },
  });

  return NextResponse.json(usuario);
}
