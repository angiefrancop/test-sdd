---
name: spec-reader
description: >
  Leer e interpretar una spec OpenAPI o JSON Schema antes de implementar.
  Usar siempre que el usuario mencione "según la spec", "basado en el contrato",
  "siguiendo el OpenAPI", "siguiendo la spec", o cuando existe specs/ en el
  directorio actual y se va a generar código. Activar también cuando el usuario
  pide "qué dice la spec de X" o "muéstrame el contrato de Y".
compatibility:
  - spec-server MCP
  - filesystem
---

# Spec Reader

## Proceso obligatorio antes de generar código

1. Invocar `list_specs()` via MCP para confirmar qué contratos existen en este proyecto.
2. Invocar `get_spec(name, version)` para obtener el contrato completo.
3. Identificar:
   - Operaciones disponibles (operationId, método HTTP, path)
   - Schemas de entrada (requestBody) y salida (responses)
   - Códigos de respuesta documentados
   - Restricciones: `required`, `enum`, `format`, `minimum`, `maximum`, `pattern`
4. Listar los edge cases implícitos:
   - Campos opcionales que pueden ser nulos o ausentes
   - Valores límite en campos numéricos
   - Formatos especiales (fecha, email, uuid)
   - Dependencias entre campos
5. Confirmar con el desarrollador qué operación(es) implementar.
6. Solo entonces pasar al skill spec-implementer.

## Nunca asumir

- No inferir tipos de campos no documentados en la spec.
- No agregar campos que no estén explícitamente en la spec.
- Si la spec tiene ambigüedad, preguntar antes de decidir.
- No continuar si `list_specs()` retorna vacío — informar al desarrollador que debe crear specs/.
