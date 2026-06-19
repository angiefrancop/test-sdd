'use strict';

const path = require('path');
const fs   = require('fs');
const yaml = require('js-yaml');

// ── Resolver directorio de specs del proyecto actual ─────────────────────────
function getSpecsDir() {
  const cwd = process.env.PWD || process.cwd();
  const local = path.join(cwd, 'specs');
  if (fs.existsSync(local)) return local;
  throw new Error(
    `No se encontró la carpeta specs/ en el directorio actual: ${cwd}\n` +
    `Crea la carpeta con: mkdir -p specs/[dominio]/v1`
  );
}

// ── Buscar el archivo de spec (soporta .yaml, .yml, .json) ───────────────────
function findSpecFile(specsDir, name, version) {
  const base = path.join(specsDir, name, version);
  const candidates = [
    path.join(base, 'openapi.yaml'),
    path.join(base, 'openapi.yml'),
    path.join(base, 'schema.yaml'),
    path.join(base, 'schema.yml'),
    path.join(base, 'schema.json'),
    path.join(base, 'openapi.json'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  const availableVersions = fs.existsSync(path.join(specsDir, name))
    ? fs.readdirSync(path.join(specsDir, name)).join(', ')
    : 'ninguna';

  throw new Error(
    `Spec no encontrada: ${name}/${version}\n` +
    `Versiones disponibles para "${name}": ${availableVersions}\n` +
    `Ruta buscada: ${base}/[openapi|schema].[yaml|yml|json]`
  );
}

// ── Parsear el archivo de spec ────────────────────────────────────────────────
function parseSpec(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  if (filePath.endsWith('.json')) {
    return JSON.parse(content);
  }
  return yaml.load(content);
}

// ── get_spec ──────────────────────────────────────────────────────────────────
async function getSpec(name, version = 'v1') {
  const specsDir  = getSpecsDir();
  const filePath  = findSpecFile(specsDir, name, version);
  const content   = fs.readFileSync(filePath, 'utf8');

  return [
    `# Spec: ${name}/${version}`,
    `# Archivo: ${filePath}`,
    `# Proyecto: ${process.env.PWD || process.cwd()}`,
    '',
    content,
  ].join('\n');
}

// ── get_examples ──────────────────────────────────────────────────────────────
async function getExamples(name, version = 'v1', operationId) {
  const specsDir = getSpecsDir();
  const filePath = findSpecFile(specsDir, name, version);
  const spec     = parseSpec(filePath);

  const examples = [];

  // Buscar la operación en los paths de OpenAPI
  if (spec.paths) {
    for (const [pathKey, pathItem] of Object.entries(spec.paths)) {
      for (const [method, operation] of Object.entries(pathItem)) {
        if (typeof operation !== 'object' || operation.operationId !== operationId) continue;

        examples.push(`## Operación: ${operationId}`);
        examples.push(`## ${method.toUpperCase()} ${pathKey}`);
        examples.push('');

        // Ejemplos de request
        if (operation.requestBody?.content) {
          examples.push('### Request Body');
          for (const [mediaType, mediaObj] of Object.entries(operation.requestBody.content)) {
            examples.push(`Content-Type: ${mediaType}`);
            if (mediaObj.example) {
              examples.push('```json');
              examples.push(JSON.stringify(mediaObj.example, null, 2));
              examples.push('```');
            } else if (mediaObj.examples) {
              for (const [exName, ex] of Object.entries(mediaObj.examples)) {
                examples.push(`Ejemplo "${exName}":`);
                examples.push('```json');
                examples.push(JSON.stringify(ex.value, null, 2));
                examples.push('```');
              }
            }
          }
          examples.push('');
        }

        // Ejemplos de response
        if (operation.responses) {
          examples.push('### Responses');
          for (const [statusCode, response] of Object.entries(operation.responses)) {
            examples.push(`#### ${statusCode}: ${response.description || ''}`);
            if (response.content) {
              for (const [, mediaObj] of Object.entries(response.content)) {
                if (mediaObj.example) {
                  examples.push('```json');
                  examples.push(JSON.stringify(mediaObj.example, null, 2));
                  examples.push('```');
                }
              }
            }
          }
        }
      }
    }
  }

  if (examples.length === 0) {
    return `No se encontraron ejemplos para la operación "${operationId}" en ${name}/${version}.\n` +
           `Agrega ejemplos en la spec bajo paths.[path].[method].requestBody.content.[type].example`;
  }

  return examples.join('\n');
}

module.exports = { getSpec, getExamples };
