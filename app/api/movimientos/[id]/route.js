import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import Movimiento from '@/models/Movimiento';

// GET /api/movimientos/[id] — detalle completo de un movimiento
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    await connectDB();

    const movimiento = await Movimiento.findById(id)
      .populate('producto', 'sku nombre precio categoria')
      .populate('sucursalOrigen', 'nombre ubicacion')
      .populate('sucursalDestino', 'nombre ubicacion');

    if (!movimiento) {
      return NextResponse.json(
        { error: 'Movimiento no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(movimiento);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener el movimiento', detalle: error.message },
      { status: 500 }
    );
  }
}
