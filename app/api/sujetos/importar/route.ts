import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { registrarEvento } from "@/lib/audit";
import { SujetoSchema } from "@/lib/validaciones/schemas";
import * as XLSX from "xlsx";

interface FilaImportacion {
  dni?: unknown;
  nombres?: unknown;
  apellidos?: unknown;
  cargo?: unknown;
  nivelJerarquico?: unknown;
  correo?: unknown;
  jefeCorreo?: unknown;
  jefeNombre?: unknown;
  jefeDni?: unknown;
  unidadOrganicaId?: unknown;
}

export async function POST(request: NextRequest) {
  const authResult = await requireRole(["ADMIN"]);
  if (authResult.error) return authResult.error;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Multipart inválido" }, { status: 400 });
  }

  const file = formData.get("archivo");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "Archivo requerido (campo: archivo)" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const filas = XLSX.utils.sheet_to_json<FilaImportacion>(sheet);

  const exitosos: string[] = [];
  const errores: { fila: number; error: string }[] = [];

  for (let i = 0; i < filas.length; i++) {
    const fila = filas[i];
    const parsed = SujetoSchema.safeParse(fila);
    if (!parsed.success) {
      errores.push({ fila: i + 2, error: JSON.stringify(parsed.error.flatten().fieldErrors) });
      continue;
    }

    try {
      const sujeto = await prisma.sujetoObligado.upsert({
        where: { dni: parsed.data.dni },
        update: { ...parsed.data },
        create: { ...parsed.data, estado: "ACTIVO" },
      });

      await registrarEvento({
        tipo: "SUJETO_IMPORTADO",
        userId: authResult.session.user.id,
        entidad: "SujetoObligado",
        entidadId: sujeto.id,
        detalle: `Importado: ${sujeto.nombres} ${sujeto.apellidos} (DNI: ${sujeto.dni})`,
      });

      exitosos.push(sujeto.id);
    } catch (err) {
      errores.push({ fila: i + 2, error: err instanceof Error ? err.message : "Error desconocido" });
    }
  }

  return NextResponse.json({
    importados: exitosos.length,
    errores: errores.length,
    detalleErrores: errores,
  });
}
