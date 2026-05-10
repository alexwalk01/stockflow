import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Sucursal from '@/models/Sucursal';

// GET /api/sucursales — listar todas las sucursales
export async function GET() {
  try {
    await connectDB();
    const sucursales = await Sucursal.find().sort({ createdAt: -1 });
    return NextResponse.json(sucursales);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener las sucursales', detalle: error.message },
      { status: 500 }
    );
  }
}

// POST /api/sucursales — crear una nueva sucursal
export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { nombre, ubicacion } = body;

    // Validación básica de campos requeridos
    if (!nombre || !ubicacion) {
      return NextResponse.json(
        { error: 'Los campos nombre y ubicacion son obligatorios' },
        { status: 400 }
      );
    }

    const sucursal = await Sucursal.create({ nombre, ubicacion });

    return NextResponse.json(sucursal, { status: 201 });
  } catch (error) {
    // Errores de validación de Mongoose
    if (error.name === 'ValidationError') {
      const mensajes = Object.values(error.errors).map((e) => e.message);
      return NextResponse.json(
        { error: 'Error de validación', detalle: mensajes },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al crear la sucursal', detalle: error.message },
      { status: 500 }
    );
  }
}
