#!/usr/bin/env node
/**
 * Genera src/environments/env.generated.ts a partir de variables de entorno.
 *
 * Las credenciales reales (claves de Supabase, dominio publico, cuentas demo)
 * viven en el panel del proveedor de hosting (Render) o en un archivo .env.local
 * que no se versiona. El repositorio solo contiene este generador y el ejemplo
 * .env.example, por lo que ninguna credencial queda publicada en Git.
 *
 * Uso:
 *   node tools/generate-env.mjs
 *
 * Se ejecuta automaticamente antes de build, start y test (ver package.json).
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const target = resolve(root, 'src/environments/env.generated.ts');

/** Lee .env.local (si existe) sin sobrescribir variables ya definidas. */
function loadLocalEnv(file) {
  if (!existsSync(file)) return;
  const content = readFileSync(file, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadLocalEnv(resolve(root, '.env.local'));
loadLocalEnv(resolve(root, '.env'));

const read = (name, fallback = '') => (process.env[name] ?? fallback).trim();

const supabaseUrl = read('SUPABASE_URL');
const supabaseAnonKey = read('SUPABASE_ANON_KEY');
const siteUrl = read('SITE_URL', 'https://donpepito.pe').replace(/\/+$/, '');
const useDemoFallback = read('USE_DEMO_FALLBACK', 'true').toLowerCase() !== 'false';

const demo = {
  adminEmail: read('DEMO_ADMIN_EMAIL', 'admin@donpepito.pe'),
  adminPassword: read('DEMO_ADMIN_PASSWORD', 'admin123'),
  clientEmail: read('DEMO_CLIENT_EMAIL', 'cliente@demo.pe'),
  clientPassword: read('DEMO_CLIENT_PASSWORD', 'demo1234'),
};

if (Boolean(supabaseUrl) !== Boolean(supabaseAnonKey)) {
  console.warn(
    '[generate-env] Aviso: SUPABASE_URL y SUPABASE_ANON_KEY deben definirse juntas. ' +
      'Se ignoraran ambas y la app usara el modo demo.',
  );
}

const credentialsReady = Boolean(supabaseUrl && supabaseAnonKey);
if (!credentialsReady) {
  console.log(
    '[generate-env] Sin credenciales de Supabase en el entorno: se compila en modo demo ' +
      '(sin claves en el bundle).',
  );
}

const literal = (value) => JSON.stringify(value);

const output = `// ARCHIVO GENERADO AUTOMATICAMENTE POR tools/generate-env.mjs
// No editar a mano y no versionar: se reconstruye en cada build a partir de
// las variables de entorno del servicio (Render, Vercel o .env.local).
// Ultima generacion: ${new Date().toISOString()}

export const generatedEnv = {
  supabaseUrl: ${literal(credentialsReady ? supabaseUrl : '')},
  supabaseAnonKey: ${literal(credentialsReady ? supabaseAnonKey : '')},
  siteUrl: ${literal(siteUrl)},
  useDemoFallback: ${useDemoFallback},
  demo: {
    adminEmail: ${literal(demo.adminEmail)},
    adminPassword: ${literal(demo.adminPassword)},
    clientEmail: ${literal(demo.clientEmail)},
    clientPassword: ${literal(demo.clientPassword)},
  },
} as const;
`;

writeFileSync(target, output, 'utf8');
console.log(
  `[generate-env] ${target.replace(root + '\\', '').replace(root + '/', '')} ` +
    `(supabase=${credentialsReady ? 'configurado' : 'no configurado'}, ` +
    `demo=${useDemoFallback}, siteUrl=${siteUrl})`,
);
