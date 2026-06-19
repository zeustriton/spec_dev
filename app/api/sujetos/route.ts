import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { registrarEvento } from "@/lib/audit";
import { SujetoSchema } from "@/lib/validaciones/schemas";
import { z } from "zod";

export async function GET(request: NextRequest) {
  const authResult = await requireRole(["ADMIN", "OPERADOR", "ALTA_DIRECCION"]);
  if (authResult.error) return authResult.error;

  const { searchParams } = new URL(request.url);
  const estado = searchParams.get("estado") ?? undefined;
  const unidadId = searchParams.get("unidadId") ?? undefined;
  const search = searchParams.get("search") ?? undefined;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 50)));
  const skip = (page - 1) * limit;

  const where = {
    ...(estado ? { estado: estado as "ACTIVO" | "INACTIVO" } : {}),
    ...(unidadId ? { unidadOrganicaId: unidadId } : {}),
    ...(search
      ? {
          OR: [
            { nombres: { contains: search } },
            { apellidos: { contains: search } },
            { dni: { contains: search } },
            { cargo: { contains: search } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.sujetoObligado.findMany({
      where,
      include: { unidadOrganica: true, obligaciones: { where: { estado: "PENDIENTE" } } },
      orderBy: { apellidos: "asc" },
      skip,
      take: limit,
    }),
    prisma.sujetoObligado.count({ where }),
  ]);

  return NextResponse.json({ data, total, page, limit });
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

  const parsed = SujetoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", detalle: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.sujetoObligado.findUnique({ where: { dni: parsed.data.dni } });
  if (existing) {
    return NextResponse.json({ error: `Ya existe un sujeto con DNI ${parsed.data.dni}` }, { status: 409 });
  }

  const sujeto = await prisma.sujetoObligado.create({
    data: { ...parsed.data, estado: "ACTIVO" },
    include: { unidadOrganica: true },
  });

  await registrarEvento({
    tipo: "SUJETO_CREADO",
    userId: authResult.session.user.id,
    entidad: "SujetoObligado",
    entidadId: sujeto.id,
    detalle: `Sujeto creado: ${sujeto.nombres} ${sujeto.apellidos} (DNI: ${sujeto.dni})`,
  });

  return NextResponse.json(sujeto, { status: 201 });
}
