---
name: spec-validator
description: >
  Validar que una implementación cumple con su spec de origen.
  Usar antes de hacer commit, en PR reviews, cuando el usuario pide
  "verifica que cumple la spec", "revisa el contrato", "hace PR review",
  o cuando se detecta una posible discrepancia entre código y spec.
compatibility:
  - spec-server MCP
---

# Spec Validator

## Proceso de validación

1. Invocar `get_spec(name, version)` para cargar el contrato de referencia.
2. Comparar la implementación contra cada punto del checklist.
3. Invocar `validate_against_spec(name, version, payload)` con ejemplos del código
   para verificar conformidad estructural.
4. Reportar discrepancias en el formato estándar (ver abajo).
5. Si no hay discrepancias: confirmar conformidad con spec ID y versión.

## Checklist de validación

```
□  Todos los endpoints de la spec están implementados.
□  Los paths y métodos HTTP coinciden exactamente con la spec.
□  Los tipos de requestBody coinciden con el JSON Schema.
□  Los campos required lanzan error (400/422) si están ausentes.
□  Los campos con enum rechazan valores fuera del rango definido.
□  Los códigos de respuesta implementados coinciden con los de la spec.
□  Los campos de respuesta no incluyen campos extra no documentados.
□  Los formatos especiales se validan (email, uuid, date-time, etc.).
□  Los tests cubren al menos un caso exitoso y uno de error por operación.
□  Cada handler tiene el comentario de trazabilidad con @spec y @operationId.
```

## Formato de reporte de discrepancias

```
DISCREPANCIA #1
  Campo:         requestBody.amount
  Spec:          type: number, minimum: 0.01
  Implementación: type: string (sin conversión)
  Corrección:    Convertir a number y validar >= 0.01 antes de procesar.

DISCREPANCIA #2
  Campo:         response.status
  Spec:          enum: ["pending", "approved", "rejected"]
  Implementación: retorna "processing" (valor fuera del enum)
  Corrección:    Usar "pending" hasta confirmar aprobación.
```

## Si no hay discrepancias

```
✓ Implementación conforme con spec [name]/[version]
  Operaciones validadas: [lista de operationId]
  Fecha de validación: [fecha]
```
