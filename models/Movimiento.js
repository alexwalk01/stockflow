import mongoose, { Schema } from 'mongoose';

const MovimientoSchema = new Schema(
  {
    tipo: {
      type: String,
      enum: {
        values: ['entrada', 'salida', 'transferencia'],
        message: 'El tipo debe ser entrada, salida o transferencia',
      },
      required: [true, 'El tipo de movimiento es obligatorio'],
    },
    producto: {
      type: Schema.Types.ObjectId,
      ref: 'Producto',
      required: [true, 'El producto es obligatorio'],
    },
    // Requerido en movimientos de tipo 'salida' y 'transferencia'
    sucursalOrigen: {
      type: Schema.Types.ObjectId,
      ref: 'Sucursal',
      default: null,
    },
    // Requerido en movimientos de tipo 'entrada' y 'transferencia'
    sucursalDestino: {
      type: Schema.Types.ObjectId,
      ref: 'Sucursal',
      default: null,
    },
    cantidad: {
      type: Number,
      required: [true, 'La cantidad es obligatoria'],
      min: [1, 'La cantidad debe ser al menos 1'],
    },
    estado: {
      type: String,
      enum: {
        values: ['pending', 'processed', 'failed'],
        message: 'El estado debe ser pending, processed o failed',
      },
      default: 'pending',
    },
    razonFallo: {
      type: String,
      default: null,
    },
    intentos: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Validación a nivel de documento:
 * - 'salida' y 'transferencia' requieren sucursalOrigen
 * - 'entrada' y 'transferencia' requieren sucursalDestino
 */
MovimientoSchema.pre('validate', function () {
  const tipo = this.tipo;

  if ((tipo === 'salida' || tipo === 'transferencia') && !this.sucursalOrigen) {
    this.invalidate(
      'sucursalOrigen',
      `sucursalOrigen es obligatoria para movimientos de tipo "${tipo}"`
    );
  }

  if (
    (tipo === 'entrada' || tipo === 'transferencia') &&
    !this.sucursalDestino
  ) {
    this.invalidate(
      'sucursalDestino',
      `sucursalDestino es obligatoria para movimientos de tipo "${tipo}"`
    );
  }
});

// Evita el error "Cannot overwrite model once compiled" en hot-reload de Next.js
const Movimiento =
  mongoose.models.Movimiento ||
  mongoose.model('Movimiento', MovimientoSchema);

export default Movimiento;
