import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Edit3,
  Plus,
  Trash2,
} from 'lucide-react';
import { PocketIconKey, PocketWithBalance, SavingsPocket } from '../types/finance';
import { formatCurrency, formatDateSpanish } from '../utils/formatters';
import { PocketIcon } from './PocketIcon';

const ICON_ACCENTS: Record<PocketIconKey, string> = {
  shield: 'from-amber-300 to-red-500',
  plane: 'from-orange-400 to-red-500',
  trending: 'from-yellow-300 to-amber-500',
  home: 'from-orange-300 to-red-500',
  laptop: 'from-amber-300 to-orange-500',
  heart: 'from-orange-400 to-red-500',
  graduation: 'from-red-400 to-red-500',
  car: 'from-orange-300 to-amber-500',
};

interface SavingsPocketsSectionProps {
  pockets: PocketWithBalance[];
  onCreatePocket: () => void;
  onEditPocket: (pocket: SavingsPocket) => void;
  onDeletePocket: (id: string) => void;
  onDepositToPocket: (pocketId: string) => void;
  compact?: boolean;
  onViewAll?: () => void;
}

export function SavingsPocketsSection({
  pockets,
  onCreatePocket,
  onEditPocket,
  onDeletePocket,
  onDepositToPocket,
  compact = false,
  onViewAll,
}: SavingsPocketsSectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold neon-gradient">
            Bolsillos y Metas de Ahorro
          </h2>
          <p className="text-xs text-stone-400">
            Seguimiento de objetivos con cálculo automático de cuota mensual y quincenal
          </p>
        </div>

        <div className="flex items-center gap-3">
          {compact && onViewAll && (
            <button
              type="button"
              onClick={onViewAll}
              className="text-xs font-medium text-amber-300 hover:text-amber-200 flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <span>Ver gestión completa</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={onCreatePocket}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl surface-sub hover:bg-white/5 text-xs font-medium text-stone-100 transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <Plus className="w-3.5 h-3.5 text-amber-300" />
            <span>Nueva Meta</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {pockets.map((pocket) => {
          const canDelete = pockets.length > 1;
          return (
            <div
              key={pocket.id}
              className="p-5 rounded-2xl surface-card lift overflow-hidden flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`icon-tile w-10 h-10 rounded-xl bg-gradient-to-br ${ICON_ACCENTS[pocket.icon]} border border-white/25 flex items-center justify-center text-white shrink-0 shadow-[0_0_20px_-8px_rgba(251,146,60,0.9)]`}
                    >
                      <PocketIcon icon={pocket.icon} className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-white truncate">
                        {pocket.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-stone-400">
                        <Calendar className="w-3 h-3 shrink-0" />
                        <span>Meta: {formatDateSpanish(pocket.deadline)}</span>
                        {pocket.isPrimary && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-amber-300 font-medium">
                              Principal
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onEditPocket(pocket)}
                      className="icon-button p-1.5 text-stone-400 hover:text-orange-200 rounded-md hover:bg-orange-500/10 transition-colors cursor-pointer"
                      aria-label={`Editar ${pocket.name}`}
                      title="Editar meta"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => onDeletePocket(pocket.id)}
                        className="icon-button p-1.5 text-stone-400 hover:text-red-300 rounded-md hover:bg-red-500/10 transition-colors cursor-pointer"
                        aria-label={`Eliminar ${pocket.name}`}
                        title="Eliminar meta (los fondos pasan al bolsillo principal)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Amounts & Progress */}
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-mono-tabular text-xl font-bold text-white">
                      {formatCurrency(pocket.currentAmount)}
                    </span>
                    <span className="font-mono-tabular text-xs text-stone-400">
                      de {formatCurrency(pocket.targetAmount)}
                    </span>
                  </div>

                  <div className="h-2.5 w-full rounded-full bg-[#150c07] border border-white/10 overflow-hidden">
                    <div
                      className="progress-fill h-full rounded-full bg-gradient-to-r from-yellow-300 via-amber-300 to-orange-400 shadow-[0_0_14px_-4px_rgba(251,191,36,0.9)] transition-all duration-300"
                      style={{ width: `${Math.min(100, pocket.progressPercent)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono-tabular font-semibold text-orange-300">
                      {pocket.progressPercent}% completado
                    </span>
                    <span className="font-mono-tabular text-stone-400">
                      Falta: {formatCurrency(pocket.remainingAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Monthly / Biweekly Guidance & Quick Deposit */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
                {pocket.isCompleted ? (
                  <div className="flex items-center gap-1.5 text-xs font-medium text-amber-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Meta alcanzada</span>
                  </div>
                ) : (
                  <div className="text-[11px] text-stone-400 leading-snug">
                    <div>
                      Cuota sugerida:{' '}
                      <span className="font-mono-tabular text-stone-200 font-medium">
                        {formatCurrency(pocket.monthlyRequired)}/mes
                      </span>
                    </div>
                    <div className="font-mono-tabular text-stone-400">
                      o {formatCurrency(pocket.biweeklyRequired)}/quincena
                      {pocket.isOverdue && (
                        <span className="text-amber-400 ml-1.5">
                          · Plazo vencido (cuota para 1 mes)
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => onDepositToPocket(pocket.id)}
                  className="icon-button cta-vivid px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
                >
                  Abonar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
