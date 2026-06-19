import nodemailer from "nodemailer";

interface EnviarParams {
  destinatarios: string[];
  asunto: string;
  cuerpo: string;
}

function crearTransporte() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "localhost",
    port: Number(process.env.SMTP_PORT ?? 1025),
    secure: false,
    auth:
      process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });
}

export class CorreoService {
  async enviar({ destinatarios, asunto, cuerpo }: EnviarParams): Promise<void> {
    const transporte = crearTransporte();
    try {
      await transporte.sendMail({
        from: process.env.EMAIL_FROM ?? "noreply@entidad.gob.pe",
        to: destinatarios.join(", "),
        subject: asunto,
        html: cuerpo,
      });
    } catch (err) {
      console.error("[CorreoService] Error al enviar correo:", {
        destinatarios,
        asunto,
        error: err,
      });
      throw err;
    }
  }
}
