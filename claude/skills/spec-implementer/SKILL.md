---
name: spec-implementer
description: >
  Generar implementación de código a partir de una spec aprobada.
  Activar cuando el usuario dice "implementa según la spec", "genera el código
  para X", "crea el handler de Y", o después de que spec-reader haya procesado
  el contrato. Siempre requiere que spec-reader haya corrido primero.
---

# Spec Implementer

## Prerequisito

spec-reader debe haber procesado la spec antes de usar este skill.
Si no se ha leído la spec, invocar spec-reader primero.

## Reglas de implementación

1. **Tipos estrictos** — cada campo de la spec se mapea a un tipo estricto.
   Nunca usar `any`, `unknown`, `object` sin tipar, o `dict` sin tipado.
2. **Todos los códigos de respuesta** — implementar todos los códigos documentados
   en la spec, no solo el happy path (200/201).
3. **Validaciones desde la spec** — generar las validaciones a partir de los
   constraints de la spec (`required`, `enum`, `format`, etc.), no a mano.
4. **Naming de la spec** — los nombres de campos y variables respetan exactamente
   el naming de la spec (camelCase, snake_case o el que use el contrato).
5. **Comentario de trazabilidad** — cada función/handler lleva un comentario
   indicando el `operationId` y la versión de la spec que implementa.

## Estructura de output obligatoria

```
handler.ts / controller.py    → lógica HTTP y enrutamiento
schema.ts  / models.py        → tipos y modelos derivados de la spec
handler.test.ts               → tests de contrato (un caso OK + uno de error por operación)
README.md                     → referencia al spec name, version y operationId(s)
```

## Comentario de trazabilidad (ejemplo)

```typescript
/**
 * @spec payments/v1
 * @operationId createTransaction
 */
export async function createTransaction(req: CreateTransactionRequest): Promise<TransactionResponse> {
```

## Nunca

- Agregar campos de respuesta que no estén en la spec.
- Omitir validaciones de campos `required`.
- Usar códigos de error distintos a los documentados en la spec.
