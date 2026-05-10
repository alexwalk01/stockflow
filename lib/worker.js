import { config } from 'dotenv';
config({ path: '.env.local' });
import { Worker } from 'bullmq';
import mongoose from 'mongoose';
import connectDB from './mongodb.js';
import redisConnection from './redis.js';
import Movimiento from '../models/Movimiento.js';
import Stock from '../models/Stock.js';

// Cargamos las variables de entorno desde .env.local
// (necesario porque el worker corre fuera del runtime de Next.js)


// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Incrementa (o crea con upsert) el stock de un producto en una sucursal.
 * Operación segura: si no existe el registro, lo crea con la cantidad.
 */
async function incrementarStock(productoId, sucursalId, cantidad) {
  await Stock.findOneAndUpdate(
    { producto: productoId, sucursal: sucursalId },
    { $inc: { cantidad } },
    { upsert: true, returnDocument: 'after' }
  );
}

/**
 * Decrementa el stock SOLO SI hay suficiente cantidad disponible.
 * Retorna el documento actualizado, o null si no había stock suficiente.
 */
async function decrementarStock(productoId, sucursalId, cantidad) {
  return Stock.findOneAndUpdate(
    {
      producto: productoId,
      sucursal: sucursalId,
      cantidad: { $gte: cantidad }, // condición atómica: solo actualiza si hay suficiente
    },
    { $inc: { cantidad: -cantidad } },
    { returnDocument: 'after' }
  );
}

// ─── Lógica de procesamiento ──────────────────────────────────────────────────

async function procesarMovimiento(movimientoId) {
  const movimiento = await Movimiento.findById(movimientoId);

  if (!movimiento) {
    throw new Error(`Movimiento ${movimientoId} no encontrado en la base de datos`);
  }

  // Si ya fue procesado o falló (ej. job duplicado), no hacemos nada
  if (movimiento.estado !== 'pending') {
    return movimiento;
  }

  const { tipo, producto, sucursalOrigen, sucursalDestino, cantidad } = movimiento;

  if (tipo === 'entrada') {
    // Entrada: suma stock en sucursalDestino
    await incrementarStock(producto, sucursalDestino, cantidad);
  } else if (tipo === 'salida') {
    // Salida: valida y resta stock en sucursalOrigen
    const resultado = await decrementarStock(producto, sucursalOrigen, cantidad);

    if (!resultado) {
      // El stock era insuficiente; lanzamos error para que BullMQ reintente / marque failed
      const stockActual = await Stock.findOne({ producto, sucursal: sucursalOrigen });
      const disponible = stockActual ? stockActual.cantidad : 0;
      throw new Error(
        `Stock insuficiente en sucursalOrigen. Disponible: ${disponible}, requerido: ${cantidad}`
      );
    }
  } else if (tipo === 'transferencia') {
    // Transferencia: resta en origen y suma en destino
    const resultado = await decrementarStock(producto, sucursalOrigen, cantidad);

    if (!resultado) {
      const stockActual = await Stock.findOne({ producto, sucursal: sucursalOrigen });
      const disponible = stockActual ? stockActual.cantidad : 0;
      throw new Error(
        `Stock insuficiente en sucursalOrigen para transferencia. Disponible: ${disponible}, requerido: ${cantidad}`
      );
    }

    try {
      await incrementarStock(producto, sucursalDestino, cantidad);
    } catch (errorDestino) {
      // Si falla incrementar destino, revertimos el decremento en origen
      console.error('[Worker] Fallo al incrementar destino, revirtiendo origen...');
      try {
        await incrementarStock(producto, sucursalOrigen, cantidad);
      } catch (errorReversion) {
        console.error('[Worker] ADVERTENCIA: No se pudo revertir el stock de origen:', errorReversion.message);
      }
      throw new Error(`Error al incrementar stock en sucursalDestino: ${errorDestino.message}`);
    }
  } else {
    throw new Error(`Tipo de movimiento desconocido: "${tipo}"`);
  }

  // Marcamos el movimiento como procesado exitosamente
  await Movimiento.findByIdAndUpdate(movimientoId, {
    estado: 'processed',
  });

  console.log(`[Worker] Movimiento ${movimientoId} procesado correctamente (tipo: ${tipo})`);
}

// ─── Worker de BullMQ ─────────────────────────────────────────────────────────

async function iniciarWorker() {
  await connectDB();
  console.log('[Worker] Conectado a MongoDB');

  const worker = new Worker(
    'movimientos',
    async (job) => {
      const { movimientoId } = job.data;
      console.log(`[Worker] Procesando job ${job.id} → movimiento ${movimientoId} (intento ${job.attemptsMade + 1})`);

      // Registramos el intento en el documento
      await Movimiento.findByIdAndUpdate(movimientoId, {
        $inc: { intentos: 1 },
      });

      await procesarMovimiento(movimientoId);
    },
    {
      connection: redisConnection,
      concurrency: 5, // procesa hasta 5 jobs en paralelo
    }
  );

  // Job completado exitosamente
  worker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} completado`);
  });

  // Job fallido (después de todos los intentos configurados)
  worker.on('failed', async (job, error) => {
    console.error(`[Worker] Job ${job.id} falló definitivamente:`, error.message);

    // Solo marcamos 'failed' si ya se agotaron todos los intentos
    if (job.attemptsMade >= job.opts.attempts) {
      try {
        await Movimiento.findByIdAndUpdate(job.data.movimientoId, {
          estado: 'failed',
          razonFallo: error.message || 'Error desconocido al procesar el movimiento',
        });
        console.log(`[Worker] Movimiento ${job.data.movimientoId} marcado como failed`);
      } catch (dbError) {
        console.error('[Worker] Error al marcar movimiento como failed:', dbError.message);
      }
    }
  });

  worker.on('error', (err) => {
    console.error('[Worker] Error interno del worker:', err.message);
  });

  console.log('[Worker] Escuchando la cola "movimientos"...');
}

// ─── Inicio ───────────────────────────────────────────────────────────────────

iniciarWorker().catch((err) => {
  console.error('[Worker] Error fatal al iniciar:', err.message);
  process.exit(1);
});
