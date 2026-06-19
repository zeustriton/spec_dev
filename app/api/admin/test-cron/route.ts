import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { procesarAlertasDiarias } from "@/lib/alertas/motor";

export async function POST(request: NextRequest) {
  const authResult = await requireRole(["ADMIN"]);
  if (authResult.error) return authResult.error;

  try {
    const resumen = await procesarAlertasDiarias();
    return NextResponse.json(resumen);
  } catch (err) {
    return NextResponse.json({ error: "Error al ejecutar motor" }, { status: 500 });
  }
}
