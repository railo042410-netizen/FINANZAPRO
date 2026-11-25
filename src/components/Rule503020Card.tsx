import { CheckCircle2, Info, AlertCircle } from 'lucide-react';
import { Rule503020Summary } from '../types/finance';
import { formatCurrency, formatMonthLong } from '../utils/formatters';

interface Rule503020CardProps {
  rule: Rule503020Summary;
  selectedMonth: string;
}

export function Rule503020Card({ rule, selectedMonth }: Rule503020CardProps) {
  const hasIncome = rule.referenceIncome > 0;
  const noIncomeStatus = {
    label: 'Sin base de ingresos',
    tone: 'text-stone-400',
    icon: Info,
  };
  const buckets = [
    {
      key: 'needs',
      title: 'Necesidades',
      targetPercent: 50,
      actualPercent: rule.needsPercent,
      amount: rule.needsAmount,
      barColor: 'bg-gradient-to-r from-amber-300 via-orange-400 to-red-500',
      description: 'Vivienda, alimentación, transporte, servicios, salud',
      status: !hasIncome
        ? noIncomeStatus
        : rule.needsPercent <= 50
          ? { label: 'Dentro de meta', tone: 'text-amber-400', icon: CheckCircle2 }
          : { label: 'Sobre el 50% ideal', tone: 'text-amber-400', icon: AlertCircle },
    },
    {
      key: 'wants',
      title: 'Deseos y Estilo de Vida',
      targetPercent: 30,
      actualPercent: rule.wantsPercent,
      amount: rule.wantsAmount,
      barColor: 'bg-gradient-to-r from-amber-300 via-orange-400 to-red-500',
      description: 'Ocio, restaurantes, compras, suscripciones, viajes',
      status: !hasIncome
        ? noIncomeStatus
        : rule.wantsPercent <= 30
          ? { label: 'Dentro de meta', tone: 'text-amber-400', icon: CheckCircle2 }
          : { label: 'Sobre el 30% ideal', tone: 'text-red-400', icon: AlertCircle },
    },
    {
      key: 'savings',
      title: 'Ahorro e Inversión',
      targetPercent: 20,
      actualPercent: rule.savingsPercent,
      amount: rule.savingsAmount,
      barColor: 'bg-gradient-to-r from-yellow-300 via-amber-400 to-amber-400',
      description: 'Retenciones automáticas, redondeos y aportes a metas',
      status: !hasIncome
        ? noIncomeStatus
        : rule.savingsPercent >= 20
          ? { label: 'Meta cumplida', tone: 'text-amber-400', icon: CheckCircle2 }
          : { label: 'Por debajo del 20%', tone: 'text-amber-400', icon: Info },
    },
  ];

  const periodText =
    selectedMonth === 'all' ? 'Histórico' : formatMonthLong(selectedMonth);

  return (
    <section className="p-5 rounded-2xl surface-card lift space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold neon-gradient">
            Equilibrio Financiero — Regla 50 / 30 / 20
          </h2>
          <p className="text-xs text-stone-400">
            Comparación de tu comportamiento real frente a la distribución ideal ({periodText})
          </p>
        </div>

        <div className="text-xs text-stone-400 font-mono-tabular">
          Base de ingresos:{' '}
          <span className="text-amber-300 font-semibold">
            {formatCurrency(rule.referenceIncome)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-1">
        {buckets.map((bucket) => {
          const StatusIcon = bucket.status.icon;
          const clampedWidth = Math.min(100, bucket.actualPercent);
          const idealAmount = (rule.referenceIncome * bucket.targetPercent) / 100;

          return (
            <div key={bucket.key} className="space-y-2.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium text-white">
                  {bucket.title}
                </span>
                <span className="font-mono-tabular text-sm font-semibold text-white">
                  {bucket.actualPercent}%{' '}
                  <span className="text-xs font-normal text-stone-400">
                    / {bucket.targetPercent}% meta
                  </span>
                </span>
              </div>

              {/* Progress bar with ideal target notch */}
              <div className="relative h-2.5 w-full rounded-full bg-[#150c07] border border-white/10 overflow-visible">
                <div
                  className={`progress-fill h-full rounded-full ${bucket.barColor} transition-all duration-300 shadow-[0_0_14px_-4px_currentColor]`}
                  style={{ width: `${clampedWidth}%` }}
                />
                <div
                  className="absolute -top-1 -bottom-1 w-0.5 bg-white shadow-[0_0_12px_2px_rgba(255,255,255,0.8)]"
                  style={{ left: `${bucket.targetPercent}%` }}
                  title={`Meta ideal: ${bucket.targetPercent}%`}
                />
              </div>

              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-mono-tabular text-stone-300">
                  {formatCurrency(bucket.amount)}
                  {rule.referenceIncome > 0 && (
                    <span className="text-stone-500">
                      {' '}
                      (ideal {formatCurrency(idealAmount)})
                    </span>
                  )}
                </span>
                <span className={`flex items-center gap-1 font-medium ${bucket.status.tone}`}>
                  <StatusIcon className="w-3.5 h-3.5 shrink-0" />
                  <span>{bucket.status.label}</span>
                </span>
              </div>

              <p className="text-[11px] text-stone-400 leading-relaxed">
                {bucket.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
