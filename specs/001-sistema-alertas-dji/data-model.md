# Data Model: Sistema de Alertas DJI

**Feature**: 001-sistema-alertas-dji
**Date**: 2026-06-19
**Storage**: SQLite via Prisma ORM (`/db/dji-alertas.db`)

---

## Entidades y Relaciones

```
UnidadOrganica ──< SujetoObligado >── ObligacionDJI ──< Alerta
                         │                   │
                         └── User (rol)       └── AuditLog
                                │
                               User ──< AuditLog
```

---

## Schema Prisma

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")  // file:../db/dji-alertas.db
}

// ─── Roles de usuario ────────────────────────────────────────
enum Rol {
  ADMIN        // Administrador pleno
  OPERADOR     // Operador de lectura
  ALTA_DIRECCION
}

// ─── Usuario del sistema ─────────────────────────────────────
model User {
  id            String      @id @default(cuid())
  email         String      @unique
  name          String?
  rol           Rol         @default(OPERADOR)
  activo        Boolean     @default(true)
  creadoEn      DateTime    @default(now())
  actualizadoEn DateTime    @updatedAt

  // NextAuth relations
  accounts      Account[]
  sessions      Session[]
  auditLogs     AuditLog[]
}

// ─── NextAuth (tablas requeridas) ───────────────────────────
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  @@unique([identifier, token])
}

// ─── Unidad Orgánica ─────────────────────────────────────────
model UnidadOrganica {
  id            String    @id @default(cuid())
  nombre        String
  organo        String    // Órgano al que pertenece
  activa        Boolean   @default(true)
  creadoEn      DateTime  @default(now())
  actualizadoEn DateTime  @updatedAt

  sujetos       SujetoObligado[]
}

// ─── Sujeto Obligado ─────────────────────────────────────────
model SujetoObligado {
  id               String         @id @default(cuid())
  dni              String         @unique
  nombres          String
  apellidos        String
  cargo            String
  nivelJerarquico  String         // Ej: "Directivo", "Profesional", "Técnico"
  correo           String
  jefeDni          String?        // DNI del jefe inmediato (referencia débil)
  jefeNombre       String?        // Nombre del jefe inmediato
  jefeCorreo       String?        // Correo del jefe inmediato
  estado           EstadoSujeto   @default(ACTIVO)
  fechaBaja        DateTime?
  unidadOrganicaId String
  creadoEn         DateTime       @default(now())
  actualizadoEn    DateTime       @updatedAt

  unidadOrganica   UnidadOrganica   @relation(fields: [unidadOrganicaId], references: [id])
  obligaciones     ObligacionDJI[]
}

enum EstadoSujeto {
  ACTIVO
  INACTIVO
}

// ─── Obligación DJI ──────────────────────────────────────────
model ObligacionDJI {
  id                   String          @id @default(cuid())
  sujetoId             String
  tipo                 TipoObligacion
  periodo              String          // Ej: "2026", "2026-INICIO"
  fechaVencimiento     DateTime
  estado               EstadoObligacion @default(PENDIENTE)
  fechaPresentacion    DateTime?       // Registrada manualmente por administrador
  registradoPorId      String?         // User.id del admin que registró la presentación
  observaciones        String?
  creadoEn             DateTime        @default(now())
  actualizadoEn        DateTime        @updatedAt

  sujeto               SujetoObligado  @relation(fields: [sujetoId], references: [id])
  alertas              Alerta[]
  auditLogs            AuditLog[]

  @@unique([sujetoId, tipo, periodo])
}

enum TipoObligacion {
  INICIO_CARGO   // Declaración de Inicio de cargo
  ANUAL          // Declaración Anual
  CESE_CARGO     // Declaración de Cese de cargo
}

enum EstadoObligacion {
  PENDIENTE
  PRESENTADO_EN_PLAZO
  PRESENTADO_CON_RETRASO
  OMISO
}

// ─── Alerta ──────────────────────────────────────────────────
model Alerta {
  id             String        @id @default(cuid())
  obligacionId   String
  tipo           TipoAlerta
  canal          CanalAlerta   @default(CORREO)
  destinatarios  String        // JSON array de correos ["a@b.com","c@d.com"]
  estadoEnvio    EstadoEnvio   @default(PENDIENTE)
  errorDetalle   String?       // Detalle del error si estadoEnvio = ERROR
  enviadoEn      DateTime?
  creadoEn       DateTime      @default(now())

  obligacion     ObligacionDJI @relation(fields: [obligacionId], references: [id])
}

enum TipoAlerta {
  PREVENTIVA_30  // 30 días antes
  PREVENTIVA_15  // 15 días antes
  PREVENTIVA_5   // 5 días antes
  INCUMPLIMIENTO // Día siguiente al vencimiento
}

enum CanalAlerta {
  CORREO
  WHATSAPP  // Reservado para v2
}

enum EstadoEnvio {
  PENDIENTE
  ENVIADO
  ERROR
}

// ─── Log de Auditoría (INMUTABLE) ───────────────────────────
model AuditLog {
  id            String        @id @default(cuid())
  tipo          TipoEvento
  userId        String?       // Quién realizó la acción (null = sistema/cron)
  entidad       String        // Nombre de la entidad afectada (ej: "ObligacionDJI")
  entidadId     String?       // ID del registro afectado
  detalle       String        // Descripción del evento (JSON o texto)
  obligacionId  String?       // Referencia opcional a obligación relacionada
  timestamp     DateTime      @default(now())

  user          User?         @relation(fields: [userId], references: [id])
  obligacion    ObligacionDJI? @relation(fields: [obligacionId], references: [id])
}

enum TipoEvento {
  // Sujetos
  SUJETO_CREADO
  SUJETO_ACTUALIZADO
  SUJETO_DESACTIVADO
  SUJETO_IMPORTADO
  // Obligaciones
  OBLIGACION_CREADA
  PRESENTACION_REGISTRADA
  REGULARIZACION_REGISTRADA
  // Alertas
  ALERTA_ENVIADA
  ALERTA_ERROR
  // Sistema
  CRON_EJECUTADO
  LOGIN
  ACCESO_DENEGADO
}
```

---

## Reglas de validación

| Campo | Regla |
|-------|-------|
| `SujetoObligado.dni` | 8 dígitos numéricos, único en el sistema |
| `SujetoObligado.correo` | Formato email válido, dominio institucional preferido |
| `ObligacionDJI.fechaVencimiento` | MUST ser futura al momento de creación |
| `ObligacionDJI [sujetoId, tipo, periodo]` | Unique — un sujeto no puede tener dos obligaciones del mismo tipo en el mismo periodo |
| `Alerta` | MUST NOT crearse si la ObligacionDJI tiene estado `PRESENTADO_*` |
| `AuditLog` | Solo INSERT — nunca UPDATE ni DELETE en esta tabla |

---

## Transiciones de estado

### EstadoObligacion

```
PENDIENTE
  ├── → PRESENTADO_EN_PLAZO   (cuando admin registra presentación antes o en la fechaVencimiento)
  ├── → PRESENTADO_CON_RETRASO (cuando admin registra presentación después de fechaVencimiento)
  └── → OMISO                  (asignado por cron al día siguiente del vencimiento si sigue PENDIENTE)

OMISO
  └── → PRESENTADO_CON_RETRASO (cuando admin registra presentación extemporánea)
```

### EstadoSujeto

```
ACTIVO  → INACTIVO  (baja o cese)
INACTIVO → ACTIVO   (reincorporación — requiere nueva obligación si aplica)
```

---

## Índices recomendados

```prisma
// Agregar en modelos para performance:
@@index([estado])                    // en SujetoObligado
@@index([sujetoId, estado])          // en ObligacionDJI
@@index([fechaVencimiento, estado])  // en ObligacionDJI (clave para el cron)
@@index([obligacionId])              // en Alerta
@@index([timestamp])                 // en AuditLog
```
