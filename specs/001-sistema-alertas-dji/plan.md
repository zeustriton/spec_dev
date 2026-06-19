# Implementation Plan: Sistema de Alertas DJI

**Branch**: `claude/great-gates-4pkvhe` | **Date**: 2026-06-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-sistema-alertas-dji/spec.md`

## Summary

Sistema web full-stack de alertas preventivas para la presentación oportuna de la
Declaración Jurada de Intereses (DJI) bajo Ley N.° 31227. Implementa registro dinámico
de sujetos obligados, motor de alertas escalonadas (30/15/5 días + incumplimiento),
tablero de control con indicadores de cumplimiento y módulo de reportes exportables.
Construido sobre Next.js 16 + TypeScript 5 + Prisma/SQLite, con autenticación
institucional vía NextAuth.js y tres roles de acceso diferenciados.

## Technical Context

**Language/Version**: TypeScript 5 con Next.js 16 (App Router)

**Runtime & Package Manager**: Bun (latest)

**Primary Dependencies**:
- Next.js 16, TypeScript 5, Bun — framework y runtime
- Prisma ORM (latest) + SQLite — persistencia
- NextAuth.js v4 — autenticación con cuenta institucional
- Tailwind CSS 4, shadcn/ui (New York), Lucide Icons — UI
- Framer Motion, next-themes — animaciones y tema claro/oscuro
- Zustand — estado del cliente
- TanStack Query — estado del servidor y caché
- Socket.io — actualizaciones en tiempo real del tablero
- Caddy — gateway y proxy inverso
- Nodemailer o equivalente — envío de correos institucionales (SMTP)
- xlsx + jsPDF — generación de reportes XLSX y PDF

**Storage**: SQLite (archivo local en `/db/dji-alertas.db`)

**Testing**: Bun test (unit), Playwright (e2e flujos críticos)

**Target Platform**: Servidor Linux (instancia local de la entidad o VPS)

**Project Type**: Web application full-stack (Server Components + Client Components)

**Performance Goals**:
- Tablero carga en menos de 2 segundos para hasta 500 sujetos obligados
- Motor de alertas procesa el ciclo diario completo en menos de 5 minutos
- Exportación de reportes en menos de 10 segundos

**Constraints**:
- HTTPS/TLS obligatorio (provisto por Caddy)
- Sin dependencias con costo de licencia recurrente
- Base de datos embebida (SQLite); no requiere servidor de BD separado
- Despliegue autocontenido: un solo servidor, sin microservicios adicionales en v1

**Scale/Scope**:
- Hasta 500 sujetos obligados por entidad
- Hasta 10 usuarios del sistema (administradores + operadores + Alta Dirección)
- 3 tipos de obligación DJI fijos (Inicio, Anual, Cese)
- Ciclo de alertas ejecutado 1 vez por día (cron job o scheduled task)

## Constitution Check

*GATE: Verificación pre-implementación de todos los principios*

| Principio | Estado | Evidencia |
|-----------|--------|-----------|
| I. Preventivo sobre reactivo | ✅ PASS | Motor de alertas emite 3 alertas antes del vencimiento; la alerta de incumplimiento es consecuencia, no propósito principal |
| II. Registro dinámico | ✅ PASS | Importación masiva CSV/Excel + API de actualización individual; límite 24h cubierto por proceso diario |
| III. Alertas escalonadas | ✅ PASS | Cron job diario verifica hitos 30/15/5/+1 días; calendario hardcodeado, no configurable por UI |
| IV. Trazabilidad y evidencia | ✅ PASS | Tabla `AuditLog` inmutable en BD; todos los eventos registrados con timestamp y userId |
| V. Bajo costo | ✅ PASS | Stack 100% open source; SQLite embebido; sin servicios de pago |
| VI. Simplicidad | ✅ PASS | UI con shadcn/ui estándar; operaciones CRUD simples; documentación de operación incluida |
| VII. Seguridad por diseño | ✅ PASS | NextAuth.js para auth; Prisma previene SQL injection; RBAC con 3 roles; HTTPS vía Caddy; AuditLog cubre A09; datos sintéticos en dev |

**OWASP Top 10 — Checklist de controles**:
- [x] A01 Broken Access Control — middleware de roles en cada API Route
- [x] A02 Cryptographic Failures — HTTPS/TLS vía Caddy; contraseñas nunca almacenadas (OAuth/SSO)
- [x] A03 Injection — Prisma ORM para todas las queries; validación con Zod en inputs
- [x] A05 Security Misconfiguration — variables de entorno en `.env` (no en repo); `.gitignore` estricto
- [x] A07 Auth Failures — NextAuth.js delegado a proveedor institucional; sesiones con JWT seguro
- [x] A09 Security Logging — `AuditLog` registra todos los eventos de acceso y modificación

**OWASP AI — Checklist de controles**:
- [x] LLM01 Prompt Injection — código generado por GLM revisado antes de integrar
- [x] LLM06 Sensitive Information Disclosure — desarrollo y pruebas con datos sintéticos únicamente
- [x] LLM08 Excessive Agency — agente GLM sin acceso a BD de producción ni canales de alerta reales

*Re-check post-diseño: PASS en todos los principios*

## Project Structure

### Documentation (this feature)

```text
specs/001-sistema-alertas-dji/
├── plan.md              # Este archivo
├── research.md          # Decisiones técnicas y alternativas evaluadas
├── data-model.md        # Modelo de datos completo con entidades y relaciones
├── quickstart.md        # Guía de validación end-to-end
├── contracts/           # API contracts (rutas, payloads, respuestas)
│   ├── api-sujetos.md
│   ├── api-alertas.md
│   ├── api-reportes.md
│   └── api-auth.md
└── tasks.md             # Generado por /speckit-tasks
```

### Source Code (repository root)

```text
src/
├── app/                          # Next.js App Router
│   ├── (auth)/
│   │   └── login/page.tsx        # Página de login institucional
│   ├── (dashboard)/
│   │   ├── layout.tsx            # Layout con nav + control de roles
│   │   ├── page.tsx              # Tablero principal (resumen)
│   │   ├── sujetos/              # Módulo registro de sujetos obligados
│   │   │   ├── page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   └── importar/page.tsx
│   │   ├── alertas/              # Módulo historial de alertas
│   │   │   └── page.tsx
│   │   ├── reportes/             # Módulo reportes y exportación
│   │   │   └── page.tsx
│   │   └── admin/                # Configuración del sistema (solo admin pleno)
│   │       └── page.tsx
│   └── api/                      # API Routes (backend)
│       ├── auth/[...nextauth]/route.ts
│       ├── sujetos/
│       │   ├── route.ts          # GET list, POST create
│       │   ├── [id]/route.ts     # GET, PUT, DELETE
│       │   └── importar/route.ts # POST bulk import
│       ├── obligaciones/
│       │   ├── route.ts
│       │   └── [id]/
│       │       ├── route.ts
│       │       └── registrar-presentacion/route.ts
│       ├── alertas/
│       │   └── route.ts          # GET historial
│       ├── reportes/
│       │   ├── semanal/route.ts
│       │   └── exportar/route.ts
│       └── cron/
│           └── procesar-alertas/route.ts  # Endpoint protegido para cron job
├── components/
│   ├── ui/                       # shadcn/ui components (auto-generados)
│   ├── sujetos/
│   │   ├── SujetoForm.tsx
│   │   ├── SujetosTable.tsx
│   │   └── ImportarModal.tsx
│   ├── tablero/
│   │   ├── IndicadoresPanel.tsx
│   │   ├── CumplimientoChart.tsx
│   │   └── AlertasRecientes.tsx
│   ├── alertas/
│   │   └── AlertasHistorial.tsx
│   └── shared/
│       ├── RolGuard.tsx          # Control de acceso por rol en UI
│       └── ExportButton.tsx
├── lib/
│   ├── auth.ts                   # Configuración NextAuth.js
│   ├── prisma.ts                 # Cliente Prisma singleton
│   ├── roles.ts                  # Definición de roles y permisos
│   ├── alertas/
│   │   ├── motor.ts              # Lógica core del motor de alertas
│   │   └── correo.ts             # Envío de correos (Nodemailer)
│   ├── reportes/
│   │   ├── xlsx.ts               # Generación Excel
│   │   └── pdf.ts                # Generación PDF
│   └── validaciones/
│       └── schemas.ts            # Esquemas Zod para inputs
├── middleware.ts                  # Protección de rutas por rol (NextAuth)
├── prisma/
│   ├── schema.prisma             # Modelo de datos
│   └── seed.ts                   # Datos sintéticos para desarrollo
db/
│   └── dji-alertas.db            # SQLite (gitignored)
scripts/
│   └── cron-alertas.sh           # Script cron para invocar /api/cron/procesar-alertas
.env.example                      # Variables de entorno (sin valores reales)
Caddyfile                         # Configuración gateway
```

**Structure Decision**: Web application full-stack con Next.js App Router. Backend
servido como API Routes (no Server Actions para lógica de negocio crítica). Frontend
con Server Components para páginas y Client Components para interactividad (tablero,
formularios). SQLite embebido, sin servidor de BD externo.

## Complexity Tracking

> No hay violaciones de la constitución. Sección no aplica.
