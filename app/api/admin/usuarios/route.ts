import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const authResult = await requireRole(["ADMIN"]);
  if (authResult.error) return authResult.error;

  const usuarios = await prisma.user.findMany({
    select: { id: true, email: true, name: true, rol: true, activo: true },
    orderBy: { email: "asc" },
  });

  return NextResponse.json(usuarios);
}
