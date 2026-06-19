import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { UnidadOrganicaSchema } from "@/lib/validaciones/schemas";

export async function GET(request: NextRequest) {
  const authResult = await requireRole(["ADMIN", "OPERADOR", "ALTA_DIRECCION"]);
  if (authResult.error) return authResult.error;

  const unidades = await prisma.unidadOrganica.findMany({ orderBy: { nombre: "asc" } });
  return NextResponse.json(unidades);
}

export async function POST(request: NextRequest) {
  const authResult = await requireRole(["ADMIN"]);
  if (authResult.error) return authResult.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 });
  }

  const parsed = UnidadOrganicaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", detalle: parsed.error.flatten() }, { status: 400 });
  }

  const unidad = await prisma.unidadOrganica.create({ data: parsed.data });
  return NextResponse.json(unidad, { status: 201 });
}
