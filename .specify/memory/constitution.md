<!--
SYNC IMPACT REPORT
==================
Version change: 1.0.0 → 1.1.0 (MINOR — gobernanza expandida, lenguaje de principios fortalecido a MUST/SHOULD)

Principios modificados:
  - I. Preventivo sobre reactivo: redactado en términos declarativos (MUST)
  - II. Registro dinámico: reforzado con restricción explícita (MUST NOT)
  - III. Alertas escalonadas: sin cambio (ya era NON-NEGOTIABLE)
  - IV. Trazabilidad y evidencia: añadido requisito de inmutabilidad de logs
  - V. Bajo costo y sostenibilidad: añadido listado de herramientas preferentes
  - VI. Simplicidad de implementación: reforzado con criterio de mantenibilidad

Secciones añadidas:
  - Procedimiento de enmienda en Gobernanza
  - Política de versionado
  - Revisión de cumplimiento

Templates verificados:
  ✅ .specify/templates/plan-template.md — Constitution Check genérico, compatible
  ✅ .specify/templates/spec-template.md — estructura de requisitos compatible con principios
  ✅ .specify/templates/tasks-template.md — estructura de fases compatible

TODOs diferidos:
  - NINGUNO
-->

# Sistema de Alertas DJI — Constitución

## Contexto del Producto

Sistema de alertas preventivas y monitoreo de cumplimiento para la presentación oportuna
de la Declaración Jurada de Intereses (DJI) en el marco de la Ley N.° 31227. Dirigido a
la Oficina de Integridad Institucional de una entidad pública peruana.

**Problema central**: El seguimiento de DJI se realiza de forma manual y reactiva,
generando incumplimientos, observaciones de control y debilidad en los mecanismos
de integridad institucional.

**Usuarios principales**:
- Responsable de la Oficina de Integridad Institucional (administrador/operador del sistema)
- Sujetos obligados (servidores públicos que deben presentar DJI)
- Jefes inmediatos (reciben reportes semanales de cumplimiento)
- Alta Dirección (recibe informes periódicos y alertas de riesgo)

## Principios de Diseño

### I. Preventivo sobre reactivo

El sistema MUST emitir todas las alertas antes del vencimiento de la obligación.
Ninguna funcionalidad principal MUST estar orientada a gestionar incumplimientos ya
ocurridos; la acción correctiva es consecuencia, no propósito del sistema.

**Rationale**: Transformar el proceso de reactivo a preventivo es el objetivo central
de la iniciativa. Cualquier feature que solo actúe post-vencimiento contradice este principio.

### II. Registro dinámico

La base de sujetos obligados MUST reflejar cambios de personal (altas, bajas, cambios
de puesto) en un plazo no mayor a 24 horas desde que el cambio ocurre en el sistema
fuente de RRHH.

El sistema MUST NOT depender de actualizaciones manuales periódicas como único mecanismo
de sincronización.

**Rationale**: Un registro desactualizado genera alertas omitidas o dirigidas a personas
incorrectas, invalidando la función preventiva del sistema.

### III. Alertas escalonadas (NON-NEGOTIABLE)

El sistema MUST emitir exactamente los siguientes 4 tipos de alerta por cada sujeto
obligado con obligación activa:

| # | Momento | Tipo |
|---|---------|------|
| Alerta 1 | 30 días antes del vencimiento | Preventiva temprana |
| Alerta 2 | 15 días antes del vencimiento | Preventiva intermedia |
| Alerta 3 | 5 días antes del vencimiento | Preventiva urgente |
| Alerta 4 | Día siguiente al vencimiento | Incumplimiento |

El calendario de alertas MUST NOT ser modificable sin enmienda formal a esta constitución.
Los canales de envío (correo institucional, WhatsApp Business u otros) SHOULD ser
configurables sin alterar el calendario.

### IV. Trazabilidad y evidencia

Cada alerta emitida, cada cambio en el registro de sujetos obligados y cada acción de
cumplimiento registrada MUST quedar almacenada con marca de tiempo (timestamp) y usuario
responsable.

Los registros de auditoría MUST ser inmutables: no pueden editarse ni eliminarse, solo
marcarse como anulados con justificación.

**Rationale**: El sistema genera evidencia objetiva para auditoría interna, control
gubernamental y toma de decisiones de la Alta Dirección.

### V. Bajo costo y sostenibilidad

La implementación MUST basarse prioritariamente en herramientas ya disponibles en la
entidad. Orden de preferencia:

1. Microsoft 365 (Outlook, Power Automate, SharePoint, Teams)
2. Google Workspace (Gmail, Google Sheets, Apps Script)
3. Sistemas internos existentes de la entidad
4. Herramientas open source sin costo de licencia

El sistema MUST NOT introducir dependencias de software con costo de licencia recurrente
sin aprobación formal de la Alta Dirección.

### VI. Simplicidad de implementación

Toda solución técnica MUST poder ser operada y mantenida por personal de la Oficina de
Integridad Institucional sin requerir conocimientos de programación avanzada.

Ante dos soluciones equivalentes en funcionalidad, MUST elegirse la de menor complejidad
operativa. La complejidad MUST justificarse explícitamente en el plan de implementación.

## Módulos del Sistema

| # | Módulo | Descripción |
|---|--------|-------------|
| 1 | Registro de sujetos obligados | CRUD con sincronización de cambios de personal, clasificación por tipo de obligación y fecha de vencimiento |
| 2 | Motor de alertas | Envío automatizado por correo institucional y/o WhatsApp Business según el calendario de alertas del Principio III |
| 3 | Tablero de control | Estado de cumplimiento en tiempo real, reportes por órgano/unidad orgánica/nivel jerárquico, identificación de brechas |
| 4 | Módulo de reportes | Reporte semanal para jefes inmediatos, informes periódicos para Alta Dirección, indicadores de riesgo |

## Indicadores de Éxito

| # | Indicador | Meta inicial |
|---|-----------|-------------|
| 1 | % de DJI presentadas dentro del plazo | Incremento respecto a línea base |
| 2 | Número de servidores omisos por periodo | Reducción respecto a línea base |
| 3 | Número de alertas emitidas | 100% de cobertura sobre sujetos obligados activos |
| 4 | Tiempo promedio de regularización de incumplimientos | Reducción respecto a línea base |

## Marco Normativo

- Ley N.° 31227 — Ley de Declaración Jurada de Intereses
- Disposiciones de la Contraloría General de la República sobre DJI
- Normativa de transparencia y prevención de conflictos de intereses aplicable a la entidad

## Gobernanza

### Autoridad

Esta constitución es la referencia primaria para todas las decisiones de diseño e
implementación. En caso de conflicto entre esta constitución y cualquier otro documento,
la constitución prevalece.

### Procedimiento de enmienda

1. Cualquier cambio a un principio MUST ser propuesto como enmienda formal con justificación escrita.
2. Los Principios I, II y III son no-negociables; su modificación requiere aprobación del responsable de la Oficina de Integridad Institucional y documentación del impacto normativo.
3. Los Principios IV, V y VI pueden enmendarse con justificación técnica documentada.
4. Toda enmienda aprobada MUST incrementar la versión de la constitución según la política de versionado.

### Política de versionado (Semántico)

- **MAJOR** (X.0.0): Eliminación o redefinición incompatible de un principio.
- **MINOR** (0.X.0): Adición de principio/sección o expansión material de guía existente.
- **PATCH** (0.0.X): Clarificaciones, correcciones de redacción, ajustes no semánticos.

### Revisión de cumplimiento

Todo plan de implementación MUST incluir una sección "Constitution Check" que verifique
explícitamente el cumplimiento de cada principio antes de comenzar la implementación.

**Version**: 1.1.0 | **Ratificada**: 2026-06-19 | **Última enmienda**: 2026-06-19
