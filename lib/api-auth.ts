import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import type { Rol } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { registrarEvento } from "@/lib/audit";

export async function requireRole(roles: Rol[]) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      error: NextResponse.json({ error: "No autenticado" }, { status: 401 }),
      session: null,
    };
  }

  if (!roles.includes(session.user.rol)) {
    await registrarEvento({
      tipo: "ACCESO_DENEGADO",
      userId: session.user.id,
      entidad: "API",
      detalle: `Rol ${session.user.rol} intentó acceder a recurso que requiere ${roles.join(",")}`,
    });
    return {
      error: NextResponse.json(
        { error: "Acceso denegado: rol insuficiente" },
        { status: 403 }
      ),
      session: null,
    };
  }

  return { error: null, session };
}
