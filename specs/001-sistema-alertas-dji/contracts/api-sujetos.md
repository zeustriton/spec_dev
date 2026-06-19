# API Contract: Sujetos Obligados

**Base path**: `/api/sujetos`
**Auth**: Sesión NextAuth requerida en todos los endpoints
**Roles**: ADMIN = acceso completo; OPERADOR/ALTA_DIRECCION = solo GET

---

## GET /api/sujetos

Lista sujetos obligados con filtros opcionales.

**Roles permitidos**: ADMIN, OPERADOR, ALTA_DIRECCION

**Query params**:
```
estado?        "ACTIVO" | "INACTIVO"             default: "ACTIVO"
unidadId?      string (cuid)
search?        string (busca en nombres, apellidos, DNI, cargo)
page?          number                             default: 1
limit?         number                             default: 50
```

**Response 200**:
```json
{
  "data": [
    {
      "id": "cuid",
      "dni": "12345678",
      "nombres": "Juan",
      "apellidos": "Pérez García",
      "cargo": "Jefe de Oficina",
      "nivelJerarquico": "Directivo",
      "correo": "jperez@entidad.gob.pe",
      "estado": "ACTIVO",
      "unidadOrganica": { "id": "cuid", "nombre": "Oficina de RR.HH.", "organo": "Secretaría General" },
      "obligacionesActivas": 2
    }
  ],
  "total": 120,
  "page": 1,
  "limit": 50
}
```

---

## POST /api/sujetos

Crea un nuevo sujeto obligado.

**Roles permitidos**: ADMIN

**Request body**:
```json
{
  "dni": "12345678",
  "nombres": "Juan",
  "apellidos": "Pérez García",
  "cargo": "Jefe de Oficina",
  "nivelJerarquico": "Directivo",
  "correo": "jperez@entidad.gob.pe",
  "jefeCorreo": "director@entidad.gob.pe",
  "jefeNombre": "María López",
  "jefeDni": "87654321",
  "unidadOrganicaId": "cuid"
}
```

**Response 201**: Sujeto creado completo.

**Response 409**: `{ "error": "DNI ya registrado en el sistema" }`

---

## GET /api/sujetos/[id]

**Roles permitidos**: ADMIN, OPERADOR

**Response 200**: Sujeto completo con array `obligaciones[]`.

---

## PUT /api/sujetos/[id]

Actualiza datos del sujeto. Genera `SUJETO_ACTUALIZADO` en AuditLog.

**Roles permitidos**: ADMIN

**Request body**: Campos a actualizar (parcial, todos opcionales).

**Response 200**: Sujeto actualizado.

---

## DELETE /api/sujetos/[id]

Desactiva el sujeto (soft delete: `estado = INACTIVO`, `fechaBaja = now()`).
Genera `SUJETO_DESACTIVADO` en AuditLog.

**Roles permitidos**: ADMIN

**Response 200**: `{ "message": "Sujeto desactivado correctamente" }`

---

## POST /api/sujetos/importar

Importación masiva desde archivo Excel/CSV.

**Roles permitidos**: ADMIN

**Request**: `multipart/form-data` con campo `archivo` (`.xlsx` o `.csv`)

**Columnas esperadas en el archivo**:
```
DNI | Nombres | Apellidos | Cargo | Nivel Jerárquico | Correo | Unidad Orgánica | Órgano | Correo Jefe | Nombre Jefe | DNI Jefe
```

**Response 200**:
```json
{
  "importados": 45,
  "omitidos": 3,
  "errores": [
    { "fila": 5, "motivo": "DNI ya registrado: 12345678" },
    { "fila": 12, "motivo": "Correo inválido: notanemail" }
  ]
}
```
