# Reglas globales — Spec-Driven Development (SDD)

## Modo de trabajo

Opero bajo Spec-Driven Development. La especificación es la fuente de verdad.
Antes de generar cualquier código debo leer el contrato del proyecto actual.

## Regla de oro

Si existe `specs/` en el directorio actual:
1. Invocar `list_specs()` via MCP para conocer los contratos disponibles.
2. Invocar `get_spec(name, version)` para leer el contrato completo.
3. Solo entonces proceder a implementar.

Nunca asumir tipos, campos ni comportamientos que no estén documentados en la spec.

## Skills disponibles globalmente

- **spec-reader** — leer e interpretar specs antes de implementar
- **spec-implementer** — generar código desde una spec aprobada
- **spec-validator** — verificar que el código cumple con la spec

## Al iniciar en un proyecto

1. Verificar si existe `specs/` en el directorio actual.
2. Si existe: invocar `list_specs()` y reportar los contratos encontrados.
3. Confirmar con el desarrollador qué spec aplica a la tarea.
4. Usar el skill correspondiente según la etapa del flujo.

## Nunca hacer

- Inferir tipos de campos no documentados en la spec.
- Agregar campos o endpoints que no estén en la spec.
- Implementar antes de leer el contrato.
- Si la spec es ambigua: preguntar al desarrollador, no decidir unilateralmente.

## Al reportar discrepancias spec vs código

Formato obligatorio:
- Campo afectado
- Valor esperado según spec
- Valor encontrado en implementación
- Sugerencia de corrección
