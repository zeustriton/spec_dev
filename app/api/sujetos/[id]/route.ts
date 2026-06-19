import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { registrarEvento } from "@/lib/audit";
import { SujetoSchema } from "@/lib/validaciones/schemas";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireRole(["ADMIN", "OPERADOR", "ALTA_DIRECCION"]);
  if (authResult.error) return authResult.error;

  const sujeto = await prisma.sujetoObligado.findUnique({
    where: { id: params.id },
    include: {
      unidadOrganica: true,
      obligaciones: {
        include: { alertas: { orderBy: { creadoEn: "desc" }, take: 10 } },
        orderBy: { creadoEn: "desc" },
      },
    },
  });

  if (!sujeto) {
    return NextResponse.json({ error: "Sujeto no encontrado" }, { status: 404 });
  }

  return NextResponse.json(sujeto);
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireRole(["ADMIN"]);
  if (authResult.error) return authResult.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 });
  }

  const parsed = SujetoSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", detalle: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.sujetoObligado.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Sujeto no encontrado" }, { status: 404 });
  }

  const sujeto = await prisma.sujetoObligado.update({
    where: { id: params.id },
    data: parsed.data,
    include: { unidadOrganica: true },
  });

  await registrarEvento({
    tipo: "SUJETO_ACTUALIZADO",
    userId: authResult.session.user.id,
    entidad: "SujetoObligado",
    entidadId: sujeto.id,
    detalle: `Sujeto actualizado: ${sujeto.nombres} ${sujeto.apellidos}`,
  });

  return NextResponse.json(sujeto);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await requireRole(["ADMIN"]);
  if (authResult.error) return authResult.error;

  const existing = await prisma.sujetoObligado.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Sujeto no encontrado" }, { status: 404 });
  }

  const sujeto = await prisma.sujetoObligado.update({
    where: { id: params.id },
    data: { estado: "INACTIVO" },
  });

  await registrarEvento({
    tipo: "SUJETO_DESACTIVADO",
    userId: authResult.session.user.id,
    entidad: "SujetoObligado",
    entidadId: sujeto.id,
    detalle: `Sujeto desactivado: ${sujeto.nombres} ${sujeto.apellidos} (DNI: ${sujeto.dni})`,
  });

  return NextResponse.json({ id: sujeto.id, estado: sujeto.estado });
}
