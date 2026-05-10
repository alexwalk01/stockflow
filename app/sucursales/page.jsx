'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

export default function SucursalesPage() {
  const [sucursales, setSucursales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({ nombre: '', ubicacion: '' });
  const [editandoId, setEditandoId] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formExito, setFormExito] = useState(null);

  const [eliminandoId, setEliminandoId] = useState(null);

  // ── Carga inicial ──────────────────────────────────────────────────────────
  useEffect(() => {
    cargarSucursales();
  }, []);

  async function cargarSucursales() {
    try {
      setCargando(true);
      setError(null);
      const { data } = await axios.get('/api/sucursales');
      setSucursales(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar las sucursales');
    } finally {
      setCargando(false);
    }
  }

  // ── Formulario ─────────────────────────────────────────────────────────────
  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setFormError(null);
    setFormExito(null);
  }

  function iniciarEdicion(sucursal) {
    setEditandoId(sucursal._id);
    setForm({ nombre: sucursal.nombre, ubicacion: sucursal.ubicacion });
    setFormError(null);
    setFormExito(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelarEdicion() {
    setEditandoId(null);
    setForm({ nombre: '', ubicacion: '' });
    setFormError(null);
    setFormExito(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setGuardando(true);
    setFormError(null);
    setFormExito(null);

    const payload = {
      nombre: form.nombre.trim(),
      ubicacion: form.ubicacion.trim(),
    };

    try {
      if (editandoId) {
        await axios.put(`/api/sucursales/${editandoId}`, payload);
        setFormExito('Sucursal actualizada correctamente');
        setEditandoId(null);
      } else {
        await axios.post('/api/sucursales', payload);
        setFormExito('Sucursal creada correctamente');
      }
      setForm({ nombre: '', ubicacion: '' });
      await cargarSucursales();
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al guardar la sucursal';
      const detalle = err.response?.data?.detalle;
      setFormError(Array.isArray(detalle) ? detalle.join(' · ') : msg);
    } finally {
      setGuardando(false);
    }
  }

  async function handleEliminar(id) {
    if (eliminandoId !== id) {
      setEliminandoId(id);
      return;
    }
    try {
      await axios.delete(`/api/sucursales/${id}`);
      setEliminandoId(null);
      await cargarSucursales();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar la sucursal');
      setEliminandoId(null);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">

      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-white">Sucursales</h1>
        <p className="mt-1 text-sm text-slate-400">
          Gestiona los puntos de venta o almacenes del inventario.
        </p>
      </div>

      {/* ── Formulario ────────────────────────────────────────── */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-400">
          {editandoId ? '✏️  Editar sucursal' : '➕  Nueva sucursal'}
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Nombre"
            id="nombre"
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            placeholder="Ej. Sucursal Centro"
            required
          />
          <Field
            label="Ubicación"
            id="ubicacion"
            name="ubicacion"
            value={form.ubicacion}
            onChange={handleChange}
            placeholder="Ej. Av. Reforma 123, CDMX"
            required
          />

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

          <div className="col-span-full flex gap-3">
            <button
              type="submit"
              disabled={guardando}
              className="rounded-lg bg-violet-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-50"
            >
              {guardando ? 'Guardando…' : editandoId ? 'Actualizar' : 'Crear sucursal'}
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

      {/* ── Lista de sucursales ───────────────────────────────── */}
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
        ) : sucursales.length === 0 ? (
          <EmptyState message="No hay sucursales registradas. Crea la primera." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sucursales.map((s) => (
              <div
                key={s._id}
                className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-slate-700"
              >
                {/* Info */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/20 text-violet-400">
                      🏪
                    </div>
                    <span className="text-xs text-slate-500">
                      {new Date(s.createdAt).toLocaleDateString('es-MX')}
                    </span>
                  </div>
                  <h3 className="mt-3 font-semibold text-slate-100">{s.nombre}</h3>
                  <p className="mt-1 text-sm text-slate-400">{s.ubicacion}</p>
                </div>

                {/* Acciones */}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => iniciarEdicion(s)}
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-800 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-700"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleEliminar(s._id)}
                    className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition ${
                      eliminandoId === s._id
                        ? 'border border-red-500/50 bg-red-500/20 text-red-400 hover:bg-red-500/30'
                        : 'border border-slate-700 bg-slate-800 text-slate-300 hover:border-red-500/40 hover:text-red-400'
                    }`}
                  >
                    {eliminandoId === s._id ? '¿Confirmar?' : 'Eliminar'}
                  </button>
                </div>
              </div>
            ))}
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
        className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
      />
    </div>
  );
}

function Spinner() {
  return (
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-violet-500" />
  );
}

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 py-16 text-center">
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}
