import { NextRequest, NextResponse } from "next/server";
import { procesarAlertasDiarias, enviarReportesSemanal } from "@/lib/alertas/motor";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const inicio = Date.now();

  try {
    const resumen = await procesarAlertasDiarias();

    // Los lunes (día 1), también enviar reportes semanales a jefes
    if (new Date().getDay() === 1) {
      await enviarReportesSemanal();
    }

    return NextResponse.json({
      ejecutadoEn: new Date().toISOString(),
      alertasEnviadas: resumen.alertasEnviadas,
      incumplimientosDetectados: resumen.incumplimientosDetectados,
      errores: resumen.errores,
      duracionMs: Date.now() - inicio,
    });
  } catch (err) {
    console.error("[/api/cron/procesar-alertas] Error:", err);
    return NextResponse.json(
      { error: "Error interno al procesar alertas", duracionMs: Date.now() - inicio },
      { status: 500 }
    );
  }
}
