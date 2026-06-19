interface SujetoInfo {
  nombres: string;
  apellidos: string;
  cargo: string;
  correo: string;
}

interface AlertaInfo {
  tipo: string;
  periodo: string;
  fechaVencimiento: Date;
}

interface ObligacionInfo {
  tipo: string;
  periodo: string;
  fechaVencimiento: Date;
}

const estiloBase = `
  font-family: Arial, sans-serif;
  max-width: 600px;
  margin: 0 auto;
  background: #ffffff;
`;

const estiloHeader = `
  background: #1e3a5f;
  color: #ffffff;
  padding: 20px 24px;
  border-radius: 4px 4px 0 0;
`;

const estiloBody = `
  padding: 24px;
  border: 1px solid #e2e8f0;
  border-top: none;
  border-radius: 0 0 4px 4px;
`;

const estiloAlerta = (color: string) => `
  background: ${color};
  border-left: 4px solid ${color === "#fef3c7" ? "#d97706" : color === "#fee2e2" ? "#dc2626" : "#2563eb"};
  padding: 12px 16px;
  margin: 16px 0;
  border-radius: 0 4px 4px 0;
`;

const estiloFooter = `
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
  font-size: 12px;
  color: #64748b;
`;

function formatFecha(fecha: Date): string {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(fecha));
}

function tipoObligacionTexto(tipo: string): string {
  const map: Record<string, string> = {
    INICIO_CARGO: "Inicio de Cargo",
    ANUAL: "Presentación Anual",
    CESE_CARGO: "Cese de Cargo",
  };
  return map[tipo] ?? tipo;
}

export function plantillaAlertaPreventiva(
  sujeto: SujetoInfo,
  alerta: AlertaInfo,
  diasRestantes: number
): string {
  const urgencia =
    diasRestantes <= 5
      ? { color: "#fee2e2", texto: "URGENTE", emoji: "🔴" }
      : diasRestantes <= 15
        ? { color: "#fef3c7", texto: "PRÓXIMO", emoji: "🟡" }
        : { color: "#dbeafe", texto: "RECORDATORIO", emoji: "🔵" };

  return `
<div style="${estiloBase}">
  <div style="${estiloHeader}">
    <h2 style="margin:0;font-size:18px;">Sistema de Alertas DJI</h2>
    <p style="margin:4px 0 0;font-size:13px;opacity:0.85;">Declaraciones Juradas de Intereses — Ley N.° 31227</p>
  </div>
  <div style="${estiloBody}">
    <p>Estimado/a <strong>${sujeto.nombres} ${sujeto.apellidos}</strong>,</p>

    <div style="${estiloAlerta(urgencia.color)}">
      <strong>${urgencia.emoji} ${urgencia.texto}: Vencimiento en ${diasRestantes} día${diasRestantes !== 1 ? "s" : ""}</strong>
    </div>

    <p>Le recordamos que tiene pendiente la presentación de su <strong>Declaración Jurada de Intereses</strong>:</p>

    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr style="border-bottom:1px solid #e2e8f0;">
        <td style="padding:8px 4px;color:#64748b;font-size:14px;">Tipo</td>
        <td style="padding:8px 4px;font-weight:600;font-size:14px;">${tipoObligacionTexto(alerta.tipo)}</td>
      </tr>
      <tr style="border-bottom:1px solid #e2e8f0;">
        <td style="padding:8px 4px;color:#64748b;font-size:14px;">Período</td>
        <td style="padding:8px 4px;font-weight:600;font-size:14px;">${alerta.periodo}</td>
      </tr>
      <tr style="border-bottom:1px solid #e2e8f0;">
        <td style="padding:8px 4px;color:#64748b;font-size:14px;">Fecha límite</td>
        <td style="padding:8px 4px;font-weight:600;font-size:14px;">${formatFecha(alerta.fechaVencimiento)}</td>
      </tr>
      <tr>
        <td style="padding:8px 4px;color:#64748b;font-size:14px;">Cargo</td>
        <td style="padding:8px 4px;font-size:14px;">${sujeto.cargo}</td>
      </tr>
    </table>

    <p style="font-size:14px;">Por favor, presente su DJI antes de la fecha límite indicada para evitar incumplimiento.</p>

    <div style="${estiloFooter}">
      <p>Oficina de Integridad Institucional<br>
      Este es un mensaje automático del Sistema de Alertas DJI. No responda a este correo.</p>
    </div>
  </div>
</div>`;
}

export function plantillaIncumplimiento(
  sujeto: SujetoInfo,
  obligacion: ObligacionInfo
): string {
  return `
<div style="${estiloBase}">
  <div style="background:#991b1b;color:#ffffff;padding:20px 24px;border-radius:4px 4px 0 0;">
    <h2 style="margin:0;font-size:18px;">⚠️ INCUMPLIMIENTO — Sistema de Alertas DJI</h2>
    <p style="margin:4px 0 0;font-size:13px;opacity:0.85;">Declaraciones Juradas de Intereses — Ley N.° 31227</p>
  </div>
  <div style="${estiloBody}">
    <div style="${estiloAlerta("#fee2e2")}">
      <strong>🔴 INCUMPLIMIENTO DETECTADO</strong><br>
      <span style="font-size:14px;">El plazo para la presentación de la DJI ha vencido sin que se registre la presentación.</span>
    </div>

    <p><strong>Sujeto obligado:</strong> ${sujeto.nombres} ${sujeto.apellidos}<br>
    <strong>Cargo:</strong> ${sujeto.cargo}</p>

    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr style="border-bottom:1px solid #e2e8f0;">
        <td style="padding:8px 4px;color:#64748b;font-size:14px;">Tipo de obligación</td>
        <td style="padding:8px 4px;font-weight:600;font-size:14px;">${tipoObligacionTexto(obligacion.tipo)}</td>
      </tr>
      <tr style="border-bottom:1px solid #e2e8f0;">
        <td style="padding:8px 4px;color:#64748b;font-size:14px;">Período</td>
        <td style="padding:8px 4px;font-weight:600;font-size:14px;">${obligacion.periodo}</td>
      </tr>
      <tr>
        <td style="padding:8px 4px;color:#64748b;font-size:14px;">Fecha límite vencida</td>
        <td style="padding:8px 4px;font-weight:600;color:#dc2626;font-size:14px;">${formatFecha(obligacion.fechaVencimiento)}</td>
      </tr>
    </table>

    <p style="font-size:14px;">Se ha registrado este incumplimiento en el sistema para los efectos legales correspondientes según la Ley N.° 31227.</p>

    <div style="${estiloFooter}">
      <p>Oficina de Integridad Institucional<br>
      Este es un mensaje automático del Sistema de Alertas DJI. No responda a este correo.</p>
    </div>
  </div>
</div>`;
}

interface ServidorReporte {
  dni: string;
  nombres: string;
  cargo: string;
  obligaciones: { tipo: string; periodo: string; fechaVencimiento: string; estado: string }[];
}

function colorEstado(estado: string): string {
  if (estado === "PRESENTADO_EN_PLAZO") return "#dcfce7";
  if (estado === "PRESENTADO_CON_RETRASO") return "#fef9c3";
  if (estado === "OMISO") return "#fee2e2";
  return "#f1f5f9";
}

function textoEstado(estado: string): string {
  const map: Record<string, string> = {
    PRESENTADO_EN_PLAZO: "Presentado en plazo",
    PRESENTADO_CON_RETRASO: "Regularizado con retraso",
    OMISO: "Omiso",
    PENDIENTE: "Pendiente",
  };
  return map[estado] ?? estado;
}

export function plantillaReporteSemanal(
  jefe: { nombre: string; correo: string },
  semana: string,
  servidores: ServidorReporte[]
): string {
  const filas = servidores
    .flatMap((s) =>
      s.obligaciones.map(
        (o) => `
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:6px 8px;font-size:13px;">${s.nombres}</td>
          <td style="padding:6px 8px;font-size:13px;color:#64748b;">${s.cargo}</td>
          <td style="padding:6px 8px;font-size:13px;">${o.tipo} ${o.periodo}</td>
          <td style="padding:6px 8px;font-size:13px;">${o.fechaVencimiento}</td>
          <td style="padding:6px 8px;font-size:12px;background:${colorEstado(o.estado)};border-radius:4px;">${textoEstado(o.estado)}</td>
        </tr>`
      )
    )
    .join("");

  return `
<div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;background:#ffffff;">
  <div style="background:#1e3a5f;color:#ffffff;padding:20px 24px;border-radius:4px 4px 0 0;">
    <h2 style="margin:0;font-size:18px;">Reporte Semanal DJI</h2>
    <p style="margin:4px 0 0;font-size:13px;opacity:0.85;">Semana del ${semana} — Servidores a su cargo</p>
  </div>
  <div style="padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 4px 4px;">
    <p>Estimado/a <strong>${jefe.nombre}</strong>,</p>
    <p style="font-size:14px;">Resumen semanal del estado de las Declaraciones Juradas de Intereses de los servidores bajo su jefatura:</p>
    <table style="width:100%;border-collapse:collapse;margin-top:16px;">
      <thead>
        <tr style="background:#f1f5f9;">
          <th style="padding:8px;text-align:left;border-bottom:2px solid #e2e8f0;font-size:13px;">Servidor</th>
          <th style="padding:8px;text-align:left;border-bottom:2px solid #e2e8f0;font-size:13px;">Cargo</th>
          <th style="padding:8px;text-align:left;border-bottom:2px solid #e2e8f0;font-size:13px;">Obligación</th>
          <th style="padding:8px;text-align:left;border-bottom:2px solid #e2e8f0;font-size:13px;">Vencimiento</th>
          <th style="padding:8px;text-align:left;border-bottom:2px solid #e2e8f0;font-size:13px;">Estado</th>
        </tr>
      </thead>
      <tbody>${filas || '<tr><td colspan="5" style="padding:16px;text-align:center;color:#64748b;">Sin obligaciones registradas.</td></tr>'}</tbody>
    </table>
    <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;">
      <p>Oficina de Integridad Institucional<br>Reporte automático semanal del Sistema de Alertas DJI. No responda este correo.</p>
    </div>
  </div>
</div>`;
}
