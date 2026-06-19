'use strict';

const path = require('path');
const fs   = require('fs');
const yaml = require('js-yaml');
const Ajv  = require('ajv');
const addFormats = require('ajv-formats');

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

function getSpecsDir() {
  const cwd = process.env.PWD || process.cwd();
  const local = path.join(cwd, 'specs');
  if (fs.existsSync(local)) return local;
  throw new Error(`No se encontró specs/ en: ${cwd}`);
}

function findSpecFile(specsDir, name, version) {
  const base = path.join(specsDir, name, version);
  const candidates = [
    path.join(base, 'openapi.yaml'),
    path.join(base, 'openapi.yml'),
    path.join(base, 'schema.yaml'),
    path.join(base, 'schema.yml'),
    path.join(base, 'schema.json'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error(`Spec no encontrada: ${name}/${version}`);
}

function parseSpec(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return filePath.endsWith('.json') ? JSON.parse(content) : yaml.load(content);
}

// Extraer un schema específico de una spec OpenAPI
function extractSchema(spec, schemaRef) {
  // Buscar en components.schemas (OpenAPI 3.x)
  if (spec.components?.schemas?.[schemaRef]) {
    return resolveRefs(spec.components.schemas[schemaRef], spec);
  }
  // Buscar en definitions (JSON Schema / OpenAPI 2.x)
  if (spec.definitions?.[schemaRef]) {
    return resolveRefs(spec.definitions[schemaRef], spec);
  }
  return null;
}

// Resolución simple de $ref internos
function resolveRefs(schema, rootSpec) {
  if (typeof schema !== 'object' || schema === null) return schema;
  if (schema.$ref) {
    const refPath = schema.$ref.replace('#/', '').split('/');
    let resolved = rootSpec;
    for (const segment of refPath) {
      resolved = resolved?.[segment];
    }
    return resolveRefs(resolved, rootSpec);
  }
  const result = {};
  for (const [key, value] of Object.entries(schema)) {
    if (Array.isArray(value)) {
      result[key] = value.map(item => resolveRefs(item, rootSpec));
    } else if (typeof value === 'object' && value !== null) {
      result[key] = resolveRefs(value, rootSpec);
    } else {
      result[key] = value;
    }
  }
  return result;
}

async function validateAgainstSpec(name, version = 'v1', schemaRef, payload) {
  const specsDir = getSpecsDir();
  const filePath = findSpecFile(specsDir, name, version);
  const spec     = parseSpec(filePath);

  const schema = extractSchema(spec, schemaRef);

  if (!schema) {
    const available = Object.keys(spec.components?.schemas || spec.definitions || {}).join(', ') || 'ninguno';
    return (
      `Schema "${schemaRef}" no encontrado en ${name}/${version}.\n` +
      `Schemas disponibles: ${available}`
    );
  }

  let validate;
  try {
    validate = ajv.compile(schema);
  } catch (err) {
    return `Error compilando el schema "${schemaRef}": ${err.message}`;
  }

  const valid = validate(payload);

  if (valid) {
    return (
      `✓ Payload válido contra ${name}/${version} → ${schemaRef}\n\n` +
      `Payload validado:\n${JSON.stringify(payload, null, 2)}`
    );
  }

  const errors = validate.errors.map((err, i) => {
    return [
      `ERROR #${i + 1}`,
      `  Campo:    ${err.instancePath || '(raíz)'}`,
      `  Problema: ${err.message}`,
      `  Regla:    ${err.keyword}`,
      err.params ? `  Detalle:  ${JSON.stringify(err.params)}` : '',
    ].filter(Boolean).join('\n');
  });

  return [
    `✗ Payload inválido contra ${name}/${version} → ${schemaRef}`,
    `  ${validate.errors.length} error(es) encontrado(s):`,
    '',
    ...errors,
    '',
    `Payload validado:\n${JSON.stringify(payload, null, 2)}`,
  ].join('\n');
}

module.exports = { validateAgainstSpec };
