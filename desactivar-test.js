#!/usr/bin/env node
/**
 * TASKFLOW - Desactivación masiva de prueba (ARCHIVO TEMPORAL).
 *
 * Desactiva N solicitudes activas a través del flujo de la API
 * (PATCH /api/solicitudes/:id/desactivar). No borra ningún documento:
 * solo pone `activa = false`, por lo que dejan de aparecer en el listado
 * y en las estadísticas, pero siguen existiendo en MongoDB.
 *
 * Solo depende de `fetch` nativo (Node 18+). No agrega dependencias ni
 * modifica package.json, docker-compose.yml, .env, la API ni el Worker.
 *
 * Para eliminar la prueba, borra únicamente este archivo.
 *
 * Uso:
 *   node desactivar-test.js                             # desactiva TODAS las activas
 *   node desactivar-test.js 50                          # desactiva 50 (las más recientes)
 *   node desactivar-test.js 100 --titulo "^Solicitud de carga"
 *   node desactivar-test.js 50 --concurrency 20 --base-url http://localhost:4000/api
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:4000/api';

function parseArgs(argv) {
  const config = {
    n: null, // null = todas las activas
    concurrency: 10,
    titulo: null,
    baseUrl: BASE_URL
  };

  const args = argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--concurrency' && args[i + 1]) {
      config.concurrency = Number(args[++i]);
    } else if (a === '--titulo' && args[i + 1]) {
      config.titulo = args[++i];
    } else if (a === '--base-url' && args[i + 1]) {
      config.baseUrl = args[++i];
    } else if (!Number.isNaN(Number(a))) {
      config.n = Number(a);
    }
  }

  return config;
}

async function listarActivas(config) {
  const res = await fetch(`${config.baseUrl}/solicitudes`, { method: 'GET' });
  if (!res.ok) {
    throw new Error(`GET /solicitudes respondió HTTP ${res.status}`);
  }
  const body = await res.json();
  return body.datos || [];
}

async function main() {
  const config = parseArgs(process.argv);

  console.log('=== TASKFLOW DESACTIVAR (archivo temporal de prueba) ===');
  console.log(`Endpoint    : ${config.baseUrl}/solicitudes`);
  console.log(`Cantidad    : ${config.n === null ? 'TODAS las activas' : config.n}`);
  console.log(`Filtro      : ${config.titulo ? config.titulo : '(ninguno)'}`);
  console.log(`Concurrencia: ${config.concurrency}`);

  const activas = await listarActivas(config);

  let seleccionadas = activas;
  if (config.titulo) {
    const regex = new RegExp(config.titulo, 'i');
    seleccionadas = activas.filter((s) => regex.test(s.titulo));
  }
  if (config.n !== null) {
    seleccionadas = seleccionadas.slice(0, config.n);
  }

  console.log(`\nActivas en el sistema : ${activas.length}`);
  console.log(`Se van a desactivar   : ${seleccionadas.length}`);

  if (seleccionadas.length === 0) {
    console.log('\nNo hay solicitudes que coincidan. Nada que hacer.');
    return;
  }

  const t0 = Date.now();
  let exitos = 0;
  let fallos = 0;
  let indice = 0;
  const errores = [];

  async function worker() {
    while (indice < seleccionadas.length) {
      const i = indice++;
      const id = seleccionadas[i]._id;
      try {
        const res = await fetch(`${config.baseUrl}/solicitudes/${id}/desactivar`, {
          method: 'PATCH'
        });
        if (res.ok) {
          exitos++;
        } else {
          fallos++;
          const body = await res.text();
          errores.push(`[${seleccionadas[i].titulo}] HTTP ${res.status}: ${body.slice(0, 200)}`);
        }
      } catch (err) {
        fallos++;
        errores.push(`[${seleccionadas[i].titulo}] ${err.message}`);
      }
    }
  }

  const nWorkers = Math.min(config.concurrency, seleccionadas.length);
  await Promise.all(Array.from({ length: nWorkers }, () => worker()));

  const segundos = (Date.now() - t0) / 1000;

  console.log('\n=== RESUMEN DE DESACTIVACIÓN ===');
  console.log(`Desactivadas : ${exitos}`);
  console.log(`Fallidas     : ${fallos}`);
  console.log(`Tiempo total : ${segundos.toFixed(2)} s`);

  if (errores.length > 0) {
    console.log('\nPrimeros errores:');
    errores.slice(0, 20).forEach((e) => console.log('  ' + e));
  }
}

main().catch((err) => {
  console.error('Error fatal:', err.message);
  process.exit(1);
});
