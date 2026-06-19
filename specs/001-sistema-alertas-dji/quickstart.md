# Quickstart: Validación end-to-end — Sistema de Alertas DJI

**Propósito**: Guía para validar que el sistema funciona correctamente en un entorno de desarrollo con datos sintéticos.

**Prerequisitos**:
- Bun instalado (`bun --version` ≥ 1.0)
- Variables de entorno configuradas desde `.env.example` → `.env`
- Base de datos inicializada: `bun prisma migrate dev`
- Datos sintéticos cargados: `bun prisma db seed`

---

## Escenario 1: Motor de alertas — alerta preventiva de 30 días

**Objetivo**: Verificar que el cron job detecta obligaciones con vencimiento en 30 días y envía la Alerta 1.

**Setup** (incluido en seed):
- Sujeto: Juan Pérez (DNI: 00000001), correo: juan@test.local
- Obligación ANUAL 2026 con `fechaVencimiento = hoy + 30 días`

**Ejecutar**:
```bash
curl -X POST http://localhost:3000/api/cron/procesar-alertas \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

**Resultado esperado**:
```json
{ "alertasEnviadas": 1, "incumplimientosDetectados": 0, "errores": 0 }
```

**Verificar**:
```bash
# Confirmar alerta registrada en BD
curl http://localhost:3000/api/alertas?sujetoId=SEED_ID_JUAN
# Debe mostrar una Alerta tipo PREVENTIVA_30 con estadoEnvio: "ENVIADO"
```

---

## Escenario 2: Registro manual de presentación — detiene alertas

**Objetivo**: Verificar que al registrar la presentación, el sujeto deja de recibir alertas posteriores.

**Setup**: Usar la obligación del Escenario 1 (ya con Alerta 1 enviada).

**Ejecutar**:
```bash
curl -X POST http://localhost:3000/api/obligaciones/${OBLIGACION_ID}/registrar-presentacion \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=${SESSION_TOKEN}" \
  -d '{ "fechaPresentacion": "2026-01-15T10:00:00Z" }'
```

**Resultado esperado**:
```json
{ "estado": "PRESENTADO_EN_PLAZO", "fechaPresentacion": "2026-01-15T10:00:00Z" }
```

**Verificar**: Volver a ejecutar el cron. La obligación con estado `PRESENTADO_EN_PLAZO`
no debe generar nuevas alertas. Confirmar en la respuesta del cron: `alertasEnviadas: 0`.

---

## Escenario 3: Importación masiva de sujetos

**Objetivo**: Verificar que el sistema importa un CSV válido y rechaza filas con errores.

**Archivo de prueba**: `prisma/seeds/sujetos-prueba.csv` (incluido en el repo de desarrollo)

```bash
curl -X POST http://localhost:3000/api/sujetos/importar \
  -H "Cookie: next-auth.session-token=${SESSION_TOKEN}" \
  -F "archivo=@prisma/seeds/sujetos-prueba.csv"
```

**Resultado esperado** (el CSV de prueba tiene 10 filas válidas y 2 con errores):
```json
{ "importados": 10, "omitidos": 2, "errores": [ ... ] }
```

---

## Escenario 4: Tablero de control — indicadores correctos

**Objetivo**: Verificar que el tablero refleja los estados actualizados tras los escenarios anteriores.

```bash
curl http://localhost:3000/api/reportes/tablero?periodo=2026 \
  -H "Cookie: next-auth.session-token=${SESSION_TOKEN}"
```

**Resultado esperado**:
- `presentadosEnPlazo` ≥ 1 (Juan Pérez del Escenario 2)
- `alertasEmitidas` ≥ 1
- `porcentajeCumplimiento` > 0

---

## Escenario 5: Control de acceso por roles

**Objetivo**: Verificar que un usuario OPERADOR no puede registrar presentaciones.

```bash
# Sesión con usuario OPERADOR (ver seed: operador@test.local)
curl -X POST http://localhost:3000/api/obligaciones/${OBLIGACION_ID}/registrar-presentacion \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=${SESSION_OPERADOR_TOKEN}" \
  -d '{ "fechaPresentacion": "2026-01-15T10:00:00Z" }'
```

**Resultado esperado**: HTTP 403 `{ "error": "Acceso denegado: rol insuficiente" }`

---

## Escenario 6: Exportación de reporte PDF

**Objetivo**: Verificar generación de reporte descargable.

```bash
curl -X POST http://localhost:3000/api/reportes/exportar \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=${SESSION_TOKEN}" \
  -d '{ "formato": "pdf", "tipo": "cumplimiento", "periodo": "2026" }' \
  --output reporte-test.pdf
```

**Resultado esperado**: Archivo `reporte-test.pdf` descargado, tamaño > 0 bytes,
abre correctamente en visor de PDF.

---

## Datos sintéticos incluidos en seed

| Usuario | Correo | Rol |
|---------|--------|-----|
| Admin | admin@test.local | ADMIN |
| Operador | operador@test.local | OPERADOR |
| Alta Dirección | direccion@test.local | ALTA_DIRECCION |

| Sujeto | DNI | Estado | Vencimiento |
|--------|-----|--------|-------------|
| Juan Pérez | 00000001 | ACTIVO | hoy + 30 días |
| María López | 00000002 | ACTIVO | hoy + 15 días |
| Carlos Ruiz | 00000003 | ACTIVO | hoy + 5 días |
| Ana Torres | 00000004 | ACTIVO | ayer (vencido) |
| Luis Gómez | 00000005 | INACTIVO | — |

> **IMPORTANTE**: Todos los datos del seed son sintéticos. MUST NOT usarse datos
> reales de servidores públicos en entornos de desarrollo o prueba (OWASP AI LLM06).
