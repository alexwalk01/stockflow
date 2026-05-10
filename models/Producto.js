import mongoose, { Schema } from 'mongoose';

const ProductoSchema = new Schema(
  {
    sku: {
      type: String,
      required: [true, 'El SKU es obligatorio'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
    },
    precio: {
      type: Number,
      required: [true, 'El precio es obligatorio'],
      min: [0, 'El precio no puede ser negativo'],
    },
    categoria: {
      type: String,
      required: [true, 'La categoría es obligatoria'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Evita el error "Cannot overwrite model once compiled" en hot-reload de Next.js
const Producto =
  mongoose.models.Producto || mongoose.model('Producto', ProductoSchema);

export default Producto;
