import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Queue } from 'bullmq';
import connectDB from '@/lib/mongodb';
import redisConnection from '@/lib/redis';
import Movimiento from '@/models/Movimiento';

// Instancia de la cola de BullMQ (se reutiliza entre invocaciones en el mismo proceso)
const movimientosQueue = new Queue('movimientos', {
  connection: redisConnection,
});

// GET /api/movimientos — listar movimientos con filtros opcionales
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = request.nextUrl;
    const estado = searchParams.get('estado');
    const sucursal = searchParams.get('sucursal');

    // Construimos el filtro dinámicamente
    const filtro = {};
    if (estado) filtro.estado = estado;
    if (sucursal) {
      // Filtra por sucursalOrigen O sucursalDestino
      filtro.$or = [
        { sucursalOrigen: sucursal },
        { sucursalDestino: sucursal },
      ];
    }

    const movimientos = await Movimiento.find(filtro)
      .populate('producto', 'sku nombre')
      .populate('sucursalOrigen', 'nombre')
      .populate('sucursalDestino', 'nombre')
      .sort({ createdAt: -1 })
      .limit(100); // Límite de seguridad para no saturar el cliente

    return NextResponse.json(movimientos);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener los movimientos', detalle: error.message },
      { status: 500 }
    );
  }
}

// POST /api/movimientos — crear movimiento y encolar el job async
export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { tipo, producto, sucursalOrigen, sucursalDestino, cantidad } = body;

    // --- Validaciones previas ---

    if (!tipo || !producto || !cantidad) {
      return NextResponse.json(
        { error: 'Los campos tipo, producto y cantidad son obligatorios' },
        { status: 400 }
      );
    }

    const tiposValidos = ['entrada', 'salida', 'transferencia'];
    if (!tiposValidos.includes(tipo)) {
      return NextResponse.json(
        { error: `El tipo debe ser uno de: ${tiposValidos.join(', ')}` },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(producto)) {
      return NextResponse.json(
        { error: 'El ID del producto no es válido' },
        { status: 400 }
      );
    }

    if (
      (tipo === 'salida' || tipo === 'transferencia') &&
      !sucursalOrigen
    ) {
      return NextResponse.json(
        { error: `sucursalOrigen es obligatoria para movimientos de tipo "${tipo}"` },
        { status: 400 }
      );
    }

    if (
      (tipo === 'entrada' || tipo === 'transferencia') &&
      !sucursalDestino
    ) {
      return NextResponse.json(
        { error: `sucursalDestino es obligatoria para movimientos de tipo "${tipo}"` },
        { status: 400 }
      );
    }

    if (cantidad < 1) {
      return NextResponse.json(
        { error: 'La cantidad debe ser al menos 1' },
        { status: 400 }
      );
    }

    // --- Crear el movimiento con estado 'pending' ---
    const movimiento = await Movimiento.create({
      tipo,
      producto,
      sucursalOrigen: sucursalOrigen || null,
      sucursalDestino: sucursalDestino || null,
      cantidad,
      estado: 'pending',
    });

    // --- Encolar el job en BullMQ ---
    await movimientosQueue.add(
      'procesar-movimiento',
      { movimientoId: movimiento._id.toString() },
      {
        attempts: 2,           // 1 intento inicial + 1 reintento
        backoff: {
          type: 'fixed',
          delay: 3000,         // espera 3s antes de reintentar
        },
        removeOnComplete: 100, // conserva los últimos 100 jobs completados
        removeOnFail: 200,     // conserva los últimos 200 jobs fallidos
      }
    );

    return NextResponse.json(movimiento, { status: 201 });
  } catch (error) {
    // Errores de validación del modelo Mongoose
    if (error.name === 'ValidationError') {
      const mensajes = Object.values(error.errors).map((e) => e.message);
      return NextResponse.json(
        { error: 'Error de validación', detalle: mensajes },
        { status: 400 }
      );
    }

    console.error('ERROR MOVIMIENTO:', error);
    return NextResponse.json(
      { error: 'Error al crear el movimiento', detalle: error.message },
      { status: 500 }
    );
  }
}
