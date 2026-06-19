---
description: "Task list for Sistema de Alertas DJI - 001"
---

# Tasks: Sistema de Alertas para Declaración Jurada de Intereses

**Input**: Design documents from `specs/001-sistema-alertas-dji/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | data-model.md ✅ | contracts/ ✅ | research.md ✅ | quickstart.md ✅

**Organization**: Tasks organized by user story for independent implementation and delivery.

---

## Phase 1: Setup (Infraestructura compartida)

**Purpose**: Inicialización del proyecto y estructura base

- [ ] T001 Inicializar proyecto Next.js 16 con TypeScript 5 usando Bun: `bun create next-app . --typescript --tailwind --app --no-src-dir` y ajustar `package.json`
- [ ] T002 Configurar Bun como runtime en `package.json` (scripts: dev, build, start, lint)
- [ ] T003 [P] Instalar dependencias principales: `bun add prisma @prisma/client next-auth @auth/prisma-adapter nodemailer xlsx jspdf jspdf-autotable zustand @tanstack/react-query socket.io socket.io-client framer-motion next-themes zod react-hook-form @hookform/resolvers`
- [ ] T004 [P] Instalar shadcn/ui y configurar con estilo New York: `bunx shadcn@latest init` → seleccionar New York, slate, CSS variables
- [ ] T005 [P] Instalar componentes shadcn/ui necesarios: table, button, input, form, dialog, badge, card, select, dropdown-menu, sheet, toast, avatar, separator
- [ ] T006 [P] Instalar dependencias de desarrollo: `bun add -d @types/nodemailer @types/node playwright`
- [ ] T007 Configurar Prisma con SQLite: `bunx prisma init --datasource-provider sqlite`; ajustar `DATABASE_URL` en `.env` a `file:../db/dji-alertas.db`
- [ ] T008 [P] Crear `.env.example` con todas las variables requeridas documentadas (ver `contracts/api-auth.md`); agregar `.env` y `db/` a `.gitignore`
- [ ] T009 [P] Configurar Tailwind CSS 4 en `tailwind.config.ts` y `app/globals.css` con variables de tema shadcn/ui
- [ ] T010 [P] Crear `Caddyfile` con configuración de reverse proxy HTTPS hacia `localhost:3000`
- [ ] T011 Crear estructura de directorios vacía según `plan.md`: `src/app/(auth)/login/`, `src/app/(dashboard)/`, `src/app/api/`, `src/components/`, `src/lib/`, `scripts/`

---

## Phase 2: Foundational (Prerrequisitos bloqueantes)

**Purpose**: Infraestructura core que DEBE completarse antes de cualquier user story

⚠️ **CRÍTICO**: Ninguna user story puede comenzar hasta completar esta fase

- [ ] T012 Implementar schema Prisma completo en `prisma/schema.prisma` con todos los modelos: User, Account, Session, VerificationToken, UnidadOrganica, SujetoObligado, ObligacionDJI, Alerta, AuditLog y todos los enums (Rol, EstadoSujeto, TipoObligacion, EstadoObligacion, TipoAlerta, CanalAlerta, EstadoEnvio, TipoEvento) según `data-model.md`
- [ ] T013 Ejecutar migración inicial: `bunx prisma migrate dev --name init`; crear directorio `db/` con `.gitkeep`
- [ ] T014 Crear cliente Prisma singleton en `src/lib/prisma.ts` (patrón global para evitar conexiones múltiples en dev)
- [ ] T015 [P] Implementar definición de roles y permisos en `src/lib/roles.ts`: constantes ROLES, función `tienePermiso(rol, accion)`, mapa de acciones por rol
- [ ] T016 Configurar NextAuth.js v4 en `src/lib/auth.ts`: PrismaAdapter, proveedor Azure AD + Google OAuth2 + Email magic link, callback `session` que inyecta `rol` en el JWT desde BD
- [ ] T017 Crear API Route de NextAuth en `src/app/api/auth/[...nextauth]/route.ts` exportando handlers GET y POST
- [ ] T018 Implementar `src/middleware.ts`: proteger todas las rutas `/(dashboard)/*` con sesión activa; redirigir a `/login` si no hay sesión
- [ ] T019 [P] Crear helper `src/lib/api-auth.ts` con función `requireRole(request, roles[])` que verifica sesión y rol en API Routes; retorna 401 sin sesión, 403 con rol insuficiente; registra `ACCESO_DENEGADO` en AuditLog
- [ ] T020 [P] Crear helper `src/lib/audit.ts` con función `registrarEvento(tipo, userId?, entidad, entidadId?, detalle, obligacionId?)` que hace INSERT en AuditLog (never update/delete)
- [ ] T021 Crear schemas Zod en `src/lib/validaciones/schemas.ts`: SujetoSchema, ObligacionSchema, ImportarSchema, RegistrarPresentacionSchema, ExportarSchema, con mensajes de error en español
- [ ] T022 [P] Crear página de login en `src/app/(auth)/login/page.tsx` con botones de acceso institucional (OAuth) y formulario magic link; tema claro/oscuro
- [ ] T023 Crear `src/app/(dashboard)/layout.tsx`: sidebar con navegación según rol (items visibles según permisos), header con usuario activo y botón logout, soporte tema claro/oscuro con `next-themes`
- [ ] T024 [P] Crear seed de datos sintéticos en `prisma/seed.ts`: 3 usuarios (ADMIN, OPERADOR, ALTA_DIRECCION), 2 unidades orgánicas, 5 sujetos obligados con distintos estados de vencimiento según `quickstart.md`; ejecutar con `bunx prisma db seed`

**Checkpoint**: Fundación lista — `bun dev` levanta, login funciona, rutas protegidas, BD migrada con seed

---

## Phase 3: User Story 1 — Sujeto obligado recibe alertas preventivas (P1) 🎯 MVP

**Goal**: Motor de alertas diario envía correos en hitos 30/15/5 días y detecta incumplimientos

**Independent Test**: Ejecutar `POST /api/cron/procesar-alertas` con seed activo → verificar alerta PREVENTIVA_30 enviada a Juan Pérez (vencimiento hoy+30d) registrada en BD con estadoEnvio ENVIADO

- [ ] T025 [P] [US1] Implementar servicio de correo en `src/lib/alertas/correo.ts`: clase `CorreoService` con método `enviar({destinatarios, asunto, cuerpo})` usando Nodemailer + SMTP desde variables de entorno; manejo de error con log
- [ ] T026 [P] [US1] Crear plantillas HTML de correo en `src/lib/alertas/plantillas.ts`: funciones `plantillaAlertaPreventiva(sujeto, alerta, diasRestantes)` y `plantillaIncumplimiento(sujeto, obligacion)` con diseño institucional responsive
- [ ] T027 [US1] Implementar motor de alertas core en `src/lib/alertas/motor.ts`:
  - Función `procesarAlertasDiarias()`: consulta ObligacionDJI con estado PENDIENTE
  - Para cada obligación: calcular días hasta vencimiento, determinar qué alerta corresponde (30/15/5/-1)
  - Crear registro en tabla Alerta, invocar CorreoService, actualizar estadoEnvio
  - Marcar como OMISO las obligaciones vencidas el día anterior
  - Registrar evento CRON_EJECUTADO en AuditLog con resumen
- [ ] T028 [US1] Crear API Route protegida por CRON_SECRET en `src/app/api/cron/procesar-alertas/route.ts`: verificar header `Authorization: Bearer {CRON_SECRET}`, invocar `procesarAlertasDiarias()`, retornar resumen JSON según contrato `contracts/api-alertas.md`
- [ ] T029 [US1] Crear script cron en `scripts/cron-alertas.sh`: invoca el endpoint con curl y CRON_SECRET desde variable de entorno; instrucciones de configuración en comentarios (`0 6 * * * /ruta/scripts/cron-alertas.sh`)

**Checkpoint**: US1 completa — cron ejecutable, alertas enviadas, incumplimientos detectados, todo en AuditLog

---

## Phase 4: User Story 2 — Administrador gestiona registro de sujetos obligados (P1)

**Goal**: CRUD completo de sujetos obligados con importación masiva CSV/Excel

**Independent Test**: Crear sujeto, actualizar cargo, importar CSV con 10 válidos + 2 errores, dar de baja → verificar cada operación en BD y AuditLog

- [ ] T030 [P] [US2] Implementar `GET /api/sujetos/route.ts` y `POST /api/sujetos/route.ts`: listado paginado con filtros (estado, unidadId, search) y creación individual; validar body con SujetoSchema Zod; registrar SUJETO_CREADO en AuditLog; rol requerido GET=OPERADOR+, POST=ADMIN
- [ ] T031 [P] [US2] Implementar `GET/PUT/DELETE /api/sujetos/[id]/route.ts`: detalle con obligaciones incluidas, actualización parcial con SUJETO_ACTUALIZADO en AuditLog, desactivación soft con SUJETO_DESACTIVADO; todos requieren ADMIN excepto GET=OPERADOR+
- [ ] T032 [US2] Implementar `POST /api/sujetos/importar/route.ts`: parsear multipart/form-data, leer xlsx/csv con SheetJS, validar cada fila con SujetoSchema, detectar duplicados por DNI, hacer upsert en batch, registrar SUJETO_IMPORTADO por cada importado exitoso; retornar resumen según contrato
- [ ] T033 [P] [US2] Crear API Route para UnidadOrganica: `GET /api/unidades/route.ts` y `POST/PUT/DELETE /api/unidades/[id]/route.ts` para gestión del catálogo de unidades orgánicas
- [ ] T034 [P] [US2] Crear componente `src/components/sujetos/SujetosTable.tsx`: tabla shadcn/ui con columnas DNI, nombre, cargo, unidad, estado, obligaciones activas; paginación, búsqueda, filtro por estado y unidad; acciones inline (editar, desactivar) visibles solo para ADMIN
- [ ] T035 [P] [US2] Crear componente `src/components/sujetos/SujetoForm.tsx`: formulario react-hook-form + zod con todos los campos requeridos; modo crear y editar; selector de unidad orgánica con autocomplete
- [ ] T036 [P] [US2] Crear componente `src/components/sujetos/ImportarModal.tsx`: dialog shadcn/ui con drag & drop de archivo xlsx/csv, preview de columnas detectadas, botón importar, resultado con tabla de errores
- [ ] T037 [US2] Crear página `src/app/(dashboard)/sujetos/page.tsx`: integra SujetosTable con TanStack Query para fetch/cache; botones "Nuevo sujeto" e "Importar" con acceso condicional por rol
- [ ] T038 [US2] Crear página `src/app/(dashboard)/sujetos/[id]/page.tsx`: ficha detalle del sujeto con historial de obligaciones y alertas recibidas; formulario de edición inline para ADMIN
- [ ] T039 [US2] Implementar `POST /api/obligaciones/route.ts`: crear obligación DJI para un sujeto; validar unicidad [sujetoId, tipo, periodo]; registrar en AuditLog; requiere ADMIN

**Checkpoint**: US2 completa — CRUD sujetos funcional, importación masiva operativa, obligaciones creables

---

## Phase 5: User Story 3 — Alerta de incumplimiento y regularización (P2)

**Goal**: Post-vencimiento: alerta a sujeto + jefe + responsable; registro de regularización extemporánea

**Independent Test**: Con Ana Torres (vencimiento=ayer en seed), ejecutar cron → verificar alerta INCUMPLIMIENTO a 3 destinatarios; luego registrar presentación extemporánea → estado = PRESENTADO_CON_RETRASO

- [ ] T040 [US3] Implementar `POST /api/obligaciones/[id]/registrar-presentacion/route.ts`: validar body con RegistrarPresentacionSchema; calcular si es en plazo o con retraso comparando fechaPresentacion vs fechaVencimiento; actualizar estado; detener ciclo de alertas; registrar PRESENTACION_REGISTRADA o REGULARIZACION_REGISTRADA en AuditLog; requiere ADMIN
- [ ] T041 [US3] Extender `motor.ts` (T027) para incumplimiento: al detectar obligación vencida el día anterior, enviar correo a 3 destinatarios (sujeto + jefeCorreo + EMAIL_INTEGRIDAD_RESPONSABLE desde env); crear 3 registros Alerta (uno por destinatario) o un registro con array destinatarios según contrato
- [ ] T042 [P] [US3] Agregar variable de entorno `EMAIL_RESPONSABLE_INTEGRIDAD` en `.env.example` para el correo del responsable de la Oficina de Integridad que recibe todas las alertas de incumplimiento
- [ ] T043 [P] [US3] Crear componente `src/components/sujetos/RegistrarPresentacionForm.tsx`: formulario con campo fecha de presentación y observaciones; muestra advertencia si la fecha es posterior al vencimiento (regularización); accesible desde ficha del sujeto
- [ ] T044 [US3] Integrar RegistrarPresentacionForm en `src/app/(dashboard)/sujetos/[id]/page.tsx`: botón "Registrar presentación" visible solo en obligaciones con estado PENDIENTE u OMISO; actualizar cache TanStack Query tras éxito

**Checkpoint**: US3 completa — ciclo completo funciona: alertas preventivas → incumplimiento → regularización

---

## Phase 6: User Story 4 — Jefe inmediato recibe reporte semanal (P2)

**Goal**: Envío automático semanal de resumen de cumplimiento a cada jefe inmediato

**Independent Test**: Ejecutar endpoint de reporte semanal → verificar que María López (jefeCorreo en seed) recibe correo con tabla de sus 2 servidores y sus estados actualizados

- [ ] T045 [P] [US4] Implementar `GET /api/reportes/semanal/route.ts`: agrupar sujetos obligados por jefeCorreo, para cada jefe construir payload según contrato `contracts/api-reportes.md`; requiere ADMIN
- [ ] T046 [US4] Implementar función `enviarReportesSemanal()` en `src/lib/alertas/motor.ts`: iterar jefes únicos con sujetos activos, obtener estado de cada obligación, generar correo HTML con tabla resumen usando plantilla, enviar vía CorreoService; registrar evento en AuditLog
- [ ] T047 [P] [US4] Crear plantilla HTML de reporte semanal en `src/lib/alertas/plantillas.ts`: función `plantillaReporteSemanal(jefe, servidores[])` con tabla de colores por estado (verde=presentado, amarillo=pendiente, rojo=omiso)
- [ ] T048 [US4] Extender `src/app/api/cron/procesar-alertas/route.ts` para invocar `enviarReportesSemanal()` solo los lunes (verificar día de la semana en la ejecución del cron)

**Checkpoint**: US4 completa — jefes inmediatos reciben reporte semanal automático cada lunes

---

## Phase 7: User Story 5 — Tablero de control institucional (P3)

**Goal**: Dashboard con indicadores en tiempo real por unidad/órgano + exportación de reportes

**Independent Test**: Con seed completo, acceder al tablero → verificar porcentajes correctos; filtrar por unidad → métricas actualizadas; exportar PDF → archivo descargable > 0 bytes

- [ ] T049 [P] [US5] Implementar `GET /api/reportes/tablero/route.ts`: calcular resumen global y por unidad orgánica para el periodo; optimizar con índices Prisma; requiere ADMIN, OPERADOR o ALTA_DIRECCION según contrato
- [ ] T050 [P] [US5] Implementar `POST /api/reportes/exportar/route.ts`: según formato (xlsx/pdf) y tipo (cumplimiento/omisos/alertas), generar archivo con SheetJS o jsPDF+autotable; stream response con headers Content-Disposition correctos
- [ ] T051 [P] [US5] Crear `src/lib/reportes/xlsx.ts`: función `generarReporteXLSX(datos, tipo)` con SheetJS; hoja de resumen + hoja detalle por sujeto; estilos básicos (encabezados en negrita, colores por estado)
- [ ] T052 [P] [US5] Crear `src/lib/reportes/pdf.ts`: función `generarReportePDF(datos, tipo)` con jsPDF+autotable; encabezado institucional, tabla de datos, pie con fecha de generación y número de página
- [ ] T053 [US5] Crear componente `src/components/tablero/IndicadoresPanel.tsx`: cards shadcn/ui con los 4 indicadores principales (% cumplimiento, omisos, alertas emitidas, tiempo promedio regularización); animación con Framer Motion al cargar
- [ ] T054 [P] [US5] Crear componente `src/components/tablero/CumplimientoChart.tsx`: gráfico de barras por unidad orgánica con datos de porcentaje de cumplimiento (usando Recharts o librería compatible con shadcn/ui)
- [ ] T055 [P] [US5] Crear componente `src/components/tablero/AlertasRecientes.tsx`: tabla de últimas 10 alertas emitidas con tipo, sujeto, fecha y estado de envío
- [ ] T056 [P] [US5] Crear componente `src/components/shared/ExportButton.tsx`: botón con dropdown (XLSX/PDF), llama a POST /api/reportes/exportar, descarga el archivo via blob URL
- [ ] T057 [US5] Crear página `src/app/(dashboard)/page.tsx` (tablero principal): integra IndicadoresPanel + CumplimientoChart + AlertasRecientes con TanStack Query; filtros por periodo, unidad y órgano; ExportButton visible para ADMIN y ALTA_DIRECCION
- [ ] T058 [US5] Configurar Socket.io server en `src/app/api/socketio/route.ts` y cliente en `src/lib/socket-client.ts`; emitir evento `estado-actualizado` desde motor.ts y desde registrar-presentacion al cambiar estado; tablero invalida cache TanStack Query al recibir evento
- [ ] T059 [US5] Crear página `src/app/(dashboard)/reportes/page.tsx`: formulario de exportación con filtros (periodo, unidad, tipo, formato); historial de exportaciones recientes (solo para ADMIN)

**Checkpoint**: US5 completa — tablero muestra indicadores correctos, Socket.io actualiza en tiempo real, exportación genera archivos válidos

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Hardening de seguridad, UX final, documentación operativa

- [ ] T060 [P] Agregar headers de seguridad HTTP en `next.config.ts`: Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- [ ] T061 [P] Implementar rate limiting en API Routes críticas (`/api/cron/*`, `/api/auth/*`): middleware con conteo en memoria (o Upstash Redis si disponible) para prevenir abuso
- [ ] T062 [P] Crear página `src/app/(dashboard)/alertas/page.tsx`: historial completo de alertas con filtros avanzados (tipo, estado envío, rango de fechas, sujeto); paginación; accesible para ADMIN y OPERADOR
- [ ] T063 [P] Crear página `src/app/(dashboard)/admin/page.tsx`: configuración del sistema para ADMIN — gestión de usuarios del sistema (asignar/cambiar roles), unidades orgánicas, configuración SMTP (test de envío), estado del cron
- [ ] T064 [P] Implementar componente `src/components/shared/RolGuard.tsx`: wrapper que oculta/muestra children según el rol del usuario en sesión; usar en todos los componentes con acceso condicional
- [ ] T065 [P] Asegurar que todas las páginas del dashboard respetan el tema claro/oscuro con `next-themes`; verificar contraste accesible en ambos temas
- [ ] T066 [P] Agregar feedback de carga y estados vacíos en todas las páginas: skeleton loaders con shadcn/ui Skeleton, empty states descriptivos cuando no hay datos
- [ ] T067 [P] Crear `prisma/seed.ts` final con datos sintéticos completos según `quickstart.md`: 3 usuarios, 2 unidades, 5 sujetos con vencimientos distribuidos (hoy+30, hoy+15, hoy+5, ayer, inactivo)
- [ ] T068 Ejecutar validación end-to-end de los 6 escenarios de `quickstart.md` y confirmar que todos pasan; documentar cualquier ajuste necesario
- [ ] T069 [P] Crear `README.md` operativo: requisitos del sistema, configuración inicial paso a paso, configuración del cron job, actualización del sistema, respaldo de la BD SQLite

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sin dependencias — puede comenzar de inmediato
- **Foundational (Phase 2)**: Depende de Phase 1 completa — BLOQUEA todas las user stories
- **US1 (Phase 3)** y **US2 (Phase 4)**: Pueden comenzar en paralelo tras Phase 2; sin dependencias entre sí
- **US3 (Phase 5)**: Depende de US1 (motor.ts) y US2 (endpoint registrar-presentacion); requiere T027 y T030
- **US4 (Phase 6)**: Depende de US1 (motor.ts y CorreoService); requiere T025, T027
- **US5 (Phase 7)**: Independiente de US3/US4; puede comenzar tras Phase 2
- **Polish (Phase 8)**: Depende de todas las user stories completadas

### User Story Dependencies

- **US1 (P1)**: Solo depende de Foundational ✅
- **US2 (P1)**: Solo depende de Foundational ✅
- **US3 (P2)**: Depende de US1 (T027) y US2 (T030, T031)
- **US4 (P2)**: Depende de US1 (T025, T027)
- **US5 (P3)**: Solo depende de Foundational ✅ (independiente de otras stories)

### Within Each User Story

- Servicios/lib antes de API Routes
- API Routes antes de componentes UI
- Componentes antes de páginas
- Commit tras cada tarea completada

### Parallel Opportunities

- T003, T004, T005, T006, T008, T009, T010 — instalaciones de dependencias en paralelo
- T015, T019, T020, T021, T022, T024 — infraestructura foundational en paralelo
- T025, T026 en paralelo (servicio correo + plantillas)
- T030, T031, T033, T034, T035, T036 en paralelo (CRUD endpoints + componentes US2)
- T049, T050, T051, T052, T053, T054, T055, T056 en paralelo (tablero + reportes)
- T060–T067 todos en paralelo (polish)

---

## Implementation Strategy

### MVP First (US1 + US2 únicamente — Phases 1-4)

1. Completar Phase 1: Setup
2. Completar Phase 2: Foundational (CRÍTICO)
3. Completar Phase 3: US1 — Motor de alertas ← **primer entregable de valor**
4. Completar Phase 4: US2 — Registro de sujetos ← **sistema usable end-to-end**
5. **VALIDAR**: Ejecutar escenarios 1, 2, 3 del quickstart.md
6. Demo/entrega parcial si el administrador puede gestionar sujetos y las alertas se envían

### Incremental Delivery

1. Setup + Foundational → sistema arranca, login funciona
2. + US1 → alertas se envían automáticamente (valor inmediato)
3. + US2 → administrador gestiona el registro sin depender de imports manuales
4. + US3 → ciclo completo: incumplimiento detectado y regularizable
5. + US4 → jefes inmediatos involucrados en el seguimiento
6. + US5 → Alta Dirección con visibilidad y evidencia exportable

---

## Notes

- `[P]` = tarea paralelizable (archivos distintos, sin dependencias incompletas)
- `[US#]` = user story a la que pertenece la tarea
- Datos MUST ser sintéticos en desarrollo — nunca usar DNIs o correos reales (OWASP LLM06)
- Todas las API Routes MUST verificar rol antes de procesar (usar `requireRole()` de T019)
- AuditLog MUST registrarse en toda operación de escritura (usar `registrarEvento()` de T020)
- Commit tras cada tarea o grupo lógico completado
- No avanzar a la siguiente fase hasta que el checkpoint de la actual pase
