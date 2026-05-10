'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

// ─── Componente principal ────────────────────────────────────────────────────

export default function ProductosPage() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Estado del formulario (compartido para crear y editar)
  const [form, setForm] = useState({ sku: '', nombre: '', precio: '', categoria: '' });
  const [editandoId, setEditandoId] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formExito, setFormExito] = useState(null);

  // Estado para confirmar eliminación
  const [eliminandoId, setEliminandoId] = useState(null);

  // ── Carga inicial ──────────────────────────────────────────────────────────
  useEffect(() => {
    cargarProductos();
  }, []);

  async function cargarProductos() {
    try {
      setCargando(true);
      setError(null);
      const { data } = await axios.get('/api/productos');
      setProductos(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar los productos');
    } finally {
      setCargando(false);
    }
  }

  // ── Manejo del formulario ──────────────────────────────────────────────────
  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setFormError(null);
    setFormExito(null);
  }

  function iniciarEdicion(producto) {
    setEditandoId(producto._id);
    setForm({
      sku: producto.sku,
      nombre: producto.nombre,
      precio: String(producto.precio),
      categoria: producto.categoria,
    });
    setFormError(null);
    setFormExito(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelarEdicion() {
    setEditandoId(null);
    setForm({ sku: '', nombre: '', precio: '', categoria: '' });
    setFormError(null);
    setFormExito(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setGuardando(true);
    setFormError(null);
    setFormExito(null);

    const payload = {
      sku: form.sku.trim(),
      nombre: form.nombre.trim(),
      precio: parseFloat(form.precio),
      categoria: form.categoria.trim(),
    };

    try {
      if (editandoId) {
        await axios.put(`/api/productos/${editandoId}`, payload);
        setFormExito('Producto actualizado correctamente');
        setEditandoId(null);
      } else {
        await axios.post('/api/productos', payload);
        setFormExito('Producto creado correctamente');
      }
      setForm({ sku: '', nombre: '', precio: '', categoria: '' });
      await cargarProductos();
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al guardar el producto';
      const detalle = err.response?.data?.detalle;
      setFormError(Array.isArray(detalle) ? detalle.join(' · ') : msg);
    } finally {
      setGuardando(false);
    }
  }

  async function handleEliminar(id) {
    if (eliminandoId !== id) {
      // Primer clic: pedir confirmación
      setEliminandoId(id);
      return;
    }
    // Segundo clic: eliminar
    try {
      await axios.delete(`/api/productos/${id}`);
      setEliminandoId(null);
      await cargarProductos();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar el producto');
      setEliminandoId(null);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">

      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-white">Productos</h1>
        <p className="mt-1 text-sm text-slate-400">
          Gestiona el catálogo de productos del inventario.
        </p>
      </div>

      {/* ── Formulario ────────────────────────────────────────── */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-400">
          {editandoId ? '✏️  Editar producto' : '➕  Nuevo producto'}
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="SKU" id="sku" name="sku" value={form.sku} onChange={handleChange}
            placeholder="Ej. PROD-001" required disabled={!!editandoId} />

          <Field label="Nombre" id="nombre" name="nombre" value={form.nombre} onChange={handleChange}
            placeholder="Ej. Camisa de algodón" required />

          <Field label="Precio ($)" id="precio" name="precio" type="number" min="0" step="0.01"
            value={form.precio} onChange={handleChange} placeholder="0.00" required />

          <Field label="Categoría" id="categoria" name="categoria" value={form.categoria}
            onChange={handleChange} placeholder="Ej. Ropa" required />

          {/* Mensajes */}
          {formError && (
            <p className="col-span-full rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
              {formError}
            </p>
          )}
          {formExito && (
            <p className="col-span-full rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">
              ✓ {formExito}
            </p>
          )}

          {/* Botones */}
          <div className="col-span-full flex gap-3">
            <button
              type="submit"
              disabled={guardando}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
            >
              {guardando ? 'Guardando…' : editandoId ? 'Actualizar' : 'Crear producto'}
            </button>
            {editandoId && (
              <button
                type="button"
                onClick={cancelarEdicion}
                className="rounded-lg border border-slate-700 bg-slate-800 px-5 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-700"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </section>

      {/* ── Tabla de productos ────────────────────────────────── */}
      <section>
        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {cargando ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : productos.length === 0 ? (
          <EmptyState message="No hay productos registrados. Crea el primero." />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Categoría</th>
                  <th className="px-4 py-3">Precio</th>
                  <th className="px-4 py-3">Creado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {productos.map((p) => (
                  <tr
                    key={p._id}
                    className="bg-slate-950 transition hover:bg-slate-900/60"
                  >
                    <td className="px-4 py-3 font-mono text-indigo-400">{p.sku}</td>
                    <td className="px-4 py-3 font-medium text-slate-200">{p.nombre}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs text-slate-300">
                        {p.categoria}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      ${Number(p.precio).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {new Date(p.createdAt).toLocaleDateString('es-MX')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => iniciarEdicion(p)}
                          className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300 transition hover:bg-slate-700"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleEliminar(p._id)}
                          className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                            eliminandoId === p._id
                              ? 'border border-red-500/50 bg-red-500/20 text-red-400 hover:bg-red-500/30'
                              : 'border border-slate-700 bg-slate-800 text-slate-300 hover:border-red-500/40 hover:text-red-400'
                          }`}
                        >
                          {eliminandoId === p._id ? '¿Confirmar?' : 'Eliminar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

// ─── Componentes auxiliares ──────────────────────────────────────────────────

function Field({ label, id, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-slate-400">
        {label}
      </label>
      <input
        id={id}
        {...props}
        className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-40"
      />
    </div>
  );
}

function Spinner() {
  return (
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-indigo-500" />
  );
}

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 py-16 text-center">
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}
