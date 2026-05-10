import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Movimiento from '@/models/Movimiento';

/**
 * GET /api/reportes?desde=FECHA&hasta=FECHA
 *
 * Retorna un resumen de movimientos en el rango de fechas indicado:
 *   - Total de movimientos por tipo (entrada, salida, transferencia)
 *   - Total de movimientos por sucursal (origen o destino)
 *   - Solo considera movimientos con estado 'processed'
 *
 * Ejemplo: /api/reportes?desde=2024-01-01&hasta=2024-01-31
 */
export async function GET(request) {
  try {
    const { searchParams } = request.nextUrl;
    const desde = searchParams.get('desde');
    const hasta = searchParams.get('hasta');

    // Ambos parámetros son obligatorios
    if (!desde || !hasta) {
      return NextResponse.json(
        { error: 'Los parámetros desde y hasta son obligatorios (formato: YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    const fechaDesde = new Date(desde);
    const fechaHasta = new Date(hasta);

    // Validamos que sean fechas reales
    if (isNaN(fechaDesde.getTime()) || isNaN(fechaHasta.getTime())) {
      return NextResponse.json(
        { error: 'Las fechas no tienen un formato válido. Usa YYYY-MM-DD' },
        { status: 400 }
      );
    }

    if (fechaDesde > fechaHasta) {
      return NextResponse.json(
        { error: 'La fecha "desde" no puede ser mayor que la fecha "hasta"' },
        { status: 400 }
      );
    }

    // Ajustamos "hasta" al final del día (23:59:59.999) para incluir todo ese día
    fechaHasta.setUTCHours(23, 59, 59, 999);

    await connectDB();

    // --- Agrupación por tipo ---
    const porTipo = await Movimiento.aggregate([
      {
        $match: {
          estado: 'processed',
          createdAt: { $gte: fechaDesde, $lte: fechaHasta },
        },
      },
      {
        $group: {
          _id: '$tipo',
          total: { $sum: 1 },
          cantidadTotal: { $sum: '$cantidad' },
        },
      },
      {
        $project: {
          _id: 0,
          tipo: '$_id',
          total: 1,
          cantidadTotal: 1,
        },
      },
      { $sort: { tipo: 1 } },
    ]);

    // --- Agrupación por sucursal ---
    // Un movimiento puede involucrar hasta 2 sucursales (transferencia),
    // así que lo "descomponemos" en entradas individuales por sucursal
    const porSucursal = await Movimiento.aggregate([
      {
        $match: {
          estado: 'processed',
          createdAt: { $gte: fechaDesde, $lte: fechaHasta },
        },
      },
      // Creamos un array con las sucursales involucradas en cada movimiento
      {
        $project: {
          tipo: 1,
          cantidad: 1,
          sucursales: {
            $filter: {
              input: ['$sucursalOrigen', '$sucursalDestino'],
              as: 'suc',
              cond: { $ne: ['$$suc', null] },
            },
          },
        },
      },
      // Desenrollamos para tener un documento por sucursal involucrada
      { $unwind: '$sucursales' },
      {
        $group: {
          _id: '$sucursales',
          totalMovimientos: { $sum: 1 },
        },
      },
      // Hacemos join con la colección de sucursales para obtener el nombre
      {
        $lookup: {
          from: 'sucursals',
          localField: '_id',
          foreignField: '_id',
          as: 'sucursalInfo',
        },
      },
      { $unwind: '$sucursalInfo' },
      {
        $project: {
          _id: 0,
          sucursalId: '$_id',
          nombre: '$sucursalInfo.nombre',
          ubicacion: '$sucursalInfo.ubicacion',
          totalMovimientos: 1,
        },
      },
      { $sort: { totalMovimientos: -1 } },
    ]);

    return NextResponse.json({
      rango: {
        desde: fechaDesde.toISOString(),
        hasta: fechaHasta.toISOString(),
      },
      porTipo,
      porSucursal,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error al generar el reporte', detalle: error.message },
      { status: 500 }
    );
  }
}
