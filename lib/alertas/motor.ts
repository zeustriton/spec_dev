import { prisma } from "@/lib/prisma";
import { CorreoService } from "./correo";
import { plantillaAlertaPreventiva, plantillaIncumplimiento } from "./plantillas";
import { registrarEvento } from "@/lib/audit";

const correoService = new CorreoService();

interface ResumenProcesamiento {
  alertasEnviadas: number;
  incumplimientosDetectados: number;
  errores: number;
}

type TipoAlertaPreventiva = "PREVENTIVA_30" | "PREVENTIVA_15" | "PREVENTIVA_5";

function tipoAlertaParaDias(dias: number): TipoAlertaPreventiva | null {
  if (dias === 30) return "PREVENTIVA_30";
  if (dias === 15) return "PREVENTIVA_15";
  if (dias === 5) return "PREVENTIVA_5";
  return null;
}

function diasEntre(desde: Date, hasta: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const diffMs = hasta.getTime() - desde.getTime();
  return Math.round(diffMs / msPerDay);
}

export async function procesarAlertasDiarias(): Promise<ResumenProcesamiento> {
  const resumen: ResumenProcesamiento = {
    alertasEnviadas: 0,
    incumplimientosDetectados: 0,
    errores: 0,
  };

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const obligaciones = await prisma.obligacionDJI.findMany({
    where: { estado: "PENDIENTE" },
    include: {
      sujeto: { include: { unidadOrganica: true } },
    },
  });

  for (const obligacion of obligaciones) {
    const { sujeto } = obligacion;
    if (sujeto.estado !== "ACTIVO") continue;

    const vencimiento = new Date(obligacion.fechaVencimiento);
    vencimiento.setHours(0, 0, 0, 0);
    const diasRestantes = diasEntre(hoy, vencimiento);

    // Detectar incumplimiento: venció ayer (diasRestantes === -1)
    if (diasRestantes === -1) {
      try {
        await prisma.obligacionDJI.update({
          where: { id: obligacion.id },
          data: { estado: "OMISO" },
        });

        const destinatarios = [sujeto.correo];
        if (sujeto.jefeCorreo) destinatarios.push(sujeto.jefeCorreo);
        const responsableIntegridad = process.env.EMAIL_RESPONSABLE_INTEGRIDAD;
        if (responsableIntegridad) destinatarios.push(responsableIntegridad);

        const cuerpo = plantillaIncumplimiento(
          { nombres: sujeto.nombres, apellidos: sujeto.apellidos, cargo: sujeto.cargo, correo: sujeto.correo },
          { tipo: obligacion.tipo, periodo: obligacion.periodo, fechaVencimiento: obligacion.fechaVencimiento }
        );

        let estadoEnvio: "ENVIADO" | "ERROR" = "ENVIADO";
        try {
          await correoService.enviar({
            destinatarios,
            asunto: `[INCUMPLIMIENTO] DJI ${obligacion.tipo} ${obligacion.periodo} — ${sujeto.nombres} ${sujeto.apellidos}`,
            cuerpo,
          });
        } catch {
          estadoEnvio = "ERROR";
          resumen.errores++;
        }

        await prisma.alerta.create({
          data: {
            obligacionId: obligacion.id,
            tipo: "INCUMPLIMIENTO",
            canal: "CORREO",
            destinatarios: JSON.stringify(destinatarios),
            estadoEnvio,
            enviadoEn: estadoEnvio === "ENVIADO" ? new Date() : null,
          },
        });

        resumen.incumplimientosDetectados++;
      } catch (err) {
        console.error("[Motor] Error procesando incumplimiento:", obligacion.id, err);
        resumen.errores++;
      }
      continue;
    }

    // Alertas preventivas en hitos 30/15/5 días
    const tipoAlerta = tipoAlertaParaDias(diasRestantes);
    if (!tipoAlerta) continue;

    // Verificar si ya se envió esta alerta
    const alertaExistente = await prisma.alerta.findFirst({
      where: { obligacionId: obligacion.id, tipo: tipoAlerta },
    });
    if (alertaExistente) continue;

    try {
      const destinatarios = [sujeto.correo];
      const cuerpo = plantillaAlertaPreventiva(
        { nombres: sujeto.nombres, apellidos: sujeto.apellidos, cargo: sujeto.cargo, correo: sujeto.correo },
        { tipo: obligacion.tipo, periodo: obligacion.periodo, fechaVencimiento: obligacion.fechaVencimiento },
        diasRestantes
      );

      let estadoEnvio: "ENVIADO" | "ERROR" = "ENVIADO";
      try {
        await correoService.enviar({
          destinatarios,
          asunto: `[Alerta DJI] Vencimiento en ${diasRestantes} días — ${obligacion.tipo} ${obligacion.periodo}`,
          cuerpo,
        });
      } catch {
        estadoEnvio = "ERROR";
        resumen.errores++;
      }

      await prisma.alerta.create({
        data: {
          obligacionId: obligacion.id,
          tipo: tipoAlerta,
          canal: "CORREO",
          destinatarios: JSON.stringify(destinatarios),
          estadoEnvio,
          enviadoEn: estadoEnvio === "ENVIADO" ? new Date() : null,
        },
      });

      resumen.alertasEnviadas++;
    } catch (err) {
      console.error("[Motor] Error procesando alerta preventiva:", obligacion.id, err);
      resumen.errores++;
    }
  }

  await registrarEvento({
    tipo: "CRON_EJECUTADO",
    entidad: "Motor",
    detalle: JSON.stringify(resumen),
  });

  return resumen;
}

export async function enviarReportesSemanal(): Promise<{ reportesEnviados: number; errores: number }> {
  const { plantillaReporteSemanal } = await import("./plantillas");

  const sujetos = await prisma.sujetoObligado.findMany({
    where: { estado: "ACTIVO", jefeCorreo: { not: null } },
    include: { obligaciones: true },
  });

  const jefeMap = new Map<string, { nombre: string; correo: string; servidores: typeof sujetos }>();
  for (const s of sujetos) {
    if (!s.jefeCorreo) continue;
    if (!jefeMap.has(s.jefeCorreo)) {
      jefeMap.set(s.jefeCorreo, { nombre: s.jefeNombre ?? s.jefeCorreo, correo: s.jefeCorreo, servidores: [] });
    }
    jefeMap.get(s.jefeCorreo)!.servidores.push(s);
  }

  let reportesEnviados = 0;
  let errores = 0;
  const semana = getLunesStr();

  for (const [, jefe] of Array.from(jefeMap)) {
    const servidoresData = jefe.servidores.map((s: (typeof sujetos)[number]) => ({
      dni: s.dni,
      nombres: `${s.nombres} ${s.apellidos}`,
      cargo: s.cargo,
      obligaciones: s.obligaciones.map((o: (typeof s.obligaciones)[number]) => ({
        tipo: o.tipo,
        periodo: o.periodo,
        fechaVencimiento: o.fechaVencimiento.toISOString().slice(0, 10),
        estado: o.estado,
      })),
    }));

    const cuerpo = plantillaReporteSemanal(jefe, semana, servidoresData);

    try {
      await correoService.enviar({
        destinatarios: [jefe.correo],
        asunto: `[Reporte Semanal DJI] Semana ${semana} — ${jefe.servidores.length} servidor(es) a su cargo`,
        cuerpo,
      });
      reportesEnviados++;
    } catch {
      errores++;
    }
  }

  await registrarEvento({
    tipo: "CRON_EJECUTADO",
    entidad: "Motor",
    detalle: `Reportes semanales: enviados=${reportesEnviados}, errores=${errores}`,
  });

  return { reportesEnviados, errores };
}

function getLunesStr(): string {
  const hoy = new Date();
  const dia = hoy.getDay();
  const diff = dia === 0 ? -6 : 1 - dia;
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() + diff);
  return lunes.toISOString().slice(0, 10);
}
