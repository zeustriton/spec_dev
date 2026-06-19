import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const authResult = await requireRole(["ADMIN"]);
  if (authResult.error) return authResult.error;

  const { searchParams } = new URL(request.url);
  const jefeCorreo = searchParams.get("jefeCorreo");
  if (!jefeCorreo) {
    return NextResponse.json({ error: "jefeCorreo es requerido" }, { status: 400 });
  }

  const semanaParam = searchParams.get("semana");
  const semana = semanaParam ? new Date(semanaParam) : getLunes();

  const sujetos = await prisma.sujetoObligado.findMany({
    where: { jefeCorreo, estado: "ACTIVO" },
    include: { obligaciones: true },
    orderBy: { apellidos: "asc" },
  });

  const data = sujetos.map((s) => ({
    dni: s.dni,
    nombres: `${s.nombres} ${s.apellidos}`,
    cargo: s.cargo,
    obligaciones: s.obligaciones.map((o) => ({
      tipo: o.tipo,
      periodo: o.periodo,
      fechaVencimiento: o.fechaVencimiento.toISOString().slice(0, 10),
      estado: o.estado,
    })),
  }));

  const jefeNombre = sujetos[0]?.jefeNombre ?? jefeCorreo;

  return NextResponse.json({
    jefe: { nombre: jefeNombre, correo: jefeCorreo },
    semana: semana.toISOString().slice(0, 10),
    servidores: data,
  });
}

function getLunes(): Date {
  const hoy = new Date();
  const dia = hoy.getDay();
  const diff = dia === 0 ? -6 : 1 - dia;
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() + diff);
  lunes.setHours(0, 0, 0, 0);
  return lunes;
}
