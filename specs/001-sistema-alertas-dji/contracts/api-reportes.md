# API Contract: Reportes y Tablero

---

## GET /api/reportes/tablero

Indicadores agregados para el tablero de control.

**Roles permitidos**: ADMIN, OPERADOR, ALTA_DIRECCION

**Query params**:
```
periodo?       string (ej: "2026")         default: año en curso
unidadId?      string (cuid)               filtra por unidad orgánica
organo?        string                      filtra por órgano
```

**Response 200**:
```json
{
  "periodo": "2026",
  "resumen": {
    "totalSujetos": 120,
    "presentadosEnPlazo": 85,
    "presentadosConRetraso": 8,
    "omisos": 5,
    "pendientes": 22,
    "porcentajeCumplimiento": 77.5,
    "alertasEmitidas": 340,
    "tiempoPromedioRegularizacionDias": 4.2
  },
  "porUnidad": [
    {
      "unidadId": "cuid",
      "unidadNombre": "Oficina de RR.HH.",
      "organo": "Secretaría General",
      "total": 15,
      "presentados": 12,
      "pendientes": 2,
      "omisos": 1,
      "porcentaje": 80.0
    }
  ],
  "actualizadoEn": "2026-06-19T08:45:00Z"
}
```

---

## GET /api/reportes/semanal

Reporte semanal de cumplimiento para un jefe inmediato específico.
Usado por el motor de alertas para enviar el correo semanal automático.

**Roles permitidos**: ADMIN

**Query params**:
```
jefeCorreo     string (requerido)   correo del jefe inmediato
semana?        ISO date (lunes)     default: semana actual
```

**Response 200**:
```json
{
  "jefe": { "nombre": "María López", "correo": "mlopez@entidad.gob.pe" },
  "semana": "2026-06-16",
  "servidores": [
    {
      "dni": "12345678",
      "nombres": "Juan Pérez García",
      "cargo": "Jefe de Oficina",
      "obligaciones": [
        {
          "tipo": "ANUAL",
          "periodo": "2026",
          "fechaVencimiento": "2026-03-31",
          "estado": "PRESENTADO_EN_PLAZO"
        }
      ]
    }
  ]
}
```

---

## POST /api/reportes/exportar

Genera y devuelve un archivo de reporte descargable.

**Roles permitidos**: ADMIN, ALTA_DIRECCION

**Request body**:
```json
{
  "formato": "xlsx" | "pdf",
  "tipo": "cumplimiento" | "omisos" | "alertas",
  "periodo": "2026",
  "unidadId": "cuid",     // opcional
  "organo": "string"      // opcional
}
```

**Response 200**:
- `Content-Type`: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (xlsx)
  o `application/pdf` (pdf)
- `Content-Disposition`: `attachment; filename="reporte-cumplimiento-2026.xlsx"`
- Body: archivo binario

**Response 400**: `{ "error": "Formato no soportado" }`
