# SDD Setup — Spec-Driven Development con Claude Code

Configuración global de Spec-Driven Development para Claude Code.
Se instala **una sola vez** y funciona en **todos tus proyectos**.

## Instalación rápida

```bash
git clone https://github.com/tu-org/sdd-setup.git
cd sdd-setup
chmod +x install.sh
./install.sh
```

El script instala todo en `~/.claude/` y no modifica nada más en tu sistema.

## Qué instala

```
~/.claude/
├── CLAUDE.md                       ← Reglas SDD globales (carga automática)
├── mcp.json                        ← MCP server global
├── spec-server/                    ← Servidor que detecta specs/ de cada proyecto
│   ├── index.js
│   ├── package.json
│   └── handlers/
│       ├── get_spec.js             ← Lee specs dinámicamente desde PWD
│       ├── list_specs.js           ← Lista specs del proyecto actual
│       └── validate.js             ← Validación con Ajv
└── skills/
    ├── spec-reader/SKILL.md        ← Skill: leer e interpretar specs
    ├── spec-implementer/SKILL.md   ← Skill: generar código desde specs
    └── spec-validator/SKILL.md     ← Skill: verificar conformidad del código
```

## Uso en un proyecto nuevo

Después de instalar, el onboarding de cualquier proyecto es:

```bash
# 1. Crear la carpeta de specs (lo único que necesita cada proyecto)
mkdir -p specs/[dominio]/v1

# 2. Crear el contrato OpenAPI
touch specs/[dominio]/v1/openapi.yaml

# 3. Abrir Claude Code
claude

# 4. Pedir a Claude que implemente siguiendo la spec
# > Implementa POST /orders siguiendo la spec orders/v1
```

## Estructura de specs esperada

```
mi-proyecto/
└── specs/
    ├── payments/
    │   ├── v1/openapi.yaml
    │   └── v2/openapi.yaml
    └── users/
        └── v1/schema.json
```

## Herramientas MCP disponibles

| Herramienta | Descripción |
|---|---|
| `list_specs()` | Lista todas las specs del proyecto actual |
| `get_spec(name, version)` | Lee el contrato completo |
| `validate_against_spec(name, version, schemaRef, payload)` | Valida un objeto contra el schema |
| `get_examples(name, version, operation)` | Retorna ejemplos de request/response |

## Skills disponibles

| Skill | Cuándo usar |
|---|---|
| `spec-reader` | Antes de implementar — Claude lee e interpreta la spec |
| `spec-implementer` | Para generar código alineado a la spec |
| `spec-validator` | Para verificar conformidad del código con la spec |

## Prerequisitos

- Node.js 18+
- Claude Code CLI: `npm install -g @anthropic-ai/claude-code`

## Actualizar

```bash
git pull
./install.sh
```

El script preguntará antes de sobreescribir archivos existentes.

---

Documentación completa: **SDD-Claude-Code-Guide.docx**
