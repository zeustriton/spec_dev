# Feature Specification: Sistema de Alertas para Declaración Jurada de Intereses

**Feature Branch**: `001-sistema-alertas-dji`

**Created**: 2026-06-19

**Status**: Draft

**Input**: Iniciativa de Integridad Pública — Sistema de Alertas para la presentación
oportuna de las Declaraciones Juradas de Intereses en el marco de la Ley N.° 31227.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Sujeto obligado recibe alertas preventivas (Priority: P1)

Un servidor público registrado como sujeto obligado recibe notificaciones automáticas
por correo institucional en los plazos establecidos (30, 15 y 5 días antes del
vencimiento), de modo que pueda presentar su DJI a tiempo sin depender de recordatorios
manuales.

**Why this priority**: Es el núcleo del sistema. Sin alertas preventivas funcionales,
el resto de módulos no tiene valor. Representa la transformación de reactivo a preventivo.

**Independent Test**: Registrar un sujeto obligado con fecha de vencimiento próxima;
verificar que recibe exactamente 3 alertas preventivas en los plazos correctos y que
los correos contienen información de identificación, plazo y enlace a la plataforma DJI.

**Acceptance Scenarios**:

1. **Given** un sujeto obligado con vencimiento en 30 días,
   **When** el sistema ejecuta la verificación diaria,
   **Then** el sujeto recibe la Alerta 1 por correo institucional con su nombre, cargo,
   fecha límite y enlace a la plataforma de registro de DJI.

2. **Given** un sujeto obligado que recibió la Alerta 1 y aún no ha presentado su DJI,
   **When** faltan 15 días para el vencimiento,
   **Then** el sujeto recibe la Alerta 2 con el mismo contenido más indicación de urgencia.

3. **Given** un sujeto obligado que recibió las Alertas 1 y 2 sin presentar su DJI,
   **When** faltan 5 días para el vencimiento,
   **Then** el sujeto recibe la Alerta 3 marcada como urgente, con copia a su jefe inmediato.

4. **Given** un sujeto obligado que ya presentó su DJI antes del vencimiento,
   **When** se cumplen los hitos de alerta restantes,
   **Then** el sujeto NO recibe más alertas para ese periodo; el sistema registra el
   cumplimiento.

---

### User Story 2 — Administrador gestiona el registro de sujetos obligados (Priority: P1)

El responsable de la Oficina de Integridad Institucional mantiene una base de datos
actualizada de sujetos obligados, incluyendo altas, bajas y cambios de puesto, con
clasificación por tipo de obligación y fecha de vencimiento.

**Why this priority**: Sin un registro dinámico y preciso, las alertas se envían a
personas incorrectas u omiten a obligados reales, invalidando todo el sistema.

**Independent Test**: Registrar un nuevo servidor, asignarle tipo de obligación y fecha
de vencimiento; luego actualizar su cargo y verificar que el registro refleja el cambio;
finalmente dar de baja y verificar que no recibe más alertas.

**Acceptance Scenarios**:

1. **Given** el administrador accede al módulo de registro,
   **When** ingresa los datos de un nuevo servidor (nombre, DNI, cargo, unidad orgánica,
   tipo de obligación, fecha de vencimiento),
   **Then** el registro queda guardado y el servidor aparece en el listado de obligados
   activos para el ciclo de alertas correspondiente.

2. **Given** un sujeto obligado activo cambia de cargo o unidad orgánica,
   **When** el administrador actualiza su ficha,
   **Then** el sistema refleja el cambio en tiempo real y registra el historial de
   modificaciones con fecha y usuario responsable.

3. **Given** un servidor es dado de baja o deja de estar obligado,
   **When** el administrador lo desactiva en el sistema,
   **Then** el servidor deja de recibir alertas futuras y su registro queda en estado
   "inactivo" con fecha de baja; los registros históricos se conservan.

4. **Given** el administrador necesita importar múltiples sujetos obligados,
   **When** carga una lista en formato estándar (Excel/CSV),
   **Then** el sistema valida los datos, reporta errores de formato e importa los
   registros válidos sin duplicados.

---

### User Story 3 — Administrador registra incumplimiento y genera alerta post-vencimiento (Priority: P2)

Al día siguiente del vencimiento de la obligación, el sistema identifica automáticamente
a los sujetos que no presentaron su DJI y emite una alerta de incumplimiento al servidor,
a su jefe inmediato y al responsable de Integridad.

**Why this priority**: Cierra el ciclo preventivo con evidencia objetiva del incumplimiento,
habilitando acciones correctivas tempranas.

**Independent Test**: Con un sujeto obligado cuyo plazo vence hoy y sin DJI registrada,
verificar que al día siguiente el sistema emite la alerta de incumplimiento a los tres
destinatarios y registra el evento en el log de auditoría.

**Acceptance Scenarios**:

1. **Given** un sujeto obligado que no presentó su DJI al llegar la fecha de vencimiento,
   **When** el sistema ejecuta la verificación al día siguiente del vencimiento,
   **Then** se emite la alerta de incumplimiento al sujeto, a su jefe inmediato y al
   responsable de Integridad, con detalle del tipo de obligación incumplida y fecha.

2. **Given** una alerta de incumplimiento emitida,
   **When** el sujeto regulariza su DJI de forma extemporánea,
   **Then** el administrador puede registrar la regularización con fecha y el sistema
   actualiza el estado del sujeto a "presentado con retraso", dejando trazabilidad completa.

---

### User Story 4 — Jefe inmediato recibe reporte semanal de cumplimiento (Priority: P2)

Cada semana, los jefes inmediatos reciben automáticamente un resumen del estado de
cumplimiento de los servidores bajo su cargo, para facilitar el seguimiento y acompañamiento.

**Why this priority**: Descentraliza el seguimiento, reduciendo la carga de la Oficina
de Integridad y creando corresponsabilidad en la cadena jerárquica.

**Independent Test**: Configurar un jefe inmediato con servidores a cargo; al término
de la semana verificar que recibe el reporte con estado actualizado (pendiente/presentado/
omiso) de cada servidor a su cargo.

**Acceptance Scenarios**:

1. **Given** un jefe inmediato con servidores a cargo que tienen obligaciones activas,
   **When** se ejecuta el proceso semanal de reportes (día y hora configurables),
   **Then** el jefe recibe un correo con tabla resumen: nombre del servidor, tipo de
   obligación, fecha de vencimiento y estado (pendiente / presentado / omiso).

2. **Given** todos los servidores a cargo de un jefe ya cumplieron,
   **When** se ejecuta el proceso semanal,
   **Then** el jefe recibe el reporte indicando cumplimiento total de su equipo.

---

### User Story 5 — Alta Dirección accede al tablero de control institucional (Priority: P3)

El responsable de Integridad y la Alta Dirección acceden a un tablero con indicadores
en tiempo real: porcentaje de cumplimiento, servidores omisos, alertas emitidas y
brechas por unidad orgánica.

**Why this priority**: Habilita la toma de decisiones basada en datos y la generación
de evidencia para órganos de control.

**Independent Test**: Con datos de múltiples sujetos en distintos estados, verificar
que el tablero muestra métricas correctas desagregadas por órgano, unidad orgánica y
nivel jerárquico, y que se actualiza al registrar cambios.

**Acceptance Scenarios**:

1. **Given** el responsable de Integridad accede al tablero,
   **When** visualiza el panel principal,
   **Then** ve el porcentaje global de DJI presentadas en plazo, número de omisos,
   número de alertas emitidas en el periodo y tiempo promedio de regularización.

2. **Given** la Alta Dirección necesita un reporte por dependencia,
   **When** filtra por órgano o unidad orgánica,
   **Then** el tablero muestra los indicadores desagregados para esa dependencia,
   identificando unidades con mayor riesgo de incumplimiento.

3. **Given** el responsable de Integridad necesita evidencia para un informe de control,
   **When** exporta el reporte del periodo,
   **Then** obtiene un documento con todos los indicadores, historial de alertas y
   estado de cumplimiento individual, en formato descargable.

---

### Edge Cases

- ¿Qué ocurre si un sujeto obligado tiene múltiples obligaciones con fechas de
  vencimiento distintas en el mismo periodo? → Cada obligación genera su propio ciclo
  de alertas de forma independiente.
- ¿Qué ocurre si el correo institucional del sujeto no está disponible o rebota?
  → El sistema registra el error de entrega en el log de auditoría y el administrador
  es notificado para gestionar el canal alternativo.
- ¿Qué ocurre si un sujeto es dado de alta con menos de 30 días antes de su vencimiento?
  → El sistema emite únicamente las alertas cuyos hitos aún no han pasado desde la
  fecha de registro.
- ¿Qué ocurre si el administrador carga un archivo de importación con datos duplicados?
  → El sistema identifica duplicados por DNI y los omite, reportando cuáles fueron
  ignorados y por qué.
- ¿Qué ocurre si la integración con el sistema de RRHH falla? → El sistema mantiene
  el último estado conocido del registro y alerta al administrador sobre la falla de
  sincronización para intervención manual.

---

## Clarifications

### Session 2026-06-19

- Q: ¿Cómo se registra en el sistema que un sujeto obligado presentó su DJI? → A: El administrador lo registra manualmente (ingresa fecha de presentación por cada sujeto).

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST enviar la Alerta 1 exactamente 30 días calendario antes
  de la fecha de vencimiento de cada obligación activa.
- **FR-002**: El sistema MUST enviar la Alerta 2 exactamente 15 días calendario antes
  del vencimiento.
- **FR-003**: El sistema MUST enviar la Alerta 3 exactamente 5 días calendario antes
  del vencimiento, con copia al jefe inmediato del sujeto.
- **FR-004**: El sistema MUST enviar la alerta de incumplimiento al día siguiente del
  vencimiento si no existe registro de presentación de DJI.
- **FR-005**: El sistema MUST NOT enviar alertas a sujetos cuya presentación de DJI
  haya sido registrada manualmente por el administrador para el periodo vigente.
- **FR-005a**: El administrador MUST poder registrar la fecha de presentación de DJI
  de un sujeto obligado de forma individual; el sistema detiene el ciclo de alertas
  activo para ese sujeto en ese periodo inmediatamente tras el registro.
- **FR-006**: El sistema MUST registrar en log de auditoría inmutable cada alerta
  emitida, con timestamp, destinatario y tipo de alerta.
- **FR-007**: El sistema MUST permitir al administrador registrar altas, bajas y
  cambios de datos de sujetos obligados.
- **FR-008**: El sistema MUST conservar historial completo de modificaciones al registro
  de cada sujeto, con fecha y usuario responsable.
- **FR-009**: El sistema MUST permitir importación masiva de sujetos obligados desde
  archivo Excel o CSV con validación y reporte de errores.
- **FR-010**: El sistema MUST enviar reporte semanal de cumplimiento a cada jefe
  inmediato con servidores a cargo que tengan obligaciones activas.
- **FR-011**: El sistema MUST proveer tablero con indicadores: % de DJI en plazo,
  número de omisos, número de alertas emitidas y tiempo promedio de regularización.
- **FR-012**: El tablero MUST permitir filtrado por órgano, unidad orgánica y nivel
  jerárquico.
- **FR-013**: El sistema MUST permitir exportar reportes de cumplimiento en formato
  descargable (Excel o PDF).
- **FR-014**: El sistema MUST permitir registrar la regularización extemporánea de DJI,
  actualizando el estado del sujeto a "presentado con retraso".
- **FR-015**: El canal de envío de alertas (correo, WhatsApp Business u otro disponible
  en la entidad) MUST ser configurable sin modificar el calendario de alertas.

### Key Entities

- **Sujeto Obligado**: Servidor público con obligación de presentar DJI. Atributos:
  nombre, DNI, cargo, unidad orgánica, nivel jerárquico, jefe inmediato, estado (activo/
  inactivo), tipo de obligación, fecha de vencimiento, correo institucional.
- **Obligación DJI**: Instancia de obligación de un sujeto en un periodo. Atributos:
  tipo, fecha de vencimiento, estado (pendiente/presentado en plazo/presentado con
  retraso/omiso), fecha de presentación (si aplica).
- **Alerta**: Notificación emitida. Atributos: tipo (1/2/3/incumplimiento), destinatarios,
  canal, timestamp de envío, estado de entrega, sujeto asociado, obligación asociada.
- **Log de Auditoría**: Registro inmutable de eventos del sistema. Atributos: tipo de
  evento, timestamp, usuario responsable, entidad afectada, detalle del cambio.
- **Unidad Orgánica**: Área o dependencia de la entidad. Atributos: nombre, órgano al
  que pertenece, jefe responsable.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Al menos el 95% de los sujetos obligados activos reciben la Alerta 1 en
  el día exacto correspondiente (30 días antes del vencimiento), medido por los registros
  de entrega del sistema.
- **SC-002**: El porcentaje de DJI presentadas dentro del plazo aumenta en al menos
  20 puntos porcentuales respecto a la línea base del periodo anterior.
- **SC-003**: El número de servidores omisos por periodo se reduce en al menos 50%
  respecto a la línea base.
- **SC-004**: El tiempo promedio destinado al seguimiento manual por parte de la Oficina
  de Integridad se reduce en al menos 60%.
- **SC-005**: El administrador puede registrar o actualizar un sujeto obligado en menos
  de 3 minutos.
- **SC-006**: El tablero de control se actualiza en tiempo real (menos de 5 minutos
  de latencia desde un cambio de estado).
- **SC-007**: El 100% de las alertas emitidas quedan registradas en el log de auditoría
  con trazabilidad completa.

---

## Assumptions

- El sistema se implementa sobre herramientas ya disponibles en la entidad (Microsoft 365
  o Google Workspace), sin adquirir software adicional con costo de licencia.
- La entidad cuenta con correo electrónico institucional para todos los sujetos obligados.
- La fecha de vencimiento de la DJI se determina por el tipo de cargo/función según
  lo establece la Ley N.° 31227 y disposiciones complementarias.
- El administrador del sistema es el responsable de la Oficina de Integridad Institucional
  o personal designado por ella.
- El sistema fuente de datos de personal (RRHH) puede exportar o compartir datos en
  formato Excel/CSV como mínimo para la sincronización inicial y actualizaciones.
- WhatsApp Business como canal alternativo de alertas es opcional en v1; la integración
  por correo es el canal primario obligatorio.
- La plataforma nacional de registro de DJI es externa al sistema; el sistema solo
  proporciona el enlace a ella, no gestiona el registro de la declaración en sí.
- Los reportes para la Alta Dirección son bajo demanda (exportación manual) en v1;
  el envío automático programado es v2.
- El tablero de control en v1 es un dashboard estático/semi-estático (actualización
  periódica); el tiempo real completo es una mejora futura.
