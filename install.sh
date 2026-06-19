#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# SDD Setup — Spec-Driven Development con Claude Code
# Instala la configuración global en ~/.claude/
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Colores ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# ── Helpers ───────────────────────────────────────────────────────────────────
info()    { echo -e "${BLUE}ℹ${NC}  $*"; }
success() { echo -e "${GREEN}✓${NC}  $*"; }
warn()    { echo -e "${YELLOW}⚠${NC}  $*"; }
error()   { echo -e "${RED}✗${NC}  $*"; exit 1; }
step()    { echo -e "\n${BOLD}${CYAN}▶ $*${NC}"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_DIR="$HOME/.claude"
SOURCE_DIR="$SCRIPT_DIR/claude"

# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║     SDD Setup — Spec-Driven Development              ║${NC}"
echo -e "${BOLD}║     Configuración global para Claude Code            ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

# ── Verificar prerequisitos ───────────────────────────────────────────────────
step "Verificando prerequisitos"

if ! command -v node &>/dev/null; then
  error "Node.js no está instalado. Instálalo desde https://nodejs.org (v18+)"
fi

NODE_VERSION=$(node -e "process.exit(parseInt(process.version.slice(1)) < 18 ? 1 : 0)" 2>/dev/null && echo "ok" || echo "old")
if [ "$NODE_VERSION" = "old" ]; then
  error "Node.js v18+ requerido. Versión actual: $(node --version)"
fi
success "Node.js $(node --version)"

if ! command -v claude &>/dev/null; then
  warn "Claude Code CLI no encontrado. Instálalo con: npm install -g @anthropic-ai/claude-code"
  warn "Continuando instalación de archivos de configuración..."
else
  success "Claude Code $(claude --version 2>/dev/null || echo '(versión desconocida)')"
fi

# ── Crear estructura ~/.claude/ ───────────────────────────────────────────────
step "Creando estructura ~/.claude/"

dirs=(
  "$CLAUDE_DIR"
  "$CLAUDE_DIR/skills/spec-reader"
  "$CLAUDE_DIR/skills/spec-implementer"
  "$CLAUDE_DIR/skills/spec-validator"
  "$CLAUDE_DIR/spec-server/handlers"
)

for dir in "${dirs[@]}"; do
  mkdir -p "$dir"
  success "mkdir $dir"
done

# ── Función de copia con confirmación de sobreescritura ───────────────────────
copy_file() {
  local src="$1"
  local dst="$2"

  if [ -f "$dst" ]; then
    echo -e "${YELLOW}  ⚠  Ya existe: $dst${NC}"
    read -r -p "     ¿Sobreescribir? [s/N] " answer
    case "$answer" in
      [sS]) ;;
      *) info "  Omitido: $dst"; return ;;
    esac
  fi

  cp "$src" "$dst"
  success "$(basename "$dst")"
}

# ── Copiar CLAUDE.md ──────────────────────────────────────────────────────────
step "Instalando CLAUDE.md (reglas globales SDD)"
copy_file "$SOURCE_DIR/CLAUDE.md" "$CLAUDE_DIR/CLAUDE.md"

# ── Copiar mcp.json ───────────────────────────────────────────────────────────
step "Instalando mcp.json (configuración MCP global)"

# Reemplazar ~/ por $HOME real en mcp.json antes de copiar
sed "s|~|$HOME|g" "$SOURCE_DIR/mcp.json" > "$CLAUDE_DIR/mcp.json"
success "mcp.json (rutas resueltas para $HOME)"

# ── Copiar Skills ─────────────────────────────────────────────────────────────
step "Instalando Skills globales SDD"

copy_file "$SOURCE_DIR/skills/spec-reader/SKILL.md"      "$CLAUDE_DIR/skills/spec-reader/SKILL.md"
copy_file "$SOURCE_DIR/skills/spec-implementer/SKILL.md" "$CLAUDE_DIR/skills/spec-implementer/SKILL.md"
copy_file "$SOURCE_DIR/skills/spec-validator/SKILL.md"   "$CLAUDE_DIR/skills/spec-validator/SKILL.md"

# ── Copiar spec-server ────────────────────────────────────────────────────────
step "Instalando spec-server global"

copy_file "$SOURCE_DIR/spec-server/index.js"              "$CLAUDE_DIR/spec-server/index.js"
copy_file "$SOURCE_DIR/spec-server/package.json"          "$CLAUDE_DIR/spec-server/package.json"
copy_file "$SOURCE_DIR/spec-server/handlers/get_spec.js"  "$CLAUDE_DIR/spec-server/handlers/get_spec.js"
copy_file "$SOURCE_DIR/spec-server/handlers/list_specs.js" "$CLAUDE_DIR/spec-server/handlers/list_specs.js"
copy_file "$SOURCE_DIR/spec-server/handlers/validate.js"  "$CLAUDE_DIR/spec-server/handlers/validate.js"

# ── Instalar dependencias del spec-server ─────────────────────────────────────
step "Instalando dependencias del spec-server (npm install)"

cd "$CLAUDE_DIR/spec-server"
npm install --silent
success "Dependencias instaladas"
cd "$SCRIPT_DIR"

# ── Verificación final ────────────────────────────────────────────────────────
step "Verificando instalación"

ERRORS=0

check_file() {
  if [ -f "$1" ]; then
    success "$1"
  else
    warn "Falta: $1"
    ERRORS=$((ERRORS + 1))
  fi
}

check_file "$CLAUDE_DIR/CLAUDE.md"
check_file "$CLAUDE_DIR/mcp.json"
check_file "$CLAUDE_DIR/skills/spec-reader/SKILL.md"
check_file "$CLAUDE_DIR/skills/spec-implementer/SKILL.md"
check_file "$CLAUDE_DIR/skills/spec-validator/SKILL.md"
check_file "$CLAUDE_DIR/spec-server/index.js"
check_file "$CLAUDE_DIR/spec-server/node_modules/.package-lock.json"

if [ "$ERRORS" -gt 0 ]; then
  error "$ERRORS archivo(s) faltantes. Revisa los errores anteriores."
fi

# ── Verificar que el servidor arranca ─────────────────────────────────────────
if node "$CLAUDE_DIR/spec-server/index.js" --check 2>/dev/null; then
  success "spec-server responde correctamente"
else
  warn "No se pudo verificar el spec-server automáticamente."
  info "Puedes verificarlo manualmente: node ~/.claude/spec-server/index.js"
fi

# ── Resumen ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${GREEN}║  ✓  Instalación completada exitosamente              ║${NC}"
echo -e "${BOLD}${GREEN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BOLD}Próximos pasos:${NC}"
echo ""
echo -e "  1. En cualquier proyecto nuevo, crea la carpeta de specs:"
echo -e "     ${CYAN}mkdir -p specs/[dominio]/v1${NC}"
echo ""
echo -e "  2. Escribe tu primer contrato OpenAPI:"
echo -e "     ${CYAN}specs/[dominio]/v1/openapi.yaml${NC}"
echo ""
echo -e "  3. Abre Claude Code y empieza a trabajar con SDD:"
echo -e "     ${CYAN}claude${NC}"
echo -e "     ${CYAN}> Implementa [operación] siguiendo la spec [dominio]/v1${NC}"
echo ""
echo -e "  ${YELLOW}Documentación completa: SDD-Claude-Code-Guide.docx${NC}"
echo ""
