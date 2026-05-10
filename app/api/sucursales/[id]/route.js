import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import Sucursal from '@/models/Sucursal';

// Helper para validar si un ID tiene formato válido de MongoDB ObjectId
function esIdValido(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// GET /api/sucursales/[id] — obtener una sucursal por ID
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    if (!esIdValido(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    await connectDB();
    const sucursal = await Sucursal.findById(id);

    if (!sucursal) {
      return NextResponse.json(
        { error: 'Sucursal no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(sucursal);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener la sucursal', detalle: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/sucursales/[id] — actualizar una sucursal
export async function PUT(request, { params }) {
  try {
    const { id } = await params;

    if (!esIdValido(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    await connectDB();

    const body = await request.json();
    const { nombre, ubicacion } = body;

    // Construimos solo los campos que vienen en el body
    const campos = {};
    if (nombre !== undefined) campos.nombre = nombre;
    if (ubicacion !== undefined) campos.ubicacion = ubicacion;

    if (Object.keys(campos).length === 0) {
      return NextResponse.json(
        { error: 'No se proporcionaron campos para actualizar' },
        { status: 400 }
      );
    }

    const sucursal = await Sucursal.findByIdAndUpdate(
      id,
      { $set: campos },
      { new: true, runValidators: true }
    );

    if (!sucursal) {
      return NextResponse.json(
        { error: 'Sucursal no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(sucursal);
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
      { error: 'Error al actualizar la sucursal', detalle: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/sucursales/[id] — eliminar una sucursal
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    if (!esIdValido(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    await connectDB();
    const sucursal = await Sucursal.findByIdAndDelete(id);

    if (!sucursal) {
      return NextResponse.json(
        { error: 'Sucursal no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ mensaje: 'Sucursal eliminada correctamente' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al eliminar la sucursal', detalle: error.message },
      { status: 500 }
    );
  }
}
