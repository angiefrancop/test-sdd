#!/usr/bin/env node
/**
 * SDD Spec Server — MCP server global para Claude Code
 * Detecta automáticamente specs/ en el directorio de trabajo actual (PWD).
 *
 * Herramientas expuestas:
 *   - list_specs()                              → lista specs del proyecto actual
 *   - get_spec(name, version)                  → retorna el contrato completo
 *   - validate_against_spec(name, ver, payload)→ valida un objeto contra la spec
 *   - get_examples(name, version, operation)   → retorna ejemplos de la spec
 */

'use strict';

const readline = require('readline');
const getSpec     = require('./handlers/get_spec');
const listSpecs   = require('./handlers/list_specs');
const validate    = require('./handlers/validate');

// ── Modo verificación (usado por install.sh) ──────────────────────────────────
if (process.argv.includes('--check')) {
  console.log('spec-server OK');
  process.exit(0);
}

// ── Definición de herramientas MCP ────────────────────────────────────────────
const TOOLS = [
  {
    name: 'list_specs',
    description: 'Lista todas las specs disponibles en el directorio specs/ del proyecto actual.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_spec',
    description: 'Retorna el contenido completo de una spec (OpenAPI YAML o JSON Schema).',
    inputSchema: {
      type: 'object',
      properties: {
        name:    { type: 'string', description: 'Nombre del dominio (ej: payments, users)' },
        version: { type: 'string', description: 'Versión de la spec (ej: v1, v2). Default: v1', default: 'v1' },
      },
      required: ['name'],
    },
  },
  {
    name: 'validate_against_spec',
    description: 'Valida un objeto JSON contra el schema de una spec. Retorna errores de validación o confirmación de conformidad.',
    inputSchema: {
      type: 'object',
      properties: {
        name:      { type: 'string', description: 'Nombre del dominio' },
        version:   { type: 'string', description: 'Versión de la spec', default: 'v1' },
        schemaRef: { type: 'string', description: 'Nombre del schema a validar (ej: CreateTransactionRequest)' },
        payload:   { type: 'object', description: 'Objeto a validar contra el schema' },
      },
      required: ['name', 'schemaRef', 'payload'],
    },
  },
  {
    name: 'get_examples',
    description: 'Retorna ejemplos de request/response de una operación específica de la spec.',
    inputSchema: {
      type: 'object',
      properties: {
        name:      { type: 'string', description: 'Nombre del dominio' },
        version:   { type: 'string', description: 'Versión de la spec', default: 'v1' },
        operation: { type: 'string', description: 'operationId de la operación (ej: createTransaction)' },
      },
      required: ['name', 'operation'],
    },
  },
];

// ── Dispatcher de herramientas ────────────────────────────────────────────────
async function callTool(name, args) {
  switch (name) {
    case 'list_specs':
      return await listSpecs();
    case 'get_spec':
      return await getSpec.getSpec(args.name, args.version || 'v1');
    case 'validate_against_spec':
      return await validate.validateAgainstSpec(args.name, args.version || 'v1', args.schemaRef, args.payload);
    case 'get_examples':
      return await getSpec.getExamples(args.name, args.version || 'v1', args.operation);
    default:
      throw new Error(`Herramienta desconocida: ${name}`);
  }
}

// ── Protocolo MCP (JSON-RPC sobre stdio) ──────────────────────────────────────
const rl = readline.createInterface({ input: process.stdin, terminal: false });

function send(obj) {
  process.stdout.write(JSON.stringify(obj) + '\n');
}

rl.on('line', async (line) => {
  let msg;
  try {
    msg = JSON.parse(line.trim());
  } catch {
    return; // ignorar líneas no-JSON
  }

  const { id, method, params } = msg;

  try {
    if (method === 'initialize') {
      send({
        jsonrpc: '2.0', id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: 'sdd-spec-server', version: '1.0.0' },
        },
      });

    } else if (method === 'tools/list') {
      send({ jsonrpc: '2.0', id, result: { tools: TOOLS } });

    } else if (method === 'tools/call') {
      const result = await callTool(params.name, params.arguments || {});
      send({
        jsonrpc: '2.0', id,
        result: {
          content: [{ type: 'text', text: typeof result === 'string' ? result : JSON.stringify(result, null, 2) }],
        },
      });

    } else if (method === 'notifications/initialized') {
      // no-op

    } else {
      send({ jsonrpc: '2.0', id, error: { code: -32601, message: `Método no soportado: ${method}` } });
    }
  } catch (err) {
    send({
      jsonrpc: '2.0', id,
      error: { code: -32000, message: err.message },
    });
  }
});
