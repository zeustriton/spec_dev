# Research: Sistema de Alertas DJI

**Feature**: 001-sistema-alertas-dji
**Date**: 2026-06-19

---

## Decisión 1: Motor de alertas — enfoque de ejecución

**Decision**: Cron job externo que invoca endpoint protegido `/api/cron/procesar-alertas`
una vez por día (ej. 06:00 hora local).

**Rationale**: Next.js no tiene scheduler nativo. Un cron job del sistema operativo
(crontab en Linux) invoca el endpoint con un token secreto; es simple, auditable y
no requiere dependencias adicionales. En entornos sin acceso a crontab se puede usar
un servicio externo gratuito (cron-job.org) o un workflow de GitHub Actions.

**Alternatives considered**:
- Bull/BullMQ (Redis-backed queue): descartado, requiere Redis adicional y rompe
  el principio de bajo costo/simplicidad.
- Vercel Cron Jobs: descartado, el despliegue es on-premise en servidor de la entidad.
- setTimeout en proceso Node: descartado, no sobrevive reinicios del servidor.

---

## Decisión 2: Envío de correos institucionales

**Decision**: Nodemailer con transporte SMTP apuntando al servidor de correo
institucional de la entidad (Outlook/Exchange o Google Workspace SMTP).

**Rationale**: La entidad ya tiene servidor de correo; usar SMTP directo evita
dependencias de servicios externos (SendGrid, Resend, etc.) y mantiene el correo
dentro del dominio institucional, lo cual es requerido para que los correos no sean
marcados como spam y mantengan la apariencia institucional.

**Alternatives considered**:
- Resend / SendGrid: descartado, costo de licencia y datos salen del dominio
  institucional.
- Microsoft Graph API (para Office 365): viable si la entidad usa M365 con permisos
  de aplicación configurados; se documenta como upgrade path en v2.

---

## Decisión 3: Autenticación con cuenta institucional

**Decision**: NextAuth.js v4 con proveedor Email (magic link) como fallback + proveedor
Azure AD (Microsoft Entra) o Google Workspace OAuth2, según el proveedor de identidad
de la entidad.

**Rationale**: Las entidades públicas peruanas usan mayoritariamente Microsoft 365 o
Google Workspace. NextAuth.js soporta ambos de forma nativa. El administrador configura
el proveedor en variables de entorno sin cambios de código.

**Alternatives considered**:
- Auth.js (v5): aún en beta para Next.js App Router al momento del stack definido;
  NextAuth v4 es estable y soportado.
- Keycloak propio: complejidad operativa excesiva para el alcance del proyecto.

---

## Decisión 4: Tiempo real en tablero de control

**Decision**: Socket.io para emitir eventos desde el servidor cuando cambia el estado
de un sujeto (presentación registrada, alerta enviada). TanStack Query invalida la
caché al recibir el evento.

**Rationale**: El tablero requiere latencia < 5 min (SC-006). Socket.io es parte del
stack mandatorio. Combinar Socket.io (notificación del evento) con TanStack Query
(re-fetch de datos) es el patrón más simple: el socket solo emite un evento vacío
"estado-actualizado" y el cliente re-fetcha los datos frescos.

**Alternatives considered**:
- Server-Sent Events (SSE): más simple pero unidireccional; aceptable si Socket.io
  agrega complejidad innecesaria — se puede simplificar en implementación.
- Polling cada 30 segundos: suficiente para cumplir SC-006 (< 5 min); se adopta
  como fallback si Socket.io presenta problemas de configuración.

---

## Decisión 5: Exportación de reportes

**Decision**: `xlsx` (SheetJS) para Excel y `jsPDF` + `jspdf-autotable` para PDF,
ejecutados en el servidor (API Route) para evitar exponer lógica en el cliente.

**Rationale**: Ambas librerías son open source, ampliamente usadas, y el stack GLM
tiene skill nativo de generación XLSX y PDF. Ejecutar en servidor garantiza que los
datos sensibles no se expongan al cliente antes de ser formateados.

**Alternatives considered**:
- Puppeteer para PDF: más fidelidad visual pero requiere Chromium, aumenta el tamaño
  del despliegue significativamente.
- Google Sheets API / Microsoft Graph: requieren permisos OAuth adicionales y
  dependencia de servicios externos.

---

## Decisión 6: Validación de inputs

**Decision**: Zod para validación de schemas en API Routes y formularios (con
react-hook-form + zodResolver en el cliente).

**Rationale**: TypeScript nativo no valida en runtime. Zod es el estándar de facto
en el ecosistema Next.js/TypeScript, previene A03 (Injection) y garantiza contratos
de datos consistentes entre cliente y servidor.

**Alternatives considered**:
- Yup: alternativa viable, pero Zod tiene mejor integración con TypeScript y es más
  moderno.
- Validación manual: descartado, propenso a errores y difícil de mantener.

---

## Decisión 7: Gestión de roles (RBAC)

**Decision**: Roles almacenados en la sesión NextAuth (JWT) y verificados en
middleware.ts para rutas de página y en cada API Route para endpoints.

**Rationale**: Solución nativa de NextAuth, sin dependencias adicionales. Los roles
(ADMIN, OPERADOR, ALTA_DIRECCION) se asignan en la BD al primer login y se incluyen
en el JWT. El middleware protege rutas completas; cada API Route verifica el rol
específico requerido para la operación.

**Alternatives considered**:
- CASL (librería de permisos): potente pero sobredimensionado para 3 roles simples.
- Middleware de Prisma: agregar lógica de roles en ORM complica el modelo; mejor
  separado en capa de aplicación.
