import Link from 'next/link';

export const metadata = {
  title: 'StockFlow — Inicio',
  description: 'Plataforma de control de inventario multi-sucursal con movimientos en tiempo real.',
};

const features = [
  {
    icon: '📦',
    title: 'Gestión de Productos',
    description:
      'Crea y administra tu catálogo de productos con SKU único, precio y categoría.',
    href: '/productos',
    cta: 'Ver productos',
    color: 'from-indigo-500/20 to-indigo-600/10 border-indigo-500/30',
    badge: 'bg-indigo-500/20 text-indigo-300',
  },
  {
    icon: '🏪',
    title: 'Sucursales',
    description:
      'Registra múltiples puntos de venta o almacenes y gestiona su información.',
    href: '/sucursales',
    cta: 'Ver sucursales',
    color: 'from-violet-500/20 to-violet-600/10 border-violet-500/30',
    badge: 'bg-violet-500/20 text-violet-300',
  },
  {
    icon: '🔄',
    title: 'Movimientos de Stock',
    description:
      'Registra entradas, salidas y transferencias entre sucursales. Procesamiento asíncrono con BullMQ.',
    href: '/movimientos',
    cta: 'Ver movimientos',
    color: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30',
    badge: 'bg-cyan-500/20 text-cyan-300',
  },
  {
    icon: '📊',
    title: 'Dashboard en tiempo real',
    description:
      'Visualiza el stock actual por sucursal y el estado de los movimientos. Se actualiza cada 5 segundos.',
    href: '/dashboard',
    cta: 'Ir al dashboard',
    color: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30',
    badge: 'bg-emerald-500/20 text-emerald-300',
  },
];

const stack = [
  { label: 'Next.js 16', desc: 'App Router + API Routes' },
  { label: 'MongoDB', desc: 'Mongoose + Atlas' },
  { label: 'BullMQ', desc: 'Cola de trabajos async' },
  { label: 'Upstash Redis', desc: 'Backend de BullMQ' },
  { label: 'Tailwind CSS v4', desc: 'Estilos utilitarios' },
  { label: 'Axios', desc: 'Cliente HTTP' },
];

export default function HomePage() {
  return (
    <div className="space-y-16">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="pt-10 pb-4 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-medium text-indigo-300 mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
          Procesamiento asíncrono con BullMQ + Redis
        </div>

        <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
          Control de inventario{' '}
          <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            multi-sucursal
          </span>
        </h1>

        <p className="mt-6 max-w-2xl mx-auto text-lg text-slate-400">
          StockFlow gestiona entradas, salidas y transferencias de stock entre sucursales.
          Las operaciones se procesan de forma asíncrona para mantener la API rápida y responsiva.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/dashboard"
            className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-500 active:scale-95"
          >
            Ir al Dashboard →
          </Link>
          <Link
            href="/movimientos"
            className="rounded-lg border border-slate-700 bg-slate-800 px-6 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-slate-600 hover:bg-slate-700 active:scale-95"
          >
            Registrar movimiento
          </Link>
        </div>
      </section>

      {/* ── Flujo async ──────────────────────────────────────── */}
      <section>
        <h2 className="text-center text-xs font-semibold uppercase tracking-widest text-slate-500 mb-8">
          Flujo de procesamiento
        </h2>
        <div className="flex flex-wrap justify-center items-center gap-2 text-sm">
          {[
            { step: '1', label: 'POST /api/movimientos', sub: 'Valida y guarda' },
            { step: '→', label: null },
            { step: '2', label: 'Estado: pending', sub: 'Responde al cliente' },
            { step: '→', label: null },
            { step: '3', label: 'BullMQ encola job', sub: 'Redis (Upstash)' },
            { step: '→', label: null },
            { step: '4', label: 'Worker procesa', sub: 'Actualiza stocks' },
            { step: '→', label: null },
            { step: '5', label: 'Estado: processed', sub: 'o failed + razón' },
          ].map((item, i) =>
            item.label === null ? (
              <span key={i} className="text-slate-600 text-lg font-bold hidden sm:block">
                {item.step}
              </span>
            ) : (
              <div
                key={i}
                className="flex flex-col items-center rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 min-w-[120px] text-center"
              >
                <span className="text-xs font-bold text-indigo-400 mb-1">Paso {item.step}</span>
                <span className="text-sm font-semibold text-slate-200">{item.label}</span>
                <span className="text-xs text-slate-500 mt-0.5">{item.sub}</span>
              </div>
            )
          )}
        </div>
      </section>

      {/* ── Feature cards ────────────────────────────────────── */}
      <section>
        <h2 className="text-center text-xs font-semibold uppercase tracking-widest text-slate-500 mb-8">
          Módulos del sistema
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className={`group relative flex flex-col rounded-2xl border bg-gradient-to-br p-6 transition hover:-translate-y-1 hover:shadow-xl ${f.color}`}
            >
              <span className="text-3xl mb-3">{f.icon}</span>
              <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400 flex-1">{f.description}</p>
              <span
                className={`mt-4 inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ${f.badge} transition group-hover:opacity-80`}
              >
                {f.cta} →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Stack tecnológico ─────────────────────────────────── */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
        <h2 className="text-center text-xs font-semibold uppercase tracking-widest text-slate-500 mb-6">
          Stack tecnológico
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {stack.map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center rounded-xl border border-slate-800 bg-slate-950 px-4 py-4 text-center"
            >
              <span className="text-sm font-bold text-slate-200">{s.label}</span>
              <span className="mt-1 text-xs text-slate-500">{s.desc}</span>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
