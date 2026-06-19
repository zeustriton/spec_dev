# API Contract: Autenticación y Sesión

**Proveedor**: NextAuth.js v4
**Estrategia**: OAuth2 con proveedor institucional (Azure AD / Google Workspace) + Email magic link como fallback

---

## GET /api/auth/session

Devuelve la sesión activa del usuario.

**Response 200 (sesión activa)**:
```json
{
  "user": {
    "id": "cuid",
    "name": "Juan Pérez",
    "email": "jperez@entidad.gob.pe",
    "rol": "ADMIN"
  },
  "expires": "2026-07-19T06:00:00Z"
}
```

**Response 200 (sin sesión)**:
```json
null
```

---

## GET /api/auth/signin

Redirige al proveedor de identidad institucional configurado.
Manejado por NextAuth internamente.

---

## POST /api/auth/signout

Cierra la sesión activa. Genera `LOGOUT` en AuditLog.
Manejado por NextAuth internamente.

---

## Roles y permisos

| Rol | Acceso |
|-----|--------|
| `ADMIN` | Acceso completo: gestión de sujetos, registro de presentaciones, configuración, tablero, reportes |
| `OPERADOR` | Solo lectura: tablero de control e historial de alertas; sin acceso a datos individuales sensibles |
| `ALTA_DIRECCION` | Solo exportación de reportes agregados e indicadores; sin acceso a datos individuales |

---

## Variables de entorno requeridas

```env
# .env (NO incluir en repositorio)
DATABASE_URL="file:../db/dji-alertas.db"
NEXTAUTH_URL="https://dji.entidad.gob.pe"
NEXTAUTH_SECRET="secreto-aleatorio-32-caracteres"

# Proveedor OAuth (elegir uno según la entidad):
# Azure AD / Microsoft Entra
AZURE_AD_CLIENT_ID=""
AZURE_AD_CLIENT_SECRET=""
AZURE_AD_TENANT_ID=""

# Google Workspace
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# SMTP para correo institucional y magic links
SMTP_HOST="smtp.entidad.gob.pe"
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
EMAIL_FROM="noreply-integridad@entidad.gob.pe"

# Cron job
CRON_SECRET="secreto-cron-aleatorio-32-caracteres"
```
