'use strict';

const path = require('path');
const fs   = require('fs');

function getSpecsDir() {
  const cwd = process.env.PWD || process.cwd();
  const local = path.join(cwd, 'specs');
  if (fs.existsSync(local)) return local;
  return null;
}

async function listSpecs() {
  const specsDir = getSpecsDir();
  const cwd = process.env.PWD || process.cwd();

  if (!specsDir) {
    return (
      `No se encontró la carpeta specs/ en: ${cwd}\n\n` +
      `Para usar SDD en este proyecto, crea la estructura:\n` +
      `  mkdir -p specs/[dominio]/v1\n` +
      `  # Luego crea: specs/[dominio]/v1/openapi.yaml`
    );
  }

  const specs = [];
  const SPEC_FILES = ['openapi.yaml', 'openapi.yml', 'schema.yaml', 'schema.yml', 'schema.json', 'openapi.json'];

  // Recorrer dominios
  const domains = fs.readdirSync(specsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .sort();

  for (const domain of domains) {
    const domainPath = path.join(specsDir, domain);
    const versions = fs.readdirSync(domainPath, { withFileTypes: true })
      .filter(v => v.isDirectory())
      .map(v => v.name)
      .sort();

    for (const version of versions) {
      const versionPath = path.join(domainPath, version);
      for (const specFile of SPEC_FILES) {
        const filePath = path.join(versionPath, specFile);
        if (fs.existsSync(filePath)) {
          const stat = fs.statSync(filePath);
          specs.push({
            domain,
            version,
            file: specFile,
            path: filePath,
            sizeKb: (stat.size / 1024).toFixed(1),
            modified: stat.mtime.toISOString().split('T')[0],
          });
          break; // solo el primer archivo encontrado por versión
        }
      }
    }
  }

  if (specs.length === 0) {
    return (
      `La carpeta specs/ existe en ${cwd} pero no contiene specs.\n\n` +
      `Estructura esperada:\n` +
      `  specs/[dominio]/[version]/openapi.yaml\n\n` +
      `Ejemplo:\n` +
      `  specs/payments/v1/openapi.yaml\n` +
      `  specs/users/v1/schema.json`
    );
  }

  const lines = [
    `Specs disponibles en: ${cwd}`,
    `${'─'.repeat(60)}`,
    '',
  ];

  for (const s of specs) {
    lines.push(`  ${s.domain}/${s.version}`);
    lines.push(`    Archivo:    ${s.file}`);
    lines.push(`    Tamaño:     ${s.sizeKb} KB`);
    lines.push(`    Modificado: ${s.modified}`);
    lines.push('');
  }

  lines.push(`Total: ${specs.length} spec(s) encontrada(s)`);
  lines.push('');
  lines.push(`Usar get_spec(name, version) para leer el contrato completo.`);

  return lines.join('\n');
}

module.exports = listSpecs;
