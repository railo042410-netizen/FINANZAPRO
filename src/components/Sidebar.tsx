import {
  ArrowLeftRight,
  DatabaseBackup,
  Eye,
  EyeOff,
  LayoutDashboard,
  Menu,
  PiggyBank,
  Plus,
  Repeat,
  Sparkles,
  X,
} from 'lucide-react';
import { ActiveSection } from '../types/finance';
import { formatCurrency } from '../utils/formatters';

interface SidebarProps {
  activeSection: ActiveSection;
  onNavigate: (section: ActiveSection) => void;
  patrimonioTotal: number;
  saldoDisponibleReal: number;
  totalAhorrado: number;
  hideTotalSavings: boolean;
  onToggleHideTotalSavings: () => void;
  onOpenNewTransaction: () => void;
  mobileOpen: boolean;
  onToggleMobile: (open: boolean) => void;
}

const NAV_ITEMS: { id: ActiveSection; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Resumen General', icon: LayoutDashboard },
  { id: 'transactions', label: 'Movimientos', icon: ArrowLeftRight },
  { id: 'fixed', label: 'Gastos Fijos', icon: Repeat },
  { id: 'pockets', label: 'Bolsillos y Metas', icon: PiggyBank },
  { id: 'motivation', label: 'Motivación', icon: Sparkles },
  { id: 'backup', label: 'Respaldo y Ajustes', icon: DatabaseBackup },
];

export function Sidebar({
  activeSection,
  onNavigate,
  patrimonioTotal,
  saldoDisponibleReal,
  totalAhorrado,
  hideTotalSavings,
  onToggleHideTotalSavings,
  onOpenNewTransaction,
  mobileOpen,
  onToggleMobile,
}: SidebarProps) {
  const handleSelect = (id: ActiveSection) => {
    onNavigate(id);
    onToggleMobile(false);
  };

  const navContent = (
    <div className="flex h-full flex-col justify-between bg-[#1e120b]/95 backdrop-blur-xl p-5 border-r border-orange-400/15">
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => handleSelect('overview')}
            className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-md"
          >
            <span className="flex items-center gap-1.5 font-display text-xl font-bold tracking-tight text-white whitespace-nowrap">
              <span className="neon-dot h-2 w-2 rounded-full bg-orange-400 shadow-[0_0_14px_#fb923c]" />
              Finanza
              <span className="bg-gradient-to-r from-orange-400 via-red-400 to-amber-300 bg-clip-text text-transparent">
                Pro
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => onToggleMobile(false)}
            className="lg:hidden p-2 text-stone-400 hover:text-white rounded-lg focus-visible:ring-2 focus-visible:ring-amber-400"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            onToggleMobile(false);
            onOpenNewTransaction();
          }}
          className="cta-vivid w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080d1c]"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Registrar Movimiento</span>
        </button>

        <nav className="space-y-1.5" aria-label="Navegación principal">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-500/25 via-red-500/15 to-transparent text-white border border-orange-400/50 shadow-[0_0_24px_-8px_rgba(251,146,60,0.85)] transtone-x-1'
                    : 'text-stone-400 hover:text-orange-100 hover:bg-orange-500/10 border border-transparent hover:transtone-x-0.5'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-orange-300' : 'text-stone-400'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="pt-5 border-t border-orange-400/15">
        <div className="surface-sub rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-orange-200/70">
              Patrimonio Total Real
            </span>
            <span className="neon-dot h-2 w-2 rounded-full bg-yellow-300 shadow-[0_0_12px_#a3e635]" />
          </div>
          <div className="neon-gradient font-mono-tabular text-2xl font-bold">
            {formatCurrency(patrimonioTotal)}
          </div>
          <div className="h-px bg-gradient-to-r from-orange-400/40 via-red-400/20 to-transparent" />
          <div className="flex items-center justify-between text-xs text-stone-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_10px_#facc15]" />
              Disponible
            </span>
            <span
              className={`font-mono-tabular font-semibold ${
                saldoDisponibleReal < 0 ? 'text-red-400' : 'text-amber-300'
              }`}
            >
              {formatCurrency(saldoDisponibleReal)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-stone-400">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-yellow-400 shadow-[0_0_10px_#a3e635]" />
              <span>Ahorrado</span>
              <button
                type="button"
                onClick={onToggleHideTotalSavings}
                className="icon-button p-0.5 text-stone-400 hover:text-yellow-300 rounded cursor-pointer"
                aria-label={
                  hideTotalSavings
                    ? 'Mostrar total ahorrado'
                    : 'Ocultar total ahorrado'
                }
              >
                {hideTotalSavings ? (
                  <Eye className="w-3 h-3" />
                ) : (
                  <EyeOff className="w-3 h-3" />
                )}
              </button>
            </div>
            <span className="font-mono-tabular font-semibold text-yellow-300">
              {hideTotalSavings ? '••••••' : formatCurrency(totalAhorrado)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-0 h-screen">
        {navContent}
      </aside>

      {/* Mobile Top Bar */}
      <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between gap-4 px-4 py-3 bg-[#1e120b]/92 backdrop-blur-xl border-b border-orange-400/15">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onToggleMobile(true)}
            className="p-2 -ml-1 text-stone-300 hover:text-white rounded-lg hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-amber-400"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="flex items-center gap-1.5 font-display text-lg font-bold tracking-tight text-white whitespace-nowrap">
            <span className="neon-dot h-2 w-2 rounded-full bg-orange-400 shadow-[0_0_14px_#fb923c]" />
            Finanza
            <span className="bg-gradient-to-r from-orange-400 via-red-400 to-amber-300 bg-clip-text text-transparent">
              Pro
            </span>
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenNewTransaction}
          className="cta-vivid flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Nuevo</span>
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs"
            onClick={() => onToggleMobile(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 w-72 max-w-[85vw] h-full">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}
