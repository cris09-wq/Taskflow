#!/usr/bin/env node
/**
 * TASKFLOW - Carga masiva de prueba (ARCHIVO TEMPORAL).
 *
 * Genera N solicitudes por el flujo COMPLETO de la aplicación
 * (POST /api/solicitudes -> MongoDB -> cola Redis -> Worker -> respuesta)
 * para verificar que el sistema soporta la carga sin caerse.
 *
 * Solo depende de `fetch` nativo (Node 18+). No agrega dependencias ni
 * modifica package.json, docker-compose.yml, .env, la API ni el Worker.
 *
 * Para eliminar la prueba, borra únicamente este archivo.
 *
 * Uso:
 *   node loadtest.js                              # 1000 solicitudes, concurrencia 10
 *   node loadtest.js 500                          # 500 solicitudes
 *   node loadtest.js 1000 --concurrency 20        # 1000 con 20 POSTs simultáneos
 *   node loadtest.js 1000 --verify                # ...y espera que el Worker termine
 *   node loadtest.js 1000 --base-url http://localhost:4000/api
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:4000/api';

const CATEGORIAS = ['informacion', 'soporte', 'documento', 'consulta', 'actualizacion'];
const PRIORIDADES = ['baja', 'media', 'alta'];

// Proporción de solicitudes que deben terminar en estado ERROR (HU-11).
const FORZAR_ERROR_RATIO = 0.05;

function parseArgs(argv) {
  const config = { n: 1000, concurrency: 10, verify: false, baseUrl: BASE_URL };
  const args = argv.slice(2);

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--verify') {
      config.verify = true;
    } else if (a === '--concurrency' && args[i + 1]) {
      config.concurrency = Number(args[++i]);
    } else if (a === '--base-url' && args[i + 1]) {
      config.baseUrl = args[++i];
    } else if (!Number.isNaN(Number(a))) {
      config.n = Number(a);
    }
  }

  return config;
}

function crearPayload(i) {
  const categoria = CATEGORIAS[i % CATEGORIAS.length];
  const prioridad = PRIORIDADES[i % PRIORIDADES.length];
  const forzarError = Math.random() < FORZAR_ERROR_RATIO;
  const descripcion = forzarError
    ? `Descripción de carga #${i + 1} forzar-error.`
    : `Descripción de carga #${i + 1} generada para probar capacidad del sistema.`;

  return {
    titulo: `Solicitud de carga #${i + 1}`,
    descripcion,
    categoria,
    prioridad
  };
}

async function ejecutar(config) {
  const t0 = Date.now();
  let exitos = 0;
  let fallos = 0;
  let forzarError = 0;
  let totalLatencia = 0;
  let indice = 0;
  const errores = [];

  async function worker() {
    while (indice < config.n) {
      const i = indice++;
      const payload = crearPayload(i);
      if (payload.descripcion.includes('forzar-error')) forzarError++;

      const inicio = Date.now();
      try {
        const res = await fetch(`${config.baseUrl}/solicitudes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        totalLatencia += Date.now() - inicio;

        if (res.status === 201) {
          exitos++;
        } else {
          fallos++;
          const body = await res.text();
          errores.push(`[#${i + 1}] HTTP ${res.status}: ${body.slice(0, 200)}`);
        }
      } catch (err) {
        fallos++;
        totalLatencia += Date.now() - inicio;
        errores.push(`[#${i + 1}] ${err.message}`);
      }
    }
  }

  const nWorkers = Math.min(config.concurrency, config.n);
  await Promise.all(Array.from({ length: nWorkers }, () => worker()));

  const segundos = (Date.now() - t0) / 1000;
  const totalIntentos = exitos + fallos;
  const latenciaProm = totalIntentos > 0 ? (totalLatencia / totalIntentos).toFixed(0) : '0';

  console.log('\n=== RESUMEN DE CARGA ===');
  console.log(`Solicitudes enviadas : ${config.n}`);
  console.log(`Creadas (201)        : ${exitos}`);
  console.log(`Fallidas             : ${fallos}`);
  console.log(`Con forzar-error     : ${forzarError}`);
  console.log(`Latencia promedio    : ${latenciaProm} ms`);
  console.log(`Tiempo total         : ${segundos.toFixed(2)} s`);

  if (errores.length > 0) {
    console.log('\nPrimeros errores:');
    errores.slice(0, 20).forEach((e) => console.log('  ' + e));
  }

  return { exitos, fallos, forzarError };
}

async function verificar(config, forzarError) {
  console.log('\n=== VERIFICACIÓN (esperando que el Worker drene la cola) ===');

  const inicio = Date.now();
  let ultimo = null;

  while (true) {
    try {
      const monitor = await (await fetch(`${config.baseUrl}/monitor`)).json();
      const stats = await (await fetch(`${config.baseUrl}/solicitudes/estadisticas/resumen`)).json();

      const s = stats.datos || {};
      const m = monitor.datos || {};
      const pendientes = (s.EN_COLA || 0) + (s.PROCESANDO || 0);
      const total = s.total || 0;

      const linea =
        `total=${total} RESPONDIDA=${s.RESPONDIDA} ERROR=${s.ERROR} ` +
        `EN_COLA=${s.EN_COLA} PROCESANDO=${s.PROCESANDO} | ` +
        `waiting=${m.cola?.waiting} active=${m.cola?.active} | ` +
        `worker=${m.servicios?.worker} mongo=${m.servicios?.mongodb} redis=${m.servicios?.redis}`;

      if (linea !== ultimo) {
        const min = ((Date.now() - inicio) / 60000).toFixed(1);
        console.log(`[${min} min] ${linea}`);
        ultimo = linea;
      }

      if (total >= config.n && pendientes === 0) {
        console.log('\n=== COL. listo: todos los estados terminales alcanzados ===');
        console.log(`RESPONDIDA=${s.RESPONDIDA}, ERROR=${s.ERROR} (esperados forzar-error=${forzarError})`);
        return;
      }
    } catch (err) {
      console.log('Error consultando el monitor (reintentando):', err.message);
    }

    await new Promise((r) => setTimeout(r, 3000));
  }
}

(async () => {
  const config = parseArgs(process.argv);

  console.log('=== TASKFLOW LOAD TEST (archivo temporal de prueba) ===');
  console.log(`Endpoint    : ${config.baseUrl}/solicitudes`);
  console.log(`Cantidad    : ${config.n}`);
  console.log(`Concurrencia: ${config.concurrency}`);

  const res = await ejecutar(config);

  if (config.verify) {
    await verificar(config, res.forzarError);
  } else {
    console.log('\nSugerencia: vuelve a ejecutar con --verify para esperar');
    console.log('a que el Worker termine de procesar toda la cola.');
  }
})();
