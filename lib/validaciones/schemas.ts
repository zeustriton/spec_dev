import { z } from "zod";

export const SujetoSchema = z.object({
  dni: z.string().regex(/^\d{8}$/, "El DNI debe tener exactamente 8 dígitos"),
  nombres: z.string().min(2, "Nombres requeridos"),
  apellidos: z.string().min(2, "Apellidos requeridos"),
  cargo: z.string().min(2, "Cargo requerido"),
  nivelJerarquico: z.string().min(2, "Nivel jerárquico requerido"),
  correo: z.string().email("Correo inválido"),
  jefeCorreo: z.string().email("Correo de jefe inválido").optional().or(z.literal("")),
  jefeNombre: z.string().optional(),
  jefeDni: z.string().regex(/^\d{8}$/).optional().or(z.literal("")),
  unidadOrganicaId: z.string().cuid("ID de unidad orgánica inválido"),
});

export const ObligacionSchema = z.object({
  sujetoId: z.string().cuid(),
  tipo: z.enum(["INICIO_CARGO", "ANUAL", "CESE_CARGO"]),
  periodo: z.string().min(4, "Periodo requerido (ej: 2026)"),
  fechaVencimiento: z.string().datetime("Fecha de vencimiento inválida"),
  observaciones: z.string().optional(),
});

export const RegistrarPresentacionSchema = z.object({
  fechaPresentacion: z.string().datetime("Fecha de presentación inválida"),
  observaciones: z.string().optional(),
});

export const ExportarSchema = z.object({
  formato: z.enum(["xlsx", "pdf"]),
  tipo: z.enum(["cumplimiento", "omisos", "alertas"]),
  periodo: z.string().optional(),
  unidadId: z.string().optional(),
  organo: z.string().optional(),
});

export const UnidadOrganicaSchema = z.object({
  nombre: z.string().min(2, "Nombre requerido"),
  organo: z.string().min(2, "Órgano requerido"),
});

export type SujetoInput = z.infer<typeof SujetoSchema>;
export type ObligacionInput = z.infer<typeof ObligacionSchema>;
export type RegistrarPresentacionInput = z.infer<typeof RegistrarPresentacionSchema>;
export type ExportarInput = z.infer<typeof ExportarSchema>;
