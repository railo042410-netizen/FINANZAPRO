import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Eye,
  EyeOff,
  PiggyBank,
  Wallet,
} from 'lucide-react';
import { FinancialSummary } from '../types/finance';
import { formatCurrency } from '../utils/formatters';

interface KpiStripProps {
  summary: FinancialSummary;
  selectedMonth: string;
  onOpenTransfer: () => void;
  hideTotalSavings: boolean;
  onToggleHideTotalSavings: () => void;
}

export function KpiStrip({
  summary,
  selectedMonth,
  onOpenTransfer,
  hideTotalSavings,
  onToggleHideTotalSavings,
}: KpiStripProps) {
  const isHistorical = selectedMonth === 'all';

  return (
    <section className="space-y-4">
      {/* Golden Rule Net Worth Header Strip */}
      <div className="animate-pop relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 py-5 rounded-2xl surface-card lift border-orange-400/30">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full bg-gradient-to-br from-orange-500/25 via-red-500/20 to-amber-400/20 blur-3xl"
        />

        <div className="relative space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-stone-300">
            <span className="neon-gradient font-semibold">Patrimonio Total Real</span>
            <span aria-hidden="true" className="text-stone-600">·</span>
            <span>Disponible + Ahorrado</span>
            <span aria-hidden="true" className="text-stone-600">·</span>
            <span>Historial acumulado</span>
          </div>
          <div className="neon-gradient font-mono-tabular text-3xl sm:text-4xl font-bold tracking-tight">
            {formatCurrency(summary.patrimonioTotal)}
          </div>
        </div>

        <div className="relative flex flex-wrap items-center gap-6 text-sm">
          <div>
            <div className="text-xs text-stone-400">
              {isHistorical ? 'Balance del Período' : 'Balance del Mes'}
            </div>
            <div
              className={`font-mono-tabular font-semibold ${
                summary.monthIngresos - summary.monthGastos >= 0
                  ? 'text-yellow-300'
                  : 'text-red-400'
              }`}
            >
              {summary.monthIngresos - summary.monthGastos >= 0 ? '+' : ''}
              {formatCurrency(summary.monthIngresos - summary.monthGastos)}
            </div>
          </div>
          <div className="h-8 w-px bg-white/10 hidden sm:block" />
          <div>
            <div className="text-xs text-stone-400">
              {isHistorical ? 'Ahorrado en el período' : 'Ahorrado este Mes'}
            </div>
            <div className="font-mono-tabular font-semibold text-yellow-300">
              {hideTotalSavings ? '••••••' : formatCurrency(summary.monthAhorrado)}
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenTransfer}
            className="icon-button px-4 py-2 rounded-xl border border-orange-300/50 bg-gradient-to-r from-orange-500/25 to-red-500/25 hover:from-orange-500/40 hover:to-red-500/40 text-orange-100 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-[0_8px_24px_-12px_rgba(251,146,60,0.9)]"
          >
            Transferir a Ahorro
          </button>
        </div>
      </div>

      {/* Deficit / Savings Erosion Alert */}
      {summary.isAffectingSavings && (
        <div
          role="alert"
          className="animate-pop flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-red-500/20 via-orange-500/10 to-transparent border border-red-400/50 text-red-100 shadow-[0_0_30px_-18px_rgba(239,68,68,0.9)]"
        >
          <div className="flex items-start sm:items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5 sm:mt-0" />
            <div className="text-sm">
              <span className="font-semibold text-red-300">
                Alerta de metas de ahorro:
              </span>{' '}
              tus gastos superan el saldo disponible libre por{' '}
              <span className="font-mono-tabular font-bold text-white">
                {formatCurrency(summary.savingsDeficit)}
              </span>
              . Revisa tus metas y aportes para recuperar el equilibrio.
            </div>
          </div>
          <span className="text-xs font-medium text-red-200 whitespace-nowrap shrink-0">
            Patrimonio real disponible:{' '}
            {formatCurrency(Math.max(0, summary.patrimonioTotal))}
          </span>
        </div>
      )}

      {/* 4 Core KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* KPI 1: Saldo Disponible Real */}
        <div className="p-5 rounded-2xl surface-card lift overflow-hidden flex flex-col justify-between gap-3">
          <div className="progress-fill absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 to-red-500" />
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-stone-300">
              Saldo Disponible Real
            </span>
            <span
              className={`p-2 rounded-xl border ${
                summary.isAffectingSavings
                  ? 'bg-red-500/20 border-red-400/50 text-red-300'
                  : 'bg-amber-400/15 border-amber-300/50 text-amber-200 shadow-[0_0_18px_-8px_rgba(251,191,36,0.9)]'
              }`}
            >
              <Wallet className="w-4 h-4 shrink-0" />
            </span>
          </div>
          <div
            className={`font-mono-tabular text-2xl font-bold tracking-tight ${
              summary.isAffectingSavings ? 'text-red-300' : 'text-amber-100'
            }`}
          >
            {formatCurrency(summary.saldoDisponibleReal)}
          </div>
          <div className="text-xs text-stone-400">
            {summary.isAffectingSavings
              ? 'Déficit cubierto con ahorro'
              : 'Libre para gastar sin tocar metas'}
          </div>
        </div>

        {/* KPI 2: Total Ahorrado */}
        <div className="p-5 rounded-2xl surface-card lift overflow-hidden flex flex-col justify-between gap-3">
          <div className="progress-fill absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-yellow-300 to-amber-400" />
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-stone-300">
              Total Ahorrado
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onToggleHideTotalSavings}
                className="icon-button p-1.5 text-stone-400 hover:text-yellow-300 rounded-lg hover:bg-yellow-400/10 transition-colors cursor-pointer"
                aria-label={
                  hideTotalSavings
                    ? 'Mostrar total ahorrado'
                    : 'Ocultar total ahorrado'
                }
                title={
                  hideTotalSavings
                    ? 'Mostrar total ahorrado'
                    : 'Ocultar total ahorrado'
                }
              >
                {hideTotalSavings ? (
                  <Eye className="w-3.5 h-3.5" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5" />
                )}
              </button>
              <span className="icon-tile p-2 rounded-xl bg-yellow-400/15 border border-yellow-300/50 text-yellow-300 shadow-[0_0_18px_-8px_rgba(253,224,71,0.9)]">
                <PiggyBank className="w-4 h-4 shrink-0" />
              </span>
            </div>
          </div>
          <div className="font-mono-tabular text-2xl font-bold tracking-tight text-yellow-300">
            {hideTotalSavings ? '••••••' : formatCurrency(summary.totalAhorrado)}
          </div>
          <div className="text-xs text-stone-400">
            {hideTotalSavings
              ? 'Monto oculto por privacidad'
              : 'Acumulado en bolsillos y retenciones'}
          </div>
        </div>

        {/* KPI 3: Ingresos del Mes */}
        <div className="p-5 rounded-2xl surface-card lift overflow-hidden flex flex-col justify-between gap-3">
          <div className="progress-fill absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-400 to-red-500" />
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-stone-300">
              {isHistorical ? 'Ingresos del Período' : 'Ingresos del Mes'}
            </span>
            <span className="icon-tile p-2 rounded-xl bg-orange-500/20 border border-orange-300/50 text-orange-300 shadow-[0_0_18px_-8px_rgba(251,146,60,0.9)]">
              <ArrowUpRight className="w-4 h-4 shrink-0" />
            </span>
          </div>
          <div className="font-mono-tabular text-2xl font-bold tracking-tight text-orange-200">
            {formatCurrency(summary.monthIngresos)}
          </div>
          <div className="text-xs text-stone-400">
            Total histórico: {formatCurrency(summary.totalIngresos)}
          </div>
        </div>

        {/* KPI 4: Gastos del Mes */}
        <div className="p-5 rounded-2xl surface-card lift overflow-hidden flex flex-col justify-between gap-3">
          <div className="progress-fill absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-400 to-red-500" />
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-stone-300">
              {isHistorical ? 'Gastos del Período' : 'Gastos del Mes'}
            </span>
            <span className="icon-tile p-2 rounded-xl bg-orange-500/20 border border-orange-300/50 text-orange-300 shadow-[0_0_18px_-8px_rgba(251,146,60,0.9)]">
              <ArrowDownRight className="w-4 h-4 shrink-0" />
            </span>
          </div>
          <div className="font-mono-tabular text-2xl font-bold tracking-tight text-orange-300">
            {formatCurrency(summary.monthGastos)}
          </div>
          <div className="text-xs text-stone-400">
            Total histórico: {formatCurrency(summary.totalGastos)}
          </div>
        </div>
      </div>
    </section>
  );
}
