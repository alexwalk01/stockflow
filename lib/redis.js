import Redis from 'ioredis';

/**
 * Conexión a Upstash Redis para BullMQ.
 *
 * BullMQ requiere:
 *   - maxRetriesPerRequest: null  (obligatorio, si no BullMQ lanza error)
 *   - enableReadyCheck: false     (recomendado para entornos serverless)
 *
 * UPSTASH_REDIS_URL tiene el formato:
 *   rediss://default:<TOKEN>@<HOST>:<PORT>
 *
 * ioredis lo parsea directamente desde la URL, solo necesitamos
 * sobreescribir las dos opciones que BullMQ requiere.
 */

if (!process.env.UPSTASH_REDIS_URL) {
  throw new Error(
    'Por favor define la variable de entorno UPSTASH_REDIS_URL en .env.local'
  );
}

const redisConnection = new Redis(process.env.UPSTASH_REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  tls: {
    rejectUnauthorized: false,
  },
});

redisConnection.on('error', (err) => {
  console.error('[Redis] Error de conexión:', err.message);
});

export default redisConnection;
