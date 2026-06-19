import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { UnidadOrganicaSchema } from "@/lib/validaciones/schemas";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireRole(["ADMIN"]);
  if (authResult.error) return authResult.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 });
  }

  const parsed = UnidadOrganicaSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", detalle: parsed.error.flatten() }, { status: 400 });
  }

  const unidad = await prisma.unidadOrganica.update({ where: { id: params.id }, data: parsed.data });
  return NextResponse.json(unidad);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireRole(["ADMIN"]);
  if (authResult.error) return authResult.error;

  const conSujetos = await prisma.sujetoObligado.count({ where: { unidadOrganicaId: params.id } });
  if (conSujetos > 0) {
    return NextResponse.json(
      { error: `No se puede eliminar: tiene ${conSujetos} sujeto(s) asociado(s)` },
      { status: 409 }
    );
  }

  await prisma.unidadOrganica.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
}
