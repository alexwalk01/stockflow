import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Producto from '@/models/Producto';

// GET /api/productos — listar todos los productos
export async function GET() {
  try {
    await connectDB();
    const productos = await Producto.find().sort({ createdAt: -1 });
    return NextResponse.json(productos);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener los productos', detalle: error.message },
      { status: 500 }
    );
  }
}

// POST /api/productos — crear un nuevo producto
export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { sku, nombre, precio, categoria } = body;

    // Validación básica de campos requeridos
    if (!sku || !nombre || precio === undefined || !categoria) {
      return NextResponse.json(
        { error: 'Los campos sku, nombre, precio y categoria son obligatorios' },
        { status: 400 }
      );
    }

    const producto = await Producto.create({ sku, nombre, precio, categoria });

    return NextResponse.json(producto, { status: 201 });
  } catch (error) {
    // Error de clave duplicada (SKU ya existe)
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
      { error: 'Error al crear el producto', detalle: error.message },
      { status: 500 }
    );
  }
}
