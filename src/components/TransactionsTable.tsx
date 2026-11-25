import { useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowLeftRight,
  ArrowUpRight,
  ChevronDown,
  Edit3,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import {
  SavingsPocket,
  Transaction,
  TransactionType,
} from '../types/finance';
import {
  formatCurrency,
  formatDateSpanish,
  formatMonthLong,
} from '../utils/formatters';

interface TransactionsTableProps {
  transactions: Transaction[];
  pockets: SavingsPocket[];
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onOpenNewTransaction: () => void;
  limit?: number;
  onViewAll?: () => void;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

export function TransactionsTable({
  transactions,
  pockets,
  selectedMonth,
  onMonthChange,
  onEditTransaction,
  onDeleteTransaction,
  onOpenNewTransaction,
  limit,
  onViewAll,
  collapsible = true,
  defaultExpanded = true,
}: TransactionsTableProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const pocketMap = useMemo(() => {
    const map = new Map<string, string>();
    pockets.forEach((p) => map.set(p.id, p.name));
    return map;
  }, [pockets]);

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((tx) => set.add(tx.date.slice(0, 7)));
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((tx) => set.add(tx.category));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [transactions]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transactions
      .filter((tx) => {
        if (selectedMonth !== 'all' && tx.date.slice(0, 7) !== selectedMonth) {
          return false;
        }
        if (typeFilter !== 'all' && tx.type !== typeFilter) {
          return false;
        }
        if (categoryFilter !== 'all' && tx.category !== categoryFilter) {
          return false;
        }
        if (q) {
          const pocketName = tx.pocketId ? pocketMap.get(tx.pocketId) ?? '' : '';
          const haystack = `${tx.category} ${tx.note} ${pocketName}`.toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  }, [transactions, selectedMonth, typeFilter, categoryFilter, search, pocketMap]);

  const visibleRows = limit ? filtered.slice(0, limit) : filtered;

  const renderTypeInfo = (tx: Transaction) => {
    if (tx.type === 'income') {
      return (
        <span className="chip border-yellow-300/40 bg-yellow-400/10 text-yellow-300">
          <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
          <span>Ingreso</span>
        </span>
      );
    }
    if (tx.type === 'expense') {
      return (
        <span className="chip border-orange-300/40 bg-orange-400/10 text-orange-300">
          <ArrowDownRight className="w-3.5 h-3.5 shrink-0" />
          <span>Gasto</span>
        </span>
      );
    }
    return (
      <span className="chip border-amber-300/40 bg-amber-400/10 text-amber-300">
        <ArrowLeftRight className="w-3.5 h-3.5 shrink-0" />
        <span>Ahorro</span>
      </span>
    );
  };

  const renderSubDetail = (tx: Transaction) => {
    const pocketName = tx.pocketId ? pocketMap.get(tx.pocketId) : undefined;
    if (tx.type === 'income' && (tx.retainedAmount ?? 0) > 0) {
      return `Retención ${tx.retentionPercent ?? 0}% (${formatCurrency(
        tx.retainedAmount ?? 0
      )})${pocketName ? ` → ${pocketName}` : ''}`;
    }
    if (tx.type === 'expense' && (tx.roundUpAmount ?? 0) > 0) {
      return `Redondeo +${formatCurrency(tx.roundUpAmount ?? 0)}${
        pocketName ? ` → ${pocketName}` : ''
      }`;
    }
    if (tx.type === 'transfer' && pocketName) {
      return `Destino: ${pocketName}`;
    }
    return null;
  };

  return (
    <section className="rounded-2xl surface-card overflow-hidden">
      {/* Header & Filter Controls */}
      <div
        className={`p-5 space-y-4 ${
          isExpanded ? 'border-b border-white/10' : ''
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {collapsible ? (
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              aria-expanded={isExpanded}
              className="flex items-center gap-3 text-left group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-lg"
            >
              <span className="p-1.5 rounded-lg surface-sub text-amber-300 group-hover:text-white transition-colors">
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isExpanded ? 'rotate-180' : 'rotate-0'
                  }`}
                />
              </span>
              <div>
                <h2 className="text-base font-semibold text-white transition-colors">
                  Historial de Movimientos
                </h2>
                <p className="text-xs text-stone-400">
                  {filtered.length}{' '}
                  {filtered.length === 1 ? 'registro' : 'registros'} encontrados
                  {!isExpanded && ' · Haz clic para desplegar'}
                </p>
              </div>
            </button>
          ) : (
            <div>
              <h2 className="text-base font-semibold neon-gradient">
                Historial de Movimientos
              </h2>
              <p className="text-xs text-stone-400">
                {filtered.length}{' '}
                {filtered.length === 1 ? 'registro' : 'registros'} encontrados
              </p>
            </div>
          )}

          <div className="flex items-center gap-3">
            {collapsible && (
              <button
                type="button"
                onClick={() => setIsExpanded((prev) => !prev)}
                className="text-xs font-medium text-amber-300 hover:text-amber-200 cursor-pointer whitespace-nowrap"
              >
                {isExpanded ? 'Contraer' : 'Desplegar'}
              </button>
            )}
            {isExpanded && limit && onViewAll && filtered.length > limit && (
              <button
                type="button"
                onClick={onViewAll}
                className="text-xs font-medium text-amber-400 hover:text-amber-300 cursor-pointer whitespace-nowrap"
              >
                Ver todos ({filtered.length})
              </button>
            )}
            <button
              type="button"
              onClick={onOpenNewTransaction}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl surface-sub hover:bg-white/5 text-xs font-medium text-stone-100 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5 text-amber-300" />
              <span>Agregar</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        {isExpanded && (
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Segmented Type Filter */}
            <div className="inline-flex items-center p-1 rounded-xl surface-sub overflow-x-auto max-w-full">
              {(
                [
                  { id: 'all', label: 'Todos' },
                  { id: 'income', label: 'Ingresos' },
                  { id: 'expense', label: 'Gastos' },
                  { id: 'transfer', label: 'Transferencias' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTypeFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    typeFilter === tab.id
                      ? 'bg-orange-500/25 text-orange-100 border border-orange-300/50 shadow-[0_0_16px_-8px_rgba(251,146,60,0.9)]'
                      : 'text-stone-400 hover:text-orange-200 border border-transparent'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search + Month + Category */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative flex-1 sm:w-52">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -transtone-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar nota o categoría..."
                  className="w-full pl-8 pr-3 py-2 rounded-xl surface-sub text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-orange-400"
                />
              </div>

              <select
                value={selectedMonth}
                onChange={(e) => onMonthChange(e.target.value)}
                aria-label="Filtrar por mes"
                className="px-3 py-2 rounded-xl surface-sub text-xs text-stone-200 focus:outline-none focus:border-orange-400"
              >
                <option value="all">Todos los meses</option>
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    {formatMonthLong(m)}
                  </option>
                ))}
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                aria-label="Filtrar por categoría"
                className="px-3 py-2 rounded-xl surface-sub text-xs text-stone-200 focus:outline-none focus:border-orange-400"
              >
                <option value="all">Todas las categorías</option>
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Empty State & Rows */}
      {isExpanded &&
        (visibleRows.length === 0 ? (
        <div className="p-10 text-center space-y-3">
          <p className="text-sm text-stone-400">
            No hay movimientos que coincidan con los filtros actuales.
          </p>
          <button
            type="button"
            onClick={onOpenNewTransaction}
            className="cta-vivid px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer"
          >
            Registrar Movimiento
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Compact Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[11px] font-medium text-stone-400 bg-white/[0.02]">
                  <th className="py-3 px-5">Fecha</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Categoría y Detalle</th>
                  <th className="py-3 px-4 text-right">Monto</th>
                  <th className="py-3 px-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-sm">
                {visibleRows.map((tx) => {
                  const subDetail = renderSubDetail(tx);
                  const isConfirming = confirmDeleteId === tx.id;
                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-orange-500/[0.07] transition-colors"
                    >
                      <td className="py-3 px-5 font-mono-tabular text-xs text-stone-400 whitespace-nowrap">
                        {formatDateSpanish(tx.date)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {renderTypeInfo(tx)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm font-medium text-stone-100">
                          {tx.category}
                          {tx.note && (
                            <span className="text-stone-400 font-normal">
                              {' '}
                              · {tx.note}
                            </span>
                          )}
                        </div>
                        {subDetail && (
                          <div className="text-xs text-yellow-300 mt-0.5 font-mono-tabular">
                            {subDetail}
                          </div>
                        )}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-mono-tabular font-semibold whitespace-nowrap ${
                          tx.type === 'income'
                            ? 'text-yellow-300'
                            : tx.type === 'expense'
                            ? 'text-orange-300'
                            : 'text-amber-300'
                        }`}
                      >
                        {tx.type === 'income'
                          ? '+'
                          : tx.type === 'expense'
                          ? '-'
                          : ''}
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="py-3 px-5 text-right whitespace-nowrap">
                        {isConfirming ? (
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                onDeleteTransaction(tx.id);
                                setConfirmDeleteId(null);
                              }}
                              className="px-2.5 py-1 rounded bg-[#ef4444] text-white text-xs font-medium cursor-pointer"
                            >
                              Confirmar
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1 rounded text-xs text-stone-400 hover:text-stone-200 cursor-pointer"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => onEditTransaction(tx)}
                              className="icon-button p-1.5 text-stone-400 hover:text-orange-100 rounded-md hover:bg-orange-500/10 transition-colors cursor-pointer"
                              aria-label="Editar movimiento"
                              title="Editar"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(tx.id)}
                              className="icon-button p-1.5 text-stone-400 hover:text-red-300 rounded-md hover:bg-red-500/10 transition-colors cursor-pointer"
                              aria-label="Eliminar movimiento"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="md:hidden divide-y divide-[#4a2e1b]/70">
            {visibleRows.map((tx) => {
              const subDetail = renderSubDetail(tx);
              const isConfirming = confirmDeleteId === tx.id;
              return (
                <div key={tx.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs text-stone-400">
                        {renderTypeInfo(tx)}
                        <span aria-hidden="true">·</span>
                        <span className="font-mono-tabular">
                          {formatDateSpanish(tx.date)}
                        </span>
                      </div>
                      <div className="text-sm font-medium text-stone-100 mt-1">
                        {tx.category}
                      </div>
                      {tx.note && (
                        <div className="text-xs text-stone-400">{tx.note}</div>
                      )}
                      {subDetail && (
                        <div className="text-xs text-yellow-300 mt-1 font-mono-tabular">
                          {subDetail}
                        </div>
                      )}
                    </div>

                    <div
                      className={`font-mono-tabular text-sm font-semibold shrink-0 ${
                        tx.type === 'income'
                          ? 'text-yellow-300'
                          : tx.type === 'expense'
                          ? 'text-orange-300'
                          : 'text-amber-300'
                      }`}
                    >
                      {tx.type === 'income'
                        ? '+'
                        : tx.type === 'expense'
                        ? '-'
                        : ''}
                      {formatCurrency(tx.amount)}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-1">
                    {isConfirming ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteTransaction(tx.id);
                            setConfirmDeleteId(null);
                          }}
                          className="px-3 py-1.5 rounded bg-[#ef4444] text-white text-xs font-medium"
                        >
                          Confirmar eliminación
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-xs text-stone-400"
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => onEditTransaction(tx)}
                          className="text-xs text-stone-300 hover:text-white flex items-center gap-1 py-1 px-2"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(tx.id)}
                          className="text-xs text-stone-400 hover:text-orange-300 flex items-center gap-1 py-1 px-2"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Eliminar</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ))}
    </section>
  );
}
