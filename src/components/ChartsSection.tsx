import { useState } from 'react';
import { CategoryBreakdownItem, MonthlyMetric } from '../types/finance';
import { formatCurrency, formatMonthLong } from '../utils/formatters';

interface ChartsSectionProps {
  monthlyMetrics: MonthlyMetric[];
  categoryBreakdown: CategoryBreakdownItem[];
  selectedMonth: string;
  onQuickAddExpense: () => void;
}

export function ChartsSection({
  monthlyMetrics,
  categoryBreakdown,
  selectedMonth,
  onQuickAddExpense,
}: ChartsSectionProps) {
  const [hoveredMonthKey, setHoveredMonthKey] = useState<string | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Monthly Bar Chart geometry
  const maxVal = Math.max(
    1,
    ...monthlyMetrics.flatMap((m) => [m.ingresos, m.gastos, m.ahorro])
  );
  const ceiling = Math.ceil(maxVal * 1.12);
  const svgW = 640;
  const svgH = 240;
  const padL = 12;
  const padR = 12;
  const padT = 18;
  const padB = 34;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;
  const groupW = plotW / Math.max(1, monthlyMetrics.length);
  const barW = Math.min(18, Math.max(10, groupW * 0.2));
  const barGap = 4;

  const activeMonth =
    (hoveredMonthKey
      ? monthlyMetrics.find((m) => m.monthKey === hoveredMonthKey)
      : undefined) ?? monthlyMetrics[monthlyMetrics.length - 1];

  // Donut Chart geometry
  const totalExpenses = categoryBreakdown.reduce((acc, c) => acc + c.amount, 0);
  const donutSize = 188;
  const strokeW = 24;
  const radius = (donutSize - strokeW) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativeFraction = 0;
  const donutSegments = categoryBreakdown.map((item) => {
    const fraction = totalExpenses > 0 ? item.amount / totalExpenses : 0;
    const dashLength = fraction * circumference;
    const dashOffset = -cumulativeFraction * circumference;
    cumulativeFraction += fraction;
    return {
      ...item,
      dashLength,
      dashOffset,
    };
  });

  const activeCategoryItem = hoveredCategory
    ? categoryBreakdown.find((c) => c.category === hoveredCategory) ?? null
    : null;

  return (
    <section className="grid grid-cols-1 xl:grid-cols-12 gap-5">
      {/* Left: Monthly Cashflow Grouped Bar Chart (7 cols) */}
      <div className="xl:col-span-7 p-5 rounded-2xl surface-card lift flex flex-col justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold neon-gradient">
              Flujo Mensual Comparativo
            </h2>
            <p className="text-xs text-stone-400">
              Ingresos vs. Gastos vs. Ahorro efectivo (últimos 6 meses)
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs text-stone-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-tr from-red-500 to-orange-300" />
              <span>Ingresos</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-tr from-red-500 to-orange-300" />
              <span>Gastos</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-tr from-amber-400 to-yellow-300" />
              <span>Ahorro</span>
            </span>
          </div>
        </div>

        {/* Interactive Readout Bar */}
        {activeMonth && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl surface-sub text-xs">
            <span className="font-medium text-amber-200">
              {formatMonthLong(activeMonth.monthKey)}
            </span>
            <div className="flex flex-wrap items-center gap-4 font-mono-tabular">
              <span className="text-orange-300">
                Ingresos: {formatCurrency(activeMonth.ingresos)}
              </span>
              <span className="text-orange-300">
                Gastos: {formatCurrency(activeMonth.gastos)}
              </span>
              <span className="text-yellow-300">
                Ahorro: {formatCurrency(activeMonth.ahorro)}
              </span>
            </div>
          </div>
        )}

        <div className="w-full overflow-hidden">
          <svg
            viewBox={`0 0 ${svgW} ${svgH}`}
            className="w-full h-56 select-none"
            role="img"
            aria-label="Gráfico comparativo de ingresos, gastos y ahorro por mes"
          >
            <defs>
              <linearGradient id="grad-income" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f9a8d4" />
                <stop offset="100%" stopColor="#f97316" />
              </linearGradient>
              <linearGradient id="grad-expense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fb923c" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
              <linearGradient id="grad-savings" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a3e635" />
                <stop offset="100%" stopColor="#facc15" />
              </linearGradient>
            </defs>

            {/* Horizontal grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
              const y = padT + plotH * (1 - tick);
              return (
                <line
                  key={tick}
                  x1={padL}
                  x2={svgW - padR}
                  y1={y}
                  y2={y}
                  stroke="#4a2e1b"
                  strokeOpacity={tick === 0 ? 0.85 : 0.35}
                  strokeDasharray={tick === 0 ? undefined : '3 5'}
                />
              );
            })}

            {monthlyMetrics.map((m, idx) => {
              const centerX = padL + groupW * idx + groupW / 2;
              const totalGroupBarsW = barW * 3 + barGap * 2;
              const startX = centerX - totalGroupBarsW / 2;
              const isHovered = hoveredMonthKey === m.monthKey;

              const hIncome = (m.ingresos / ceiling) * plotH;
              const hExpense = (m.gastos / ceiling) * plotH;
              const hSavings = (m.ahorro / ceiling) * plotH;

              return (
                <g
                  key={m.monthKey}
                  onMouseEnter={() => setHoveredMonthKey(m.monthKey)}
                  onMouseLeave={() => setHoveredMonthKey(null)}
                  className="cursor-pointer"
                >
                  {/* Hover column highlight */}
                  <rect
                    x={padL + groupW * idx + 4}
                    y={padT}
                    width={Math.max(10, groupW - 8)}
                    height={plotH}
                    rx={8}
                    fill="#facc15"
                    fillOpacity={isHovered ? 0.08 : 0}
                    className="chart-bar transition-opacity duration-150"
                  />

                  {/* Ingresos Bar */}
                  <rect
                    x={startX}
                    y={padT + plotH - hIncome}
                    width={barW}
                    height={Math.max(2, hIncome)}
                    rx={4}
                    fill="url(#grad-income)"
                    fillOpacity={hoveredMonthKey !== null && !isHovered ? 0.45 : 1}
                    className="chart-bar transition-opacity duration-150"
                  />

                  {/* Gastos Bar */}
                  <rect
                    x={startX + barW + barGap}
                    y={padT + plotH - hExpense}
                    width={barW}
                    height={Math.max(2, hExpense)}
                    rx={4}
                    fill="url(#grad-expense)"
                    fillOpacity={hoveredMonthKey !== null && !isHovered ? 0.45 : 1}
                    className="chart-bar transition-opacity duration-150"
                  />

                  {/* Ahorro Bar */}
                  <rect
                    x={startX + (barW + barGap) * 2}
                    y={padT + plotH - hSavings}
                    width={barW}
                    height={Math.max(2, hSavings)}
                    rx={4}
                    fill="url(#grad-savings)"
                    fillOpacity={hoveredMonthKey !== null && !isHovered ? 0.45 : 1}
                    className="chart-bar transition-opacity duration-150"
                  />

                  <text
                    x={centerX}
                    y={svgH - 10}
                    textAnchor="middle"
                    fill={isHovered ? '#fde68a' : '#c9a27a'}
                    fontSize="11"
                    fontWeight={isHovered ? '600' : '400'}
                  >
                    {m.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Right: Expense Category Donut Chart (5 cols) */}
      <div className="xl:col-span-5 p-5 rounded-2xl surface-card lift flex flex-col justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold neon-gradient">
            Distribución de Gastos
          </h2>
          <p className="text-xs text-stone-400">
            {selectedMonth === 'all'
              ? 'Histórico acumulado por categoría'
              : `Categorías en ${formatMonthLong(selectedMonth)}`}
          </p>
        </div>

        {categoryBreakdown.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-10 text-center gap-3">
            <p className="text-sm text-stone-400 max-w-xs">
              Aún no hay gastos registrados para este período.
            </p>
            <button
              type="button"
              onClick={onQuickAddExpense}
              className="px-4 py-2 rounded-xl surface-sub hover:bg-white/5 text-xs font-medium text-amber-300 transition-colors cursor-pointer"
            >
              Registrar primer gasto
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-6 flex-1">
            {/* Donut SVG */}
            <div className="relative shrink-0 flex items-center justify-center">
              <svg
                width={donutSize}
                height={donutSize}
                viewBox={`0 0 ${donutSize} ${donutSize}`}
                className="-rotate-90"
                role="img"
                aria-label="Gráfico de dona de gastos por categoría"
              >
                <circle
                  cx={donutSize / 2}
                  cy={donutSize / 2}
                  r={radius}
                  fill="transparent"
                  stroke="#150c07"
                  strokeWidth={strokeW}
                />
                {donutSegments.map((seg) => {
                  const isDimmed =
                    hoveredCategory !== null && hoveredCategory !== seg.category;
                  return (
                    <circle
                      key={seg.category}
                      cx={donutSize / 2}
                      cy={donutSize / 2}
                      r={radius}
                      fill="transparent"
                      stroke={seg.color}
                      strokeWidth={hoveredCategory === seg.category ? strokeW + 4 : strokeW}
                      strokeDasharray={`${Math.max(0, seg.dashLength - 2)} ${circumference}`}
                      strokeDashoffset={seg.dashOffset}
                      strokeOpacity={isDimmed ? 0.3 : 1}
                      className="cursor-pointer transition-all duration-150"
                      onMouseEnter={() => setHoveredCategory(seg.category)}
                      onMouseLeave={() => setHoveredCategory(null)}
                    />
                  );
                })}
              </svg>

              {/* Center Metric */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
                <span className="text-[11px] text-stone-400 truncate max-w-[110px]">
                  {activeCategoryItem ? activeCategoryItem.category : 'Total Gastos'}
                </span>
                <span className="font-mono-tabular text-sm font-bold text-white mt-0.5">
                  {formatCurrency(
                    activeCategoryItem ? activeCategoryItem.amount : totalExpenses
                  )}
                </span>
                {activeCategoryItem && (
                  <span className="font-mono-tabular text-[11px] text-amber-300 mt-0.5">
                    {activeCategoryItem.percentage}%
                  </span>
                )}
              </div>
            </div>

            {/* Ranked Legend */}
            <div className="w-full flex-1 space-y-2 max-h-52 overflow-y-auto pr-1">
              {categoryBreakdown.map((item) => {
                const isActive = hoveredCategory === item.category;
                return (
                  <div
                    key={item.category}
                    onMouseEnter={() => setHoveredCategory(item.category)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                      isActive ? 'bg-white/10' : 'hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-sm shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-stone-200 truncate">
                        {item.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5 font-mono-tabular shrink-0">
                      <span className="text-stone-400">{item.percentage}%</span>
                      <span className="text-white font-medium">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
