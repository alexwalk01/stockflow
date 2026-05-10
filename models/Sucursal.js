import mongoose, { Schema } from 'mongoose';

const SucursalSchema = new Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre de la sucursal es obligatorio'],
      trim: true,
    },
    ubicacion: {
      type: String,
      required: [true, 'La ubicación es obligatoria'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Evita el error "Cannot overwrite model once compiled" en hot-reload de Next.js
const Sucursal =
  mongoose.models.Sucursal || mongoose.model('Sucursal', SucursalSchema);

export default Sucursal;
