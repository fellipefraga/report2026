import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  Presentation,
  AlignLeft,
  Download,
  Settings,
} from 'lucide-react'
import { Toaster } from 'react-hot-toast'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/fontes', icon: FileText, label: 'Fontes' },
  { to: '/sumario', icon: BookOpen, label: 'Sumário' },
  { to: '/slides', icon: Presentation, label: 'Slides' },
  { to: '/textos', icon: AlignLeft, label: 'Textos' },
  { to: '/exportar', icon: Download, label: 'Exportar' },
  { to: '/configuracoes', icon: Settings, label: 'Configurações' },
]

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#0D1117' }}>
      {/* Sidebar */}
      <aside
        className="w-56 flex-shrink-0 flex flex-col border-r"
        style={{ backgroundColor: '#0D1117', borderColor: '#2A2A26' }}
      >
        {/* Logo */}
        <div className="px-4 py-5 border-b" style={{ borderColor: '#2A2A26' }}>
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: '#C8F000', color: '#0D1117' }}
            >
              S
            </div>
            <div>
              <div className="text-sm font-semibold text-white leading-tight">Stellar Report</div>
              <div className="text-xs" style={{ color: '#A0A09A' }}>2026</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                  isActive
                    ? 'text-black font-medium'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`
              }
              style={({ isActive }) =>
                isActive ? { backgroundColor: '#C8F000', color: '#0D1117' } : {}
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t" style={{ borderColor: '#2A2A26' }}>
          <div className="text-xs" style={{ color: '#A0A09A' }}>
            <div className="font-medium text-white">Fellipe Fraga</div>
            <div>CBO · Stellar Gaming</div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      {/* Toast notifications */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1A1A16',
            color: '#FFFFFF',
            border: '1px solid #2A2A26',
            borderRadius: '8px',
            fontSize: '14px',
          },
          success: {
            iconTheme: {
              primary: '#C8F000',
              secondary: '#0D1117',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#FFFFFF',
            },
          },
        }}
      />
    </div>
  )
}
