import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock,
  Edit3,
  PauseCircle,
  PlayCircle,
  Plus,
  Trash2,
} from 'lucide-react';
import { FixedExpense, Transaction } from '../types/finance';
import {
  formatCurrency,
  formatMonthLong,
  getCategoryColor,
} from '../utils/formatters';

interface FixedExpensesViewProps {
  fixedExpenses: FixedExpense[];
  transactions: Transaction[];
  targetMonth: string;
  currentAvailableBalance: number;
  onCreateFixedExpense: () => void;
  onEditFixedExpense: (fe: FixedExpense) => void;
  onToggleActive: (fe: FixedExpense) => void;
  onDeleteFixedExpense: (id: string) => void;
  onApplyFixedExpenses: (items: FixedExpense[], monthKey: string) => void;
  compact?: boolean;
  onViewAll?: () => void;
}

export function FixedExpensesView({
  fixedExpenses,
  transactions,
  targetMonth,
  currentAvailableBalance,
  onCreateFixedExpense,
  onEditFixedExpense,
  onToggleActive,
  onDeleteFixedExpense,
  onApplyFixedExpenses,
  compact = false,
  onViewAll,
}: FixedExpensesViewProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const appliedIdsForMonth = useMemo(() => {
    const set = new Set<string>();
    for (const tx of transactions) {
      if (
        tx.type === 'expense' &&
        tx.fixedExpenseId &&
        tx.date.slice(0, 7) === targetMonth
      ) {
        set.add(tx.fixedExpenseId);
      }
    }
    return set;
  }, [transactions, targetMonth]);

  const activeExpenses = useMemo(
    () => fixedExpenses.filter((fe) => fe.active),
    [fixedExpenses]
  );

  const totalMonthlyCommitment = useMemo(
    () => activeExpenses.reduce((sum, fe) => sum + fe.amount, 0),
    [activeExpenses]
  );

  const pendingExpenses = useMemo(
    () => activeExpenses.filter((fe) => !appliedIdsForMonth.has(fe.id)),
    [activeExpenses, appliedIdsForMonth]
  );

  const totalPendingAmount = useMemo(
    () => pendingExpenses.reduce((sum, fe) => sum + fe.amount, 0),
    [pendingExpenses]
  );

  // Sum the real amounts registered in the history, not the template values,
  // so editing a generated transaction is reflected correctly.
  const totalAppliedAmount = useMemo(() => {
    const activeIds = new Set(activeExpenses.map((fe) => fe.id));
    return transactions.reduce((sum, tx) => {
      if (
        tx.type === 'expense' &&
        tx.fixedExpenseId &&
        activeIds.has(tx.fixedExpenseId) &&
        tx.date.slice(0, 7) === targetMonth
      ) {
        return sum + tx.amount;
      }
      return sum;
    }, 0);
  }, [transactions, targetMonth, activeExpenses]);

  const pendingExceedsAvailable =
    totalPendingAmount > 0 && currentAvailableBalance - totalPendingAmount < 0;

  const sortedItems = useMemo(
    () =>
      [...fixedExpenses].sort((a, b) => {
        if (a.active !== b.active) return a.active ? -1 : 1;
        return a.dayOfMonth - b.dayOfMonth;
      }),
    [fixedExpenses]
  );

  const monthLabel = formatMonthLong(targetMonth);

  return (
    <section className="space-y-4">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold neon-gradient">
            Gastos Fijos Mensuales
          </h2>
          <p className="text-xs text-stone-400">
            Vivienda, alimentación, transporte y compromisos recurrentes ·{' '}
            {monthLabel}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {compact && onViewAll && (
            <button
              type="button"
              onClick={onViewAll}
              className="text-xs font-medium text-amber-300 hover:text-amber-200 flex items-center gap-1 cursor-pointer whitespace-nowrap mr-1"
            >
              <span>Gestionar fijos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {pendingExpenses.length > 0 && (
            <button
              type="button"
              onClick={() => onApplyFixedExpenses(pendingExpenses, targetMonth)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 text-xs font-semibold text-amber-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <CalendarClock className="w-3.5 h-3.5 text-amber-300" />
              <span>
                Registrar {pendingExpenses.length}{' '}
                {pendingExpenses.length === 1 ? 'pendiente' : 'pendientes'} (
                {formatCurrency(totalPendingAmount)})
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={onCreateFixedExpense}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl surface-sub hover:bg-white/5 text-xs font-medium text-stone-100 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5 text-amber-300" />
            <span>Nuevo Gasto Fijo</span>
          </button>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl surface-card lift space-y-1">
          <div className="text-xs text-stone-400">Compromiso Fijo Mensual</div>
          <div className="font-mono-tabular text-xl font-bold text-amber-100">
            {formatCurrency(totalMonthlyCommitment)}
          </div>
          <div className="text-[11px] text-stone-400">
            {activeExpenses.length}{' '}
            {activeExpenses.length === 1 ? 'gasto activo' : 'gastos activos'}
          </div>
        </div>

        <div className="p-4 rounded-2xl surface-card lift space-y-1">
          <div className="text-xs text-stone-400">
            Aplicados en {monthLabel}
          </div>
          <div className="font-mono-tabular text-xl font-bold text-yellow-300">
            {formatCurrency(totalAppliedAmount)}
          </div>
          <div className="text-[11px] text-stone-400">
            {activeExpenses.length - pendingExpenses.length} de{' '}
            {activeExpenses.length} registrados este mes
          </div>
        </div>

        <div className="p-4 rounded-2xl surface-card lift space-y-1">
          <div className="text-xs text-stone-400">
            Pendientes por Aplicar ({monthLabel})
          </div>
          <div
            className={`font-mono-tabular text-xl font-bold ${
              totalPendingAmount > 0 ? 'text-orange-300' : 'text-amber-300'
            }`}
          >
            {formatCurrency(totalPendingAmount)}
          </div>
          <div className="text-[11px] text-stone-400">
            {pendingExpenses.length === 0
              ? 'Todos los gastos fijos del mes están al día'
              : `${pendingExpenses.length} por registrar en el historial`}
          </div>
        </div>
      </div>

      {/* Warning if pending fixed expenses exceed available cash */}
      {pendingExceedsAvailable && (
        <div
          role="alert"
          className="flex items-start sm:items-center gap-3 px-4 py-3 rounded-xl bg-[#ef4444]/10 border border-[#ef4444]/40 text-xs text-red-100"
        >
          <AlertTriangle className="w-4 h-4 text-[#ef4444] shrink-0 mt-0.5 sm:mt-0" />
          <span>
            Al registrar los gastos fijos pendientes (
            <span className="font-mono-tabular font-semibold text-white">
              {formatCurrency(totalPendingAmount)}
            </span>
            ), tu saldo disponible real pasará a negativo y afectará tus metas de
            ahorro.
          </span>
        </div>
      )}

      {/* List / Empty State */}
      {sortedItems.length === 0 ? (
        <div className="p-8 rounded-2xl surface-card text-center space-y-3">
          <p className="text-sm text-stone-300">
            Aún no tienes gastos fijos configurados.
          </p>
          <p className="text-xs text-stone-400 max-w-md mx-auto">
            Registra tus compromisos fijos mensuales como vivienda, transporte o
            alimentación para aplicarlos en un clic cada mes.
          </p>
          <button
            type="button"
            onClick={onCreateFixedExpense}
            className="cta-vivid px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            Registrar Primer Gasto Fijo
          </button>
        </div>
      ) : (
        <div className="rounded-2xl surface-card divide-y divide-white/10 overflow-hidden">
          {sortedItems.map((fe) => {
            const isApplied = appliedIdsForMonth.has(fe.id);
            const isConfirming = confirmDeleteId === fe.id;
            const catColor = getCategoryColor(fe.category);

            return (
              <div
                key={fe.id}
                className={`p-4 sm:px-5 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors ${
                  fe.active ? 'hover:bg-orange-500/[0.06]' : 'opacity-65'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-sm mt-1.5 shrink-0"
                    style={{ backgroundColor: catColor }}
                  />
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-stone-100">
                        {fe.name}
                      </span>
                      <span className="text-xs text-stone-400">
                        · {fe.category} · Día {fe.dayOfMonth} ·{' '}
                        {fe.bucket === 'needs' ? 'Necesidad' : 'Deseo'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      {!fe.active ? (
                        <span className="inline-flex items-center gap-1 text-stone-400">
                          <PauseCircle className="w-3.5 h-3.5" />
                          <span>Pausado</span>
                        </span>
                      ) : isApplied ? (
                        <span className="chip border-yellow-300/40 bg-yellow-400/10 text-yellow-300">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Registrado en {monthLabel}</span>
                        </span>
                      ) : (
                        <span className="chip border-orange-300/40 bg-orange-400/10 text-orange-300">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Pendiente en {monthLabel}</span>
                        </span>
                      )}

                      {fe.note && (
                        <span className="text-stone-400 truncate">
                          · {fe.note}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 shrink-0">
                  <span className="font-mono-tabular text-sm font-bold text-[#ef4444]">
                    {formatCurrency(fe.amount)}
                    <span className="text-[11px] font-normal text-stone-400">
                      /mes
                    </span>
                  </span>

                  <div className="flex items-center gap-1.5">
                    {fe.active && !isApplied && (
                      <button
                        type="button"
                        onClick={() => onApplyFixedExpenses([fe], targetMonth)}
                        className="icon-button px-3 py-1.5 rounded-lg border border-yellow-300/40 bg-yellow-400/15 hover:bg-yellow-400/25 text-yellow-200 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Aplicar mes
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onToggleActive(fe)}
                      className="p-1.5 text-stone-400 hover:text-stone-100 rounded-md hover:bg-[#150c07] transition-colors cursor-pointer"
                      title={fe.active ? 'Pausar gasto fijo' : 'Activar gasto fijo'}
                      aria-label={
                        fe.active ? `Pausar ${fe.name}` : `Activar ${fe.name}`
                      }
                    >
                      {fe.active ? (
                        <PauseCircle className="w-4 h-4" />
                      ) : (
                        <PlayCircle className="w-4 h-4 text-[#f59e0b]" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => onEditFixedExpense(fe)}
                      className="p-1.5 text-stone-400 hover:text-stone-100 rounded-md hover:bg-[#150c07] transition-colors cursor-pointer"
                      title="Editar gasto fijo"
                      aria-label={`Editar ${fe.name}`}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {isConfirming ? (
                      <div className="inline-flex items-center gap-1.5 ml-1">
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteFixedExpense(fe.id);
                            setConfirmDeleteId(null);
                          }}
                          className="px-2.5 py-1 rounded bg-[#ef4444] text-white text-xs font-medium cursor-pointer"
                        >
                          Eliminar
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-1 text-xs text-stone-400 hover:text-white cursor-pointer"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(fe.id)}
                        className="p-1.5 text-stone-400 hover:text-[#ef4444] rounded-md hover:bg-[#150c07] transition-colors cursor-pointer"
                        title="Eliminar gasto fijo"
                        aria-label={`Eliminar ${fe.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
