import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import Producto from '@/models/Producto';

// Helper para validar si un ID tiene formato válido de MongoDB ObjectId
function esIdValido(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// GET /api/productos/[id] — obtener un producto por ID
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    if (!esIdValido(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    await connectDB();
    const producto = await Producto.findById(id);

    if (!producto) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(producto);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener el producto', detalle: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/productos/[id] — actualizar un producto
export async function PUT(request, { params }) {
  try {
    const { id } = await params;

    if (!esIdValido(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    await connectDB();

    const body = await request.json();
    const { sku, nombre, precio, categoria } = body;

    // Construimos solo los campos que vienen en el body
    const campos = {};
    if (sku !== undefined) campos.sku = sku;
    if (nombre !== undefined) campos.nombre = nombre;
    if (precio !== undefined) campos.precio = precio;
    if (categoria !== undefined) campos.categoria = categoria;

    if (Object.keys(campos).length === 0) {
      return NextResponse.json(
        { error: 'No se proporcionaron campos para actualizar' },
        { status: 400 }
      );
    }

    const producto = await Producto.findByIdAndUpdate(
      id,
      { $set: campos },
      { new: true, runValidators: true }
    );

    if (!producto) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(producto);
  } catch (error) {
    // Error de clave duplicada (SKU ya existe en otro documento)
    if (error.code === 11000) {
      return NextResponse.json(
        { error: `El SKU "${error.keyValue?.sku}" ya está registrado` },
        { status: 409 }
      );
    }

    // Errores de validación de Mongoose
    if (error.name === 'ValidationError') {
      const mensajes = Object.values(error.errors).map((e) => e.message);
      return NextResponse.json(
        { error: 'Error de validación', detalle: mensajes },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al actualizar el producto', detalle: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/productos/[id] — eliminar un producto
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    if (!esIdValido(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    await connectDB();
    const producto = await Producto.findByIdAndDelete(id);

    if (!producto) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ mensaje: 'Producto eliminado correctamente' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al eliminar el producto', detalle: error.message },
      { status: 500 }
    );
  }
}
