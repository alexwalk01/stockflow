import Link from 'next/link';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata = {
  title: 'StockFlow — Control de Inventario',
  description:
    'Plataforma de control de inventario multi-sucursal con movimientos en tiempo real.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${inter.variable} h-full`}>
      <body className="min-h-full bg-slate-950 text-slate-100 antialiased">
        {/* ── Barra de navegación ─────────────────────────────── */}
        <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 text-lg font-bold tracking-tight text-white"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600 text-xs font-black">
                SF
              </span>
              StockFlow
            </Link>

            {/* Links */}
            <ul className="flex items-center gap-1">
              <NavLink href="/dashboard">Dashboard</NavLink>
              <NavLink href="/productos">Productos</NavLink>
              <NavLink href="/sucursales">Sucursales</NavLink>
              <NavLink href="/movimientos">Movimientos</NavLink>
            </ul>
          </div>
        </nav>

        {/* ── Contenido principal ─────────────────────────────── */}
        <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>

        {/* ── Footer ─────────────────────────────────────────── */}
        <footer className="mt-auto border-t border-slate-800 py-4 text-center text-xs text-slate-500">
          StockFlow © {new Date().getFullYear()} — Control de inventario multi-sucursal
        </footer>
      </body>
    </html>
  );
}

/* Componente auxiliar para los links de navegación */
function NavLink({ href, children }) {
  return (
    <li>
      <Link
        href={href}
        className="rounded-md px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
      >
        {children}
      </Link>
    </li>
  );
}
