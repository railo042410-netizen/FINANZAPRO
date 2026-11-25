import {
  CategoryBreakdownItem,
  FinancialSummary,
  MonthlyMetric,
  PocketWithBalance,
  Rule503020Summary,
  SavingsPocket,
  Transaction,
} from '../types/finance';
import {
  formatMonthShort,
  getCategoryColor,
  getDefaultBucketForCategory,
  getTodayISO,
} from './formatters';

/**
 * Computes round-up spare change toward the next multiple of `step`.
 * Example: amount = 18400, step = 5000 => roundedTarget = 20000, roundUpAmount = 1600.
 */
export function calculateRoundUp(amount: number, step: number): {
  roundedTotal: number;
  roundUpAmount: number;
} {
  if (amount <= 0 || step <= 0) {
    return { roundedTotal: amount, roundUpAmount: 0 };
  }
  const remainder = amount % step;
  if (remainder === 0) {
    return { roundedTotal: amount, roundUpAmount: 0 };
  }
  const roundUpAmount = step - remainder;
  return {
    roundedTotal: amount + roundUpAmount,
    roundUpAmount,
  };
}

/**
 * Computes the Golden Rule financial summary:
 * - Total Ahorrado = Retentions + Round-ups + Transfers to pockets
 * - Saldo Disponible Real = Total Ingresos - Total Gastos - Total Ahorrado
 * - Patrimonio Total = Saldo Disponible Real + Total Ahorrado (= Total Ingresos - Total Gastos)
 */
export function calculateFinancialSummary(
  transactions: Transaction[],
  selectedMonth: string
): FinancialSummary {
  let totalIngresos = 0;
  let totalGastos = 0;
  let totalAhorrado = 0;

  let monthIngresos = 0;
  let monthGastos = 0;
  let monthAhorrado = 0;

  for (const tx of transactions) {
    const txMonth = tx.date.slice(0, 7);
    // 'all' means the monthly fields hold cumulative historical totals.
    const inSelectedMonth = selectedMonth === 'all' || txMonth === selectedMonth;

    if (tx.type === 'income') {
      totalIngresos += tx.amount;
      const retained = tx.retainedAmount ?? 0;
      totalAhorrado += retained;
      if (inSelectedMonth) {
        monthIngresos += tx.amount;
        monthAhorrado += retained;
      }
    } else if (tx.type === 'expense') {
      totalGastos += tx.amount;
      const roundUp = tx.roundUpAmount ?? 0;
      totalAhorrado += roundUp;
      if (inSelectedMonth) {
        monthGastos += tx.amount;
        monthAhorrado += roundUp;
      }
    } else if (tx.type === 'transfer') {
      totalAhorrado += tx.amount;
      if (inSelectedMonth) {
        monthAhorrado += tx.amount;
      }
    }
  }

  const saldoDisponibleReal = totalIngresos - totalGastos - totalAhorrado;
  const patrimonioTotal = saldoDisponibleReal + totalAhorrado;
  const isAffectingSavings = saldoDisponibleReal < 0;
  const savingsDeficit = isAffectingSavings ? Math.abs(saldoDisponibleReal) : 0;

  return {
    patrimonioTotal,
    saldoDisponibleReal,
    totalAhorrado,
    totalIngresos,
    totalGastos,
    monthIngresos,
    monthGastos,
    monthAhorrado,
    isAffectingSavings,
    savingsDeficit,
  };
}

/**
 * Derives every pocket's current balance strictly from transactions so edits/deletes stay consistent.
 */
export function calculatePocketsWithBalances(
  pockets: SavingsPocket[],
  transactions: Transaction[],
  referenceDateISO: string = getTodayISO()
): PocketWithBalance[] {
  const primaryPocket = pockets.find((p) => p.isPrimary) ?? pockets[0];
  const balanceMap = new Map<string, number>();

  for (const pocket of pockets) {
    balanceMap.set(pocket.id, 0);
  }

  for (const tx of transactions) {
    const targetId =
      tx.pocketId && balanceMap.has(tx.pocketId)
        ? tx.pocketId
        : primaryPocket?.id;

    if (!targetId) continue;

    if (tx.type === 'income' && (tx.retainedAmount ?? 0) > 0) {
      balanceMap.set(targetId, (balanceMap.get(targetId) ?? 0) + (tx.retainedAmount ?? 0));
    } else if (tx.type === 'expense' && (tx.roundUpAmount ?? 0) > 0) {
      balanceMap.set(targetId, (balanceMap.get(targetId) ?? 0) + (tx.roundUpAmount ?? 0));
    } else if (tx.type === 'transfer') {
      balanceMap.set(targetId, (balanceMap.get(targetId) ?? 0) + tx.amount);
    }
  }

  const refDate = new Date(`${referenceDateISO}T00:00:00`);

  return pockets.map((pocket) => {
    const currentAmount = balanceMap.get(pocket.id) ?? 0;
    const progressPercent =
      pocket.targetAmount > 0
        ? Math.min(100, Math.round((currentAmount / pocket.targetAmount) * 1000) / 10)
        : 0;
    const remainingAmount = Math.max(0, pocket.targetAmount - currentAmount);
    const isCompleted = pocket.targetAmount > 0 && currentAmount >= pocket.targetAmount;

    const deadlineDate = new Date(`${pocket.deadline}T00:00:00`);
    const msDiff = deadlineDate.getTime() - refDate.getTime();
    const daysRemaining = Math.ceil(msDiff / (1000 * 60 * 60 * 24));
    const isOverdue = !isCompleted && daysRemaining < 0;

    // Overdue goals still get a one-month suggested contribution, shown as such.
    const monthsLeft = daysRemaining <= 0 ? 1 : Math.max(1, Math.ceil(daysRemaining / 30));
    const biweeksLeft = daysRemaining <= 0 ? 1 : Math.max(1, Math.ceil(daysRemaining / 15));

    const monthlyRequired = isCompleted
      ? 0
      : Math.ceil(remainingAmount / monthsLeft);
    const biweeklyRequired = isCompleted
      ? 0
      : Math.ceil(remainingAmount / biweeksLeft);

    return {
      ...pocket,
      currentAmount,
      progressPercent,
      remainingAmount,
      monthlyRequired,
      biweeklyRequired,
      monthsRemaining: daysRemaining <= 0 ? 0 : monthsLeft,
      isCompleted,
      isOverdue,
    };
  });
}

/**
 * Aggregates monthly income, expenses, and savings for the last N distinct months (up to 6).
 */
export function calculateMonthlyMetrics(
  transactions: Transaction[],
  referenceMonthKey: string,
  monthCount = 6
): MonthlyMetric[] {
  const monthKeys: string[] = [];
  const [refYear, refMonth] = referenceMonthKey.split('-').map(Number);

  for (let i = monthCount - 1; i >= 0; i--) {
    const d = new Date(refYear, refMonth - 1 - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    monthKeys.push(`${y}-${m}`);
  }

  const map = new Map<string, MonthlyMetric>();
  for (const key of monthKeys) {
    map.set(key, {
      monthKey: key,
      label: formatMonthShort(key),
      ingresos: 0,
      gastos: 0,
      ahorro: 0,
    });
  }

  for (const tx of transactions) {
    const key = tx.date.slice(0, 7);
    const entry = map.get(key);
    if (!entry) continue;

    if (tx.type === 'income') {
      entry.ingresos += tx.amount;
      entry.ahorro += tx.retainedAmount ?? 0;
    } else if (tx.type === 'expense') {
      entry.gastos += tx.amount;
      entry.ahorro += tx.roundUpAmount ?? 0;
    } else if (tx.type === 'transfer') {
      entry.ahorro += tx.amount;
    }
  }

  return Array.from(map.values());
}

/**
 * Aggregates expense breakdown by category for a given month (or 'all').
 */
export function calculateCategoryBreakdown(
  transactions: Transaction[],
  monthFilter: string
): CategoryBreakdownItem[] {
  const totals = new Map<string, number>();
  let totalExpense = 0;

  for (const tx of transactions) {
    if (tx.type !== 'expense') continue;
    if (monthFilter !== 'all' && tx.date.slice(0, 7) !== monthFilter) continue;

    totals.set(tx.category, (totals.get(tx.category) ?? 0) + tx.amount);
    totalExpense += tx.amount;
  }

  const items: CategoryBreakdownItem[] = Array.from(totals.entries())
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 1000) / 10 : 0,
      color: getCategoryColor(category),
      bucket: getDefaultBucketForCategory(category),
    }))
    .sort((a, b) => b.amount - a.amount);

  return items;
}

/**
 * Computes 50/30/20 rule adherence for a selected month (or all months).
 */
export function calculateRule503020(
  transactions: Transaction[],
  monthFilter: string
): Rule503020Summary {
  let ingresos = 0;
  let needsAmount = 0;
  let wantsAmount = 0;
  let savingsAmount = 0;

  for (const tx of transactions) {
    if (monthFilter !== 'all' && tx.date.slice(0, 7) !== monthFilter) continue;

    if (tx.type === 'income') {
      ingresos += tx.amount;
      savingsAmount += tx.retainedAmount ?? 0;
    } else if (tx.type === 'expense') {
      const bucket = tx.bucket ?? getDefaultBucketForCategory(tx.category);
      if (bucket === 'needs') {
        needsAmount += tx.amount;
      } else {
        wantsAmount += tx.amount;
      }
      savingsAmount += tx.roundUpAmount ?? 0;
    } else if (tx.type === 'transfer') {
      savingsAmount += tx.amount;
    }
  }

  // Without income there is no valid base for the 50/30/20 comparison.
  const denominator = ingresos;

  const pct = (val: number) =>
    denominator > 0 ? Math.round((val / denominator) * 1000) / 10 : 0;

  return {
    referenceIncome: ingresos,
    needsAmount,
    needsPercent: pct(needsAmount),
    wantsAmount,
    wantsPercent: pct(wantsAmount),
    savingsAmount,
    savingsPercent: pct(savingsAmount),
  };
}
