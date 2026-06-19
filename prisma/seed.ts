import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";
import "dotenv/config";

const dbUrl = process.env.DATABASE_URL ?? "file:../db/dji-alertas.db";
const dbPath = dbUrl.replace(/^file:/, "");
const absolutePath = path.isAbsolute(dbPath)
  ? dbPath
  : path.resolve(process.cwd(), dbPath);

const absoluteUrl = `file:${absolutePath}`;
const adapter = new PrismaBetterSqlite3({ url: absoluteUrl });
const prisma = new PrismaClient({ adapter });

function diasDesdeHoy(dias: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  d.setHours(23, 59, 59, 0);
  return d;
}

async function main() {
  console.log("🌱 Iniciando seed con datos sintéticos...");

  // Unidades orgánicas
  const [rrhhUnit, oinUnit] = await Promise.all([
    prisma.unidadOrganica.upsert({
      where: { id: "seed-unidad-rrhh" },
      update: {},
      create: { id: "seed-unidad-rrhh", nombre: "Oficina de Recursos Humanos", organo: "Secretaría General" },
    }),
    prisma.unidadOrganica.upsert({
      where: { id: "seed-unidad-oin" },
      update: {},
      create: { id: "seed-unidad-oin", nombre: "Oficina de Integridad Institucional", organo: "Órgano de Control" },
    }),
  ]);

  // Usuarios del sistema
  await Promise.all([
    prisma.user.upsert({
      where: { email: "admin@test.local" },
      update: {},
      create: { email: "admin@test.local", name: "Administrador Test", rol: "ADMIN" },
    }),
    prisma.user.upsert({
      where: { email: "operador@test.local" },
      update: {},
      create: { email: "operador@test.local", name: "Operador Test", rol: "OPERADOR" },
    }),
    prisma.user.upsert({
      where: { email: "direccion@test.local" },
      update: {},
      create: { email: "direccion@test.local", name: "Alta Dirección Test", rol: "ALTA_DIRECCION" },
    }),
  ]);

  // Sujetos obligados (datos 100% sintéticos)
  const sujetos = [
    { id: "seed-sujeto-1", dni: "00000001", nombres: "Juan", apellidos: "Pérez García", cargo: "Jefe de Oficina", nivelJerarquico: "Directivo", correo: "juan@test.local", jefeCorreo: "jefe@test.local", jefeNombre: "María López", jefeDni: "00000099", unidadOrganicaId: rrhhUnit.id, diasVencimiento: 30 },
    { id: "seed-sujeto-2", dni: "00000002", nombres: "María", apellidos: "López Torres", cargo: "Directora de Área", nivelJerarquico: "Directivo", correo: "maria@test.local", jefeCorreo: "director@test.local", jefeNombre: "Carlos Ruiz", jefeDni: "00000098", unidadOrganicaId: rrhhUnit.id, diasVencimiento: 15 },
    { id: "seed-sujeto-3", dni: "00000003", nombres: "Carlos", apellidos: "Ruiz Mendoza", cargo: "Especialista Senior", nivelJerarquico: "Profesional", correo: "carlos@test.local", jefeCorreo: "jefe@test.local", jefeNombre: "María López", jefeDni: "00000099", unidadOrganicaId: oinUnit.id, diasVencimiento: 5 },
    { id: "seed-sujeto-4", dni: "00000004", nombres: "Ana", apellidos: "Torres Vega", cargo: "Analista", nivelJerarquico: "Técnico", correo: "ana@test.local", jefeCorreo: "jefe@test.local", jefeNombre: "María López", jefeDni: "00000099", unidadOrganicaId: oinUnit.id, diasVencimiento: -1 },
    { id: "seed-sujeto-5", dni: "00000005", nombres: "Luis", apellidos: "Gómez Paredes", cargo: "Técnico", nivelJerarquico: "Técnico", correo: "luis@test.local", unidadOrganicaId: rrhhUnit.id, diasVencimiento: 0 },
  ];

  for (const s of sujetos) {
    const { diasVencimiento, ...datos } = s;
    const sujeto = await prisma.sujetoObligado.upsert({
      where: { id: datos.id },
      update: {},
      create: { ...datos, estado: datos.id === "seed-sujeto-5" ? "INACTIVO" : "ACTIVO" },
    });

    if (sujeto.estado === "ACTIVO") {
      await prisma.obligacionDJI.upsert({
        where: { sujetoId_tipo_periodo: { sujetoId: sujeto.id, tipo: "ANUAL", periodo: "2026" } },
        update: {},
        create: {
          sujetoId: sujeto.id,
          tipo: "ANUAL",
          periodo: "2026",
          fechaVencimiento: diasDesdeHoy(diasVencimiento),
          estado: "PENDIENTE",
        },
      });
    }
  }

  console.log("✅ Seed completado. Datos sintéticos cargados (OWASP LLM06 — sin datos reales).");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
