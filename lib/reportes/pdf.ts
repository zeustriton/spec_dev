import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface DatosPDF {
  tipo: "cumplimiento" | "omisos" | "alertas";
  periodo: string;
  resumen: {
    totalSujetos: number;
    presentadosEnPlazo: number;
    presentadosConRetraso: number;
    omisos: number;
    pendientes: number;
    porcentajeCumplimiento: number;
  };
  columnas: string[];
  filas: (string | number)[][];
}

export function generarReportePDF(datos: DatosPDF): Buffer {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  // Encabezado institucional
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("SISTEMA DE ALERTAS DJI — LEY N.° 31227", 14, 20);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Reporte de ${datos.tipo} — Período: ${datos.periodo}`, 14, 28);
  doc.text(`Generado: ${new Date().toLocaleString("es-PE")}`, 14, 34);

  // Resumen
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Resumen", 14, 44);

  autoTable(doc, {
    startY: 48,
    head: [["Indicador", "Valor"]],
    body: [
      ["Total sujetos", String(datos.resumen.totalSujetos)],
      ["Presentados en plazo", String(datos.resumen.presentadosEnPlazo)],
      ["Con retraso", String(datos.resumen.presentadosConRetraso)],
      ["Omisos", String(datos.resumen.omisos)],
      ["Pendientes", String(datos.resumen.pendientes)],
      ["% Cumplimiento", `${datos.resumen.porcentajeCumplimiento}%`],
    ],
    theme: "striped",
    tableWidth: 100,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [30, 58, 95] },
  });

  // Tabla de detalle
  const startY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Detalle", 14, startY);

  if (datos.filas.length > 0) {
    autoTable(doc, {
      startY: startY + 4,
      head: [datos.columnas],
      body: datos.filas.map((f) => f.map(String)),
      theme: "striped",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 58, 95] },
    });
  }

  // Pie de página
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Página ${i} de ${pageCount} — Oficina de Integridad Institucional`,
      14,
      doc.internal.pageSize.height - 8
    );
  }

  return Buffer.from(doc.output("arraybuffer"));
}
