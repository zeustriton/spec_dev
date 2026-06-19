# Sistema de Alertas DJI - Constitución

## Contexto del Producto

Sistema de alertas preventivas y monitoreo de cumplimiento para la presentación oportuna de la Declaración Jurada de Intereses (DJI) en el marco de la Ley N.° 31227. Dirigido a la Oficina de Integridad Institucional de una entidad pública peruana.

**Problema central**: El seguimiento de DJI se realiza de forma manual y reactiva, generando incumplimientos, observaciones de control y debilidad en los mecanismos de integridad institucional.

**Usuarios principales**:
- Responsable de la Oficina de Integridad Institucional (administrador/operador del sistema)
- Sujetos obligados (servidores públicos que deben presentar DJI)
- Jefes inmediatos (reciben reportes semanales de cumplimiento)
- Alta Dirección (recibe informes periódicos)

## Principios de Diseño

### I. Preventivo sobre reactivo
El sistema emite alertas antes del vencimiento, no después. Toda funcionalidad debe orientarse a evitar el incumplimiento, no a gestionarlo una vez ocurrido.

### II. Registro dinámico
La base de sujetos obligados debe reflejar en tiempo real altas, bajas y cambios de puesto. No puede depender de actualizaciones manuales periódicas.

### III. Alertas escalonadas (NON-NEGOTIABLE)
El sistema emite exactamente 4 tipos de alerta por sujeto obligado:
- Alerta 1: 30 días antes del vencimiento
- Alerta 2: 15 días antes del vencimiento
- Alerta 3: 5 días antes del vencimiento
- Alerta de incumplimiento: al día siguiente del vencimiento

### IV. Trazabilidad y evidencia
Cada alerta emitida, cada acción de cumplimiento y cada cambio en el registro debe quedar registrado. El sistema genera evidencia objetiva para auditoría y control.

### V. Bajo costo y sostenibilidad
La implementación debe basarse en herramientas ya disponibles en la entidad (Outlook, Excel, Power Automate, Google Workspace o sistemas internos). No debe generar costos significativos de licenciamiento.

### VI. Simplicidad de implementación
Priorizar soluciones simples y mantenibles por personal no técnico especializado. Evitar dependencias complejas.

## Módulos del Sistema

1. **Registro de sujetos obligados** — CRUD con incorporación automática de cambios de personal, clasificación por tipo de obligación y fecha de vencimiento.
2. **Motor de alertas** — Envío automatizado por correo institucional y/o WhatsApp Business según calendario de alertas.
3. **Tablero de control** — Estado de cumplimiento en tiempo real, reportes por órgano/unidad orgánica/nivel jerárquico, identificación de brechas.
4. **Módulo de reportes** — Reporte semanal para jefes inmediatos, informes periódicos para Alta Dirección, indicadores de riesgo.

## Indicadores de Éxito

1. % de DJI presentadas dentro del plazo
2. Número de servidores omisos por periodo
3. Número de alertas emitidas
4. Tiempo promedio de regularización de incumplimientos

## Marco Normativo

- Ley N.° 31227 (Ley de Declaración Jurada de Intereses)
- Disposiciones de la Contraloría General de la República sobre DJI
- Normativa de transparencia y prevención de conflictos de intereses

## Gobernanza

La constitución es la referencia primaria para todas las decisiones de diseño e implementación. Cualquier funcionalidad que contradiga los principios definidos aquí debe ser rechazada o sometida a revisión formal.

**Version**: 1.0.0 | **Ratificada**: 2026-06-19 | **Última enmienda**: 2026-06-19
