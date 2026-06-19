import * as XLSX from "xlsx";

interface DatosCumplimiento {
  tipo: "cumplimiento" | "omisos" | "alertas";
  periodo: string;
  resumen: {
    totalSujetos: number;
    presentadosEnPlazo: number;
    presentadosConRetraso: number;
    omisos: number;
    pendientes: number;
    porcentajeCumplimiento: number;
    alertasEmitidas: number;
  };
  registros: Record<string, unknown>[];
}

export function generarReporteXLSX(datos: DatosCumplimiento): Buffer {
  const wb = XLSX.utils.book_new();

  // Hoja resumen
  const resumenData = [
    ["SISTEMA DE ALERTAS DJI — LEY N.° 31227"],
    [`Reporte de ${datos.tipo} — Período: ${datos.periodo}`],
    [`Generado: ${new Date().toLocaleString("es-PE")}`],
    [],
    ["Indicador", "Valor"],
    ["Total sujetos obligados", datos.resumen.totalSujetos],
    ["Presentados en plazo", datos.resumen.presentadosEnPlazo],
    ["Presentados con retraso", datos.resumen.presentadosConRetraso],
    ["Omisos", datos.resumen.omisos],
    ["Pendientes", datos.resumen.pendientes],
    ["% Cumplimiento", `${datos.resumen.porcentajeCumplimiento}%`],
    ["Alertas emitidas", datos.resumen.alertasEmitidas],
  ];

  const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
  wsResumen["A1"].s = { font: { bold: true, sz: 14 } };
  XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen");

  // Hoja detalle
  if (datos.registros.length > 0) {
    const wsDetalle = XLSX.utils.json_to_sheet(datos.registros);
    XLSX.utils.book_append_sheet(wb, wsDetalle, "Detalle");
  }

  return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
}
