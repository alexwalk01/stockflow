'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

export default function DashboardPage() {
  // Datos de stock
  const [productos, setProductos] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [stockData, setStockData] = useState([]);
  const [cargandoStock, setCargandoStock] = useState(true);

  // Datos de movimientos (con polling)
  const [movimientos, setMovimientos] = useState([]);
  const [cargandoMovs, setCargandoMovs] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroSucursal, setFiltroSucursal] = useState('');

  // ── Carga inicial de Stock ─────────────────────────────────────────────────
  useEffect(() => {
    cargarMatrizStock();
  }, []);

  async function cargarMatrizStock() {
    try {
      setCargandoStock(true);
      const [resProd, resSuc, resStock] = await Promise.all([
        axios.get('/api/productos'),
        axios.get('/api/sucursales'),
        axios.get('/api/stock'),
      ]);
      setProductos(resProd.data);
      setSucursales(resSuc.data);
      setStockData(resStock.data);
    } catch (err) {
      console.error('Error al cargar datos del dashboard', err);
    } finally {
      setCargandoStock(false);
    }
  }

  // ── Polling de Movimientos ─────────────────────────────────────────────────
  useEffect(() => {
    cargarMovimientos(); // carga inicial al cambiar filtro

    const intervalId = setInterval(() => {
      cargarMovimientos(false); // background poll
    }, 5000);

    return () => clearInterval(intervalId);
  }, [filtroEstado, filtroSucursal]);

  async function cargarMovimientos(showLoading = true) {
    if (showLoading && movimientos.length === 0) setCargandoMovs(true);
    try {
      const params = new URLSearchParams();
      if (filtroEstado) params.append('estado', filtroEstado);
      if (filtroSucursal) params.append('sucursal', filtroSucursal);

      const { data } = await axios.get(`/api/movimientos?${params.toString()}`);
      setMovimientos(data);
    } catch (err) {
      console.error('Error al cargar movimientos en polling', err);
    } finally {
      if (showLoading) setCargandoMovs(false);
    }
  }

  // ── Procesamiento de Matriz de Stock ───────────────────────────────────────
  // Pre-computamos un mapa para acceso rápido: map[productoId][sucursalId] = cantidad
  const stockMap = {};
  stockData.forEach((s) => {
    const pId = typeof s.producto === 'object' ? s.producto._id : s.producto;
    const sId = typeof s.sucursal === 'object' ? s.sucursal._id : s.sucursal;
    
    if (!stockMap[pId]) stockMap[pId] = { total: 0 };
    stockMap[pId][sId] = s.cantidad;
    stockMap[pId].total += s.cantidad;
  });

  // ── Helpers ────────────────────────────────────────────────────────────────
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

  return (
    <div className="space-y-10">
      
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          Dashboard 
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Vista general del inventario y monitoreo de movimientos en tiempo real.
        </p>
      </div>

      {/* ── Tabla de Stock Matrix ─────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
        <div className="p-5 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-300">
            📦 Stock por Sucursal
          </h2>
          <button 
            onClick={cargarMatrizStock}
            className="text-xs text-slate-500 hover:text-emerald-400 transition flex items-center gap-1"
          >
            🔄 Actualizar
          </button>
        </div>

        {cargandoStock ? (
          <div className="p-12 flex justify-center"><Spinner /></div>
        ) : productos.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No hay productos registrados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3 sticky left-0 bg-slate-950 z-10 w-48">Producto</th>
                  <th className="px-4 py-3 text-right border-r border-slate-800">Total</th>
                  {sucursales.map(suc => (
                    <th key={suc._id} className="px-4 py-3 text-right whitespace-nowrap">
                      {suc.nombre}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {productos.map(p => {
                  const sMap = stockMap[p._id] || { total: 0 };
                  return (
                    <tr key={p._id} className="transition hover:bg-slate-800/30">
                      <td className="px-4 py-3 sticky left-0 bg-slate-900 z-10 w-48">
                        <div className="font-medium text-slate-200 truncate" title={p.nombre}>{p.nombre}</div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">{p.sku}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-white border-r border-slate-800 bg-slate-900/30">
                        {sMap.total}
                      </td>
                      {sucursales.map(suc => (
                        <td key={suc._id} className="px-4 py-3 text-right font-mono text-slate-300">
                          {sMap[suc._id] || 0}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Monitoreo de Movimientos (Real-time) ────────────────────────────── */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
        <div className="p-5 border-b border-slate-800 bg-slate-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-300 flex items-center gap-2">
            ⏱️ Movimientos Recientes
            <span className="text-[10px] bg-slate-800 text-emerald-400 px-2 py-0.5 rounded-full lowercase tracking-normal font-normal animate-pulse border border-emerald-500/20">
              Live (5s)
            </span>
          </h2>
          
          <div className="flex gap-2">
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 focus:border-emerald-500 focus:outline-none"
            >
              <option value="">Todos los estados</option>
              <option value="pending">Pendiente</option>
              <option value="processed">Procesado</option>
              <option value="failed">Fallido</option>
            </select>

            <select
              value={filtroSucursal}
              onChange={(e) => setFiltroSucursal(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 focus:border-emerald-500 focus:outline-none"
            >
              <option value="">Todas las sucursales</option>
              {sucursales.map((s) => (
                <option key={s._id} value={s._id}>{s.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        {cargandoMovs ? (
          <div className="p-12 flex justify-center"><Spinner /></div>
        ) : movimientos.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No hay movimientos recientes que coincidan con los filtros.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">ID / Fecha</th>
                  <th className="px-4 py-3">Operación</th>
                  <th className="px-4 py-3 text-right">Cant.</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {movimientos.slice(0, 15).map((m) => ( // Mostrar máx 15 para mantenerlo limpio
                  <tr key={m._id} className="transition hover:bg-slate-800/50">
                    <td className="px-4 py-3">
                      <div className="font-mono text-[10px] text-slate-500 mb-0.5">{m._id.slice(-8)}</div>
                      <div className="text-xs text-slate-300">
                        {new Date(m.createdAt).toLocaleTimeString('es-MX', { hour12: false })}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-medium capitalize text-xs ${getTipoColor(m.tipo)}`}>
                          {m.tipo}
                        </span>
                        <span className="text-slate-500 text-xs">— {m.producto?.nombre}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {m.tipo === 'entrada' && `Hacia: ${m.sucursalDestino?.nombre}`}
                        {m.tipo === 'salida' && `Desde: ${m.sucursalOrigen?.nombre}`}
                        {m.tipo === 'transferencia' && `${m.sucursalOrigen?.nombre} → ${m.sucursalDestino?.nombre}`}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-slate-200">
                      {m.cantidad}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${getEstadoColor(m.estado)}`}>
                        {m.estado}
                      </span>
                      {m.estado === 'failed' && m.intentos > 0 && (
                        <div className="text-[10px] text-red-400/70 mt-1">
                          Reintentos agotados
                        </div>
                      )}
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

function Spinner() {
  return (
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-emerald-500" />
  );
}
