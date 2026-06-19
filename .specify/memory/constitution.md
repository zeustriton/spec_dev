<!--
SYNC IMPACT REPORT
==================
Version change: 1.1.0 → 1.2.0 (MINOR — Principio VII de seguridad añadido + Stack Tecnológico documentado)

Principios modificados:
  - V. Bajo costo y sostenibilidad: referencia cruzada al Stack Tecnológico añadida
  - Gobernanza: Principios VII ahora listado como no-negociable junto con I, II y III

Secciones añadidas:
  - Principio VII: Seguridad por diseño (OWASP Top 10 + OWASP AI)
  - Stack Tecnológico Mandatorio (sección nueva entre Módulos e Indicadores)

Templates verificados:
  ✅ .specify/templates/plan-template.md — Constitution Check compatible; debe incluir
     checklist OWASP en cada plan
  ✅ .specify/templates/spec-template.md — estructura de requisitos compatible
  ✅ .specify/templates/tasks-template.md — fase de Polish incluye "Security hardening"

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

La implementación MUST basarse en el stack tecnológico mandatorio definido en la sección
"Stack Tecnológico Mandatorio" de esta constitución. Todas las herramientas del stack
son open source o de licencia incluida en el entorno de despliegue.

El sistema MUST NOT introducir dependencias con costo de licencia recurrente adicional
sin aprobación formal de la Alta Dirección.

**Rationale**: Garantizar que el sistema sea mantenible a largo plazo sin depender de
presupuesto variable o herramientas externas a la entidad.

### VI. Simplicidad de implementación

Toda solución técnica MUST poder ser operada y mantenida por personal de la Oficina de
Integridad Institucional sin requerir conocimientos de programación avanzada.

Ante dos soluciones equivalentes en funcionalidad, MUST elegirse la de menor complejidad
operativa. La complejidad MUST justificarse explícitamente en el plan de implementación.

### VII. Seguridad por diseño (NON-NEGOTIABLE)

Todo desarrollo MUST cumplir con los estándares de seguridad definidos por:

- **OWASP Top 10** (https://owasp.org/www-project-top-ten/) — controles obligatorios:
  - **A01 Broken Access Control**: El sistema MUST implementar control de acceso basado
    en roles (RBAC) con los tres roles definidos (administrador pleno, operador de
    lectura, Alta Dirección). Ningún usuario MUST acceder a datos o funciones fuera
    de su rol.
  - **A02 Cryptographic Failures**: Los datos sensibles de servidores públicos (nombre,
    DNI, cargo) MUST estar protegidos en tránsito (HTTPS/TLS) y en reposo según las
    capacidades del stack.
  - **A03 Injection**: Toda entrada de usuario MUST ser validada y sanitizada. El ORM
    (Prisma) MUST usarse para todas las consultas a base de datos; MUST NOT construirse
    queries SQL crudas con datos de usuario.
  - **A05 Security Misconfiguration**: Las variables de entorno sensibles (secretos,
    credenciales) MUST NOT incluirse en el repositorio de código.
  - **A07 Identification and Authentication Failures**: La autenticación MUST delegarse
    a NextAuth.js con cuenta institucional; MUST NOT implementarse sistemas de
    autenticación propios.
  - **A09 Security Logging and Monitoring Failures**: Todos los eventos de acceso,
    modificación de datos y emisión de alertas MUST registrarse (ver Principio IV).

- **OWASP AI Security** (https://owaspai.org/) — controles aplicables al uso del
  agente GLM en la construcción y operación del sistema:
  - **LLM01 Prompt Injection**: El código generado por el agente de IA MUST ser
    revisado antes de integrarse; MUST NOT ejecutarse directamente sin validación humana.
  - **LLM06 Sensitive Information Disclosure**: El agente de IA MUST NOT recibir datos
    reales de servidores públicos (nombres, DNI, correos) durante el desarrollo o pruebas;
    MUST usarse datos sintéticos.
  - **LLM08 Excessive Agency**: El agente de IA MUST NOT tener acceso directo a la
    base de datos de producción ni a los canales de envío de alertas reales.

**Rationale**: El sistema maneja datos personales de servidores públicos y genera
evidencia para órganos de control. Una brecha de seguridad comprometería la integridad
institucional que el sistema busca fortalecer.

## Stack Tecnológico Mandatorio

El sistema MUST construirse sobre el siguiente stack. Cualquier sustitución de componente
MUST ser aprobada como enmienda a esta constitución.

### Framework & Lenguaje

| Tecnología | Versión | Rol |
|------------|---------|-----|
| Next.js | 16 (App Router) | Framework full-stack |
| TypeScript | 5 | Lenguaje principal |
| Bun | Latest | Runtime y package manager |

### UI & Estilos

| Tecnología | Versión | Rol |
|------------|---------|-----|
| Tailwind CSS | 4 | Framework de estilos |
| shadcn/ui | New York style | Biblioteca de componentes |
| Lucide Icons | Latest | Iconografía |
| Framer Motion | Latest | Animaciones y transiciones |
| next-themes | Latest | Soporte claro/oscuro |

### Base de Datos & ORM

| Tecnología | Versión | Rol |
|------------|---------|-----|
| Prisma ORM | Latest | Mapeo objeto-relacional |
| SQLite | — | Base de datos embebida (archivo local en `/db`) |

### Autenticación

| Tecnología | Versión | Rol |
|------------|---------|-----|
| NextAuth.js | v4 | Autenticación con cuenta institucional |

### Estado & Datos

| Tecnología | Versión | Rol |
|------------|---------|-----|
| Zustand | Latest | Estado del cliente |
| TanStack Query | Latest | Estado del servidor y caché |

### Tiempo Real & Infraestructura

| Tecnología | Rol |
|------------|-----|
| Socket.io | Comunicación WebSocket para actualizaciones en tiempo real |
| Caddy | Gateway, enrutamiento y proxy inverso |

### Capacidades de Generación de Documentos

| Formato | Uso en este sistema |
|---------|---------------------|
| XLSX | Exportación de reportes de cumplimiento |
| PDF | Informes para Alta Dirección y órganos de control |

### Decisiones de arquitectura mandatorias

- Patrón: Server Components + Client Components (React)
- APIs: API Routes (backend en servidor); MUST NOT usarse Server Actions para lógica
  de negocio crítica
- Base de datos: archivo SQLite local en `/db`
- Diseño: Mobile-first, responsive
- Tema: Soporte claro/oscuro obligatorio

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
- OWASP Top 10 — estándar de seguridad para aplicaciones web
- OWASP AI Security Top 10 — estándar de seguridad para sistemas con IA

## Gobernanza

### Autoridad

Esta constitución es la referencia primaria para todas las decisiones de diseño e
implementación. En caso de conflicto entre esta constitución y cualquier otro documento,
la constitución prevalece.

### Procedimiento de enmienda

1. Cualquier cambio a un principio MUST ser propuesto como enmienda formal con justificación escrita.
2. Los Principios I, II, III y VII son no-negociables; su modificación requiere aprobación
   del responsable de la Oficina de Integridad Institucional y documentación del impacto
   normativo y de seguridad.
3. Los Principios IV, V y VI pueden enmendarse con justificación técnica documentada.
4. El Stack Tecnológico Mandatorio puede enmendarse con justificación técnica; cada
   sustitución de componente MUST evaluarse contra los controles OWASP del Principio VII.
5. Toda enmienda aprobada MUST incrementar la versión de la constitución según la
   política de versionado.

### Política de versionado (Semántico)

- **MAJOR** (X.0.0): Eliminación o redefinición incompatible de un principio.
- **MINOR** (0.X.0): Adición de principio/sección o expansión material de guía existente.
- **PATCH** (0.0.X): Clarificaciones, correcciones de redacción, ajustes no semánticos.

### Revisión de cumplimiento

Todo plan de implementación MUST incluir una sección "Constitution Check" que verifique
explícitamente el cumplimiento de cada principio, incluyendo el checklist de controles
OWASP del Principio VII, antes de comenzar la implementación.

**Version**: 1.2.0 | **Ratificada**: 2026-06-19 | **Última enmienda**: 2026-06-19
