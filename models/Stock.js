import mongoose, { Schema } from 'mongoose';

const StockSchema = new Schema(
  {
    producto: {
      type: Schema.Types.ObjectId,
      ref: 'Producto',
      required: [true, 'El producto es obligatorio'],
    },
    sucursal: {
      type: Schema.Types.ObjectId,
      ref: 'Sucursal',
      required: [true, 'La sucursal es obligatoria'],
    },
    cantidad: {
      type: Number,
      default: 0,
      min: [0, 'La cantidad no puede ser negativa'],
    },
  },
  {
    timestamps: true,
  }
);

// Índice compuesto: un producto solo puede tener un registro de stock por sucursal
StockSchema.index({ producto: 1, sucursal: 1 }, { unique: true });

// Evita el error "Cannot overwrite model once compiled" en hot-reload de Next.js
const Stock = mongoose.models.Stock || mongoose.model('Stock', StockSchema);

export default Stock;
