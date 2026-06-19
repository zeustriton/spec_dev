# API Contract: Alertas y Obligaciones DJI

---

## POST /api/obligaciones

Crea una nueva obligación DJI para un sujeto.

**Roles permitidos**: ADMIN

**Request body**:
```json
{
  "sujetoId": "cuid",
  "tipo": "INICIO_CARGO" | "ANUAL" | "CESE_CARGO",
  "periodo": "2026",
  "fechaVencimiento": "2026-03-31T23:59:59Z",
  "observaciones": "Texto opcional"
}
```

**Response 201**: ObligacionDJI creada.

**Response 409**: `{ "error": "Ya existe una obligación del tipo ANUAL para el periodo 2026" }`

---

## POST /api/obligaciones/[id]/registrar-presentacion

Registra manualmente que el sujeto presentó su DJI. Detiene el ciclo de alertas.
Genera `PRESENTACION_REGISTRADA` o `REGULARIZACION_REGISTRADA` en AuditLog según
si la fecha es anterior o posterior al vencimiento.

**Roles permitidos**: ADMIN

**Request body**:
```json
{
  "fechaPresentacion": "2026-03-28T10:30:00Z",
  "observaciones": "Presentado vía plataforma SERVIR"
}
```

**Response 200**:
```json
{
  "id": "cuid",
  "estado": "PRESENTADO_EN_PLAZO",
  "fechaPresentacion": "2026-03-28T10:30:00Z"
}
```

---

## GET /api/alertas

Historial de alertas emitidas con filtros.

**Roles permitidos**: ADMIN, OPERADOR

**Query params**:
```
sujetoId?      string (cuid)
tipo?          "PREVENTIVA_30" | "PREVENTIVA_15" | "PREVENTIVA_5" | "INCUMPLIMIENTO"
estadoEnvio?   "PENDIENTE" | "ENVIADO" | "ERROR"
desde?         ISO date string
hasta?         ISO date string
page?          number    default: 1
limit?         number    default: 50
```

**Response 200**:
```json
{
  "data": [
    {
      "id": "cuid",
      "tipo": "PREVENTIVA_30",
      "canal": "CORREO",
      "destinatarios": ["jperez@entidad.gob.pe"],
      "estadoEnvio": "ENVIADO",
      "enviadoEn": "2026-01-01T06:02:15Z",
      "obligacion": {
        "id": "cuid",
        "tipo": "ANUAL",
        "periodo": "2026",
        "fechaVencimiento": "2026-03-31T23:59:59Z",
        "sujeto": { "dni": "12345678", "nombres": "Juan", "apellidos": "Pérez García" }
      }
    }
  ],
  "total": 340,
  "page": 1,
  "limit": 50
}
```

---

## POST /api/cron/procesar-alertas

Endpoint protegido invocado por el cron job diario. Ejecuta el motor de alertas
completo: verifica hitos de 30/15/5 días y detecta incumplimientos del día anterior.

**Auth**: Header `Authorization: Bearer {CRON_SECRET}` (variable de entorno, no sesión)

**Roles**: N/A (autenticación por token secreto, no por rol de usuario)

**Response 200**:
```json
{
  "ejecutadoEn": "2026-03-01T06:00:05Z",
  "alertasEnviadas": 12,
  "incumplimientosDetectados": 2,
  "errores": 0,
  "duracionMs": 1840
}
```

**Response 401**: Si el token CRON_SECRET no coincide.
