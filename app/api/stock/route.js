import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Stock from '@/models/Stock';

// GET /api/stock — listar todo el stock con datos de producto y sucursal
export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = request.nextUrl;
    const sucursalId = searchParams.get('sucursal');
    const productoId = searchParams.get('producto');

    // Construimos el filtro dinámicamente según los query params recibidos
    const filtro = {};
    if (sucursalId) filtro.sucursal = sucursalId;
    if (productoId) filtro.producto = productoId;

    const stock = await Stock.find(filtro)
      .populate('producto', 'sku nombre precio categoria')
      .populate('sucursal', 'nombre ubicacion')
      .sort({ createdAt: -1 });

    return NextResponse.json(stock);
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al obtener el stock', detalle: error.message },
      { status: 500 }
    );
  }
}
