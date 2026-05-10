'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

// ─── Componente principal ────────────────────────────────────────────────────

export default function MovimientosPage() {
  const [movimientos, setMovimientos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [sucursales, setSucursales] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Estado del formulario
  const [form, setForm] = useState({
    tipo: 'entrada',
    producto: '',
    cantidad: 1,
    sucursalOrigen: '',
    sucursalDestino: '',
  });
  const [guardando, setGuardando] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formExito, setFormExito] = useState(null);

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroSucursal, setFiltroSucursal] = useState('');

  // Detalle
  const [detalleId, setDetalleId] = useState(null);
  const [detalleData, setDetalleData] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  // ── Carga inicial y dependencias ───────────────────────────────────────────
  useEffect(() => {
    cargarDatosBase();
  }, []);

  useEffect(() => {
    cargarMovimientos();
    // Actualizar lista periódicamente si queremos ver los cambios (opcional aquí)
    // El dashboard sí requiere polling constante.
  }, [filtroEstado, filtroSucursal]);

  async function cargarDatosBase() {
    try {
      setCargando(true);
      const [resProductos, resSucursales] = await Promise.all([
        axios.get('/api/productos'),
        axios.get('/api/sucursales'),
      ]);
      setProductos(resProductos.data);
      setSucursales(resSucursales.data);
      
      // Valores por defecto
      if (resProductos.data.length > 0) {
        setForm((prev) => ({ ...prev, producto: resProductos.data[0]._id }));
      }
      if (resSucursales.data.length > 0) {
        setForm((prev) => ({
          ...prev,
          sucursalOrigen: resSucursales.data[0]._id,
          sucursalDestino: resSucursales.data[0]._id,
        }));
      }
    } catch (err) {
      setError('Error al cargar datos necesarios (productos/sucursales).');
    } finally {
      setCargando(false);
    }
  }

  async function cargarMovimientos() {
    try {
      const params = new URLSearchParams();
      if (filtroEstado) params.append('estado', filtroEstado);
      if (filtroSucursal) params.append('sucursal', filtroSucursal);

      const { data } = await axios.get(`/api/movimientos?${params.toString()}`);
      setMovimientos(data);
    } catch (err) {
      console.error('Error al cargar movimientos', err);
    }
  }

  // ── Formulario ─────────────────────────────────────────────────────────────
  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setFormError(null);
    setFormExito(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setGuardando(true);
    setFormError(null);
    setFormExito(null);

    const payload = {
      tipo: form.tipo,
      producto: form.producto,
      cantidad: Number(form.cantidad),
      sucursalOrigen: form.tipo !== 'entrada' ? form.sucursalOrigen : null,
      sucursalDestino: form.tipo !== 'salida' ? form.sucursalDestino : null,
    };

    if (form.tipo === 'transferencia' && form.sucursalOrigen === form.sucursalDestino) {
      setFormError('La sucursal de origen y destino no pueden ser la misma.');
      setGuardando(false);
      return;
    }

    try {
      await axios.post('/api/movimientos', payload);
      setFormExito('Movimiento registrado y encolado correctamente.');
      // Reseteamos cantidad, mantenemos lo demás por conveniencia
      setForm((prev) => ({ ...prev, cantidad: 1 }));
      await cargarMovimientos(); // Actualizamos la lista para ver el 'pending'
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al registrar el movimiento';
      const detalle = err.response?.data?.detalle;
      setFormError(Array.isArray(detalle) ? detalle.join(' · ') : msg);
    } finally {
      setGuardando(false);
    }
  }

  // ── Detalle del Movimiento ─────────────────────────────────────────────────
  async function verDetalle(id) {
    setDetalleId(id);
    setCargandoDetalle(true);
    setDetalleData(null);
    try {
      const { data } = await axios.get(`/api/movimientos/${id}`);
      setDetalleData(data);
    } catch (err) {
      console.error('Error al cargar detalle', err);
    } finally {
      setCargandoDetalle(false);
    }
  }

  function cerrarDetalle() {
    setDetalleId(null);
    setDetalleData(null);
  }

  // ── Render Helpers ─────────────────────────────────────────────────────────
  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'processed': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'failed': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    }
  };

  const getTipoColor = (tipo) => {
    switch (tipo) {
      case 'entrada': return 'text-emerald-400';
      case 'salida': return 'text-orange-400';
      case 'transferencia': return 'text-cyan-400';
      default: return 'text-slate-400';
    }
  };

  if (cargando) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-8 relative">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-white">Movimientos</h1>
        <p className="mt-1 text-sm text-slate-400">
          Registra entradas, salidas o transferencias. El procesamiento es asíncrono.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* ── Formulario de Registro ────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-400">
          ➕ Registrar movimiento
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-400">Tipo</label>
            <select
              name="tipo"
              value={form.tipo}
              onChange={handleChange}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="entrada">Entrada (+)</option>
              <option value="salida">Salida (-)</option>
              <option value="transferencia">Transferencia (→)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1 lg:col-span-2">
            <label className="text-xs font-medium text-slate-400">Producto</label>
            <select
              name="producto"
              value={form.producto}
              onChange={handleChange}
              required
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="" disabled>Selecciona un producto...</option>
              {productos.map((p) => (
                <option key={p._id} value={p._id}>
                  [{p.sku}] {p.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-400">Cantidad</label>
            <input
              type="number"
              name="cantidad"
              value={form.cantidad}
              onChange={handleChange}
              min="1"
              required
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          {/* Espaciador para mantener el grid en pantallas grandes si no hay más campos en esta fila */}
          <div className="hidden lg:block"></div>

          {(form.tipo === 'salida' || form.tipo === 'transferencia') && (
            <div className="flex flex-col gap-1 lg:col-span-2">
              <label className="text-xs font-medium text-slate-400">Sucursal Origen</label>
              <select
                name="sucursalOrigen"
                value={form.sucursalOrigen}
                onChange={handleChange}
                required
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <option value="" disabled>Selecciona origen...</option>
                {sucursales.map((s) => (
                  <option key={s._id} value={s._id}>{s.nombre}</option>
                ))}
              </select>
            </div>
          )}

          {(form.tipo === 'entrada' || form.tipo === 'transferencia') && (
            <div className="flex flex-col gap-1 lg:col-span-2">
              <label className="text-xs font-medium text-slate-400">Sucursal Destino</label>
              <select
                name="sucursalDestino"
                value={form.sucursalDestino}
                onChange={handleChange}
                required
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <option value="" disabled>Selecciona destino...</option>
                {sucursales.map((s) => (
                  <option key={s._id} value={s._id}>{s.nombre}</option>
                ))}
              </select>
            </div>
          )}

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

          <div className="col-span-full pt-2">
            <button
              type="submit"
              disabled={guardando || productos.length === 0 || sucursales.length === 0}
              className="rounded-lg bg-cyan-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:opacity-50"
            >
              {guardando ? 'Encolando...' : 'Registrar Movimiento'}
            </button>
          </div>
        </form>
      </section>

      {/* ── Lista y Filtros ───────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <span>📋 Historial</span>
            <button 
              onClick={cargarMovimientos} 
              className="p-1 rounded-md hover:bg-slate-800 transition text-slate-500 hover:text-cyan-400"
              title="Refrescar"
            >
              🔄
            </button>
          </h2>

          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none"
            >
              <option value="">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="processed">Procesado</option>
              <option value="failed">Fallido</option>
            </select>

            <select
              value={filtroSucursal}
              onChange={(e) => setFiltroSucursal(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none"
            >
              <option value="">Todas las sucursales</option>
              {sucursales.map((s) => (
                <option key={s._id} value={s._id}>{s.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        {movimientos.length === 0 ? (
          <EmptyState message="No se encontraron movimientos con los filtros actuales." />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3 text-right">Cant.</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-center">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900">
                {movimientos.map((m) => (
                  <tr key={m._id} className="transition hover:bg-slate-800/50">
                    <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                      {new Date(m.createdAt).toLocaleString('es-MX')}
                    </td>
                    <td className={`px-4 py-3 font-medium capitalize ${getTipoColor(m.tipo)}`}>
                      {m.tipo}
                    </td>
                    <td className="px-4 py-3 text-slate-200">
                      {m.producto?.nombre} <span className="text-xs text-slate-500">({m.producto?.sku})</span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-slate-300">
                      {m.cantidad}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${getEstadoColor(m.estado)}`}>
                        {m.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => verDetalle(m._id)}
                        className="rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300 transition hover:bg-cyan-600 hover:text-white"
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Modal de Detalle ──────────────────────────────────────────────────── */}
      {detalleId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
            {cargandoDetalle ? (
              <div className="p-12 flex justify-center"><Spinner /></div>
            ) : detalleData ? (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    Detalle de Movimiento
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase ${getEstadoColor(detalleData.estado)}`}>
                      {detalleData.estado}
                    </span>
                  </h3>
                  <button onClick={cerrarDetalle} className="text-slate-400 hover:text-white transition">
                    ✕
                  </button>
                </div>

                <div className="space-y-4 text-sm">
                  <DetailRow label="ID" value={<span className="font-mono text-xs">{detalleData._id}</span>} />
                  <DetailRow label="Fecha" value={new Date(detalleData.createdAt).toLocaleString('es-MX')} />
                  <DetailRow label="Tipo" value={<span className={`font-semibold capitalize ${getTipoColor(detalleData.tipo)}`}>{detalleData.tipo}</span>} />
                  
                  <div className="border-t border-slate-800 my-2 pt-2"></div>
                  
                  <DetailRow label="Producto" value={`${detalleData.producto?.nombre} (${detalleData.producto?.sku})`} />
                  <DetailRow label="Categoría" value={detalleData.producto?.categoria} />
                  <DetailRow label="Cantidad" value={<span className="font-mono font-bold text-lg">{detalleData.cantidad}</span>} />
                  
                  <div className="border-t border-slate-800 my-2 pt-2"></div>
                  
                  {detalleData.sucursalOrigen && (
                    <DetailRow label="Origen" value={`${detalleData.sucursalOrigen.nombre} — ${detalleData.sucursalOrigen.ubicacion}`} />
                  )}
                  {detalleData.sucursalDestino && (
                    <DetailRow label="Destino" value={`${detalleData.sucursalDestino.nombre} — ${detalleData.sucursalDestino.ubicacion}`} />
                  )}
                  
                  <div className="border-t border-slate-800 my-2 pt-2"></div>
                  
                  <DetailRow label="Intentos Worker" value={detalleData.intentos} />
                  {detalleData.razonFallo && (
                    <div className="mt-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3">
                      <span className="block text-xs font-semibold text-red-400 mb-1">Razón de fallo:</span>
                      <p className="text-slate-300 text-xs">{detalleData.razonFallo}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400">Error al cargar el detalle.</div>
            )}
            
            {/* Footer Modal */}
            {!cargandoDetalle && (
              <div className="border-t border-slate-800 p-4 bg-slate-950 rounded-b-2xl flex justify-end">
                <button onClick={cerrarDetalle} className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700">
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Componentes auxiliares ──────────────────────────────────────────────────

function DetailRow({ label, value }) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-1">
      <span className="text-slate-400 text-xs sm:text-sm font-medium">{label}</span>
      <span className="text-slate-200 text-sm text-right">{value}</span>
    </div>
  );
}

function Spinner() {
  return (
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-500" />
  );
}

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 py-16 text-center">
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}
