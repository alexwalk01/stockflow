import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Por favor define la variable de entorno MONGODB_URI en .env.local'
  );
}

/**
 * En desarrollo, Next.js recarga los módulos con cada cambio (hot-reload).
 * Guardar la promesa de conexión en `global` evita abrir múltiples
 * conexiones a MongoDB durante el desarrollo.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  // Si ya hay una conexión activa, la reutilizamos
  if (cached.conn) {
    return cached.conn;
  }

  // Si no hay una promesa de conexión pendiente, la creamos
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    // Si falla, limpiamos la promesa para permitir reintentos
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

export default connectDB;
